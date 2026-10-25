import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* CI may provide variables. */
}
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
)
  throw new Error("Configure Supabase in .env.local first.");
const sourcePath = path.resolve("lib/properties.ts");
const compiled = ts.transpileModule(await readFile(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    resolveJsonModule: true,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const seedModule = new Module(sourcePath);
seedModule.filename = sourcePath;
seedModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
seedModule._compile(compiled, sourcePath);
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { data: existing, error: readError } = await client
  .from("catalog")
  .select("properties")
  .eq("id", 1)
  .maybeSingle();
if (readError) throw readError;
let properties = existing?.properties ?? seedModule.exports.seedProperties;
const assets = JSON.parse(await readFile("lib/listing-assets.json", "utf8"));
properties = properties.map((p) => ({
  ...p,
  images: p.images?.length ? p.images : (assets[p.id] ?? []),
}));
const { error } = await client.from("catalog").upsert({ id: 1, properties });
if (error) throw error;
console.log(
  `Supabase catalog ready: ${properties.length} properties, ${properties.reduce((n, p) => n + p.images.length, 0)} photos. Existing reference prices preserved.`,
);
if (process.argv.includes("--import-local-rooms")) {
  const files = await readdir(".local").catch(() => []);
  let imported = 0;
  for (const file of files.filter((f) => /^game-\d{6}\.json$/.test(f))) {
    const game = JSON.parse(await readFile(path.join(".local", file), "utf8"));
    for (const round of game.rounds)
      if (!round.property.images.length)
        round.property.images = assets[round.property.id] ?? [];
    const { error } = await client
      .from("games")
      .upsert(
        { code: game.code, revision: game.revision, state: game },
        { onConflict: "code", ignoreDuplicates: true },
      );
    if (error) throw error;
    imported++;
  }
  console.log(`Preserved ${imported} local room records in Supabase.`);
}
