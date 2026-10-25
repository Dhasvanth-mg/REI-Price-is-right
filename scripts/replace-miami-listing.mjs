// Replace the old Miami property in the catalog and unstarted lobbies only.
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
process.loadEnvFile(".env.local");
const filename = path.resolve("lib/properties.ts");
const compiled = ts.transpileModule(await readFile(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    resolveJsonModule: true,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const source = new Module(filename);
source.filename = filename;
source.paths = Module._nodeModulePaths(path.dirname(filename));
source._compile(compiled, filename);
const replacement = source.exports.seedProperties.find(
  (p) => p.id === "miami-coral-gables",
);
if (!replacement || replacement.images.length < 5)
  throw new Error("Replacement property and photos must be prepared first.");
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const isOld = (p) => p.id === "miami" && p.address === "323 NW 56th Ave";
let saved = false;
for (let attempt = 0; attempt < 8 && !saved; attempt++) {
  const { data, error } = await client
    .from("catalog")
    .select("properties")
    .eq("id", 1)
    .single();
  if (error) throw error;
  if (data.properties.some((p) => p.id === replacement.id)) {
    saved = true;
    break;
  }
  if (!data.properties.some(isOld))
    throw new Error(
      "The old Miami listing is not in the catalog. No other property was changed.",
    );
  const properties = data.properties.map((p) => (isOld(p) ? replacement : p));
  const { data: updated, error: updateError } = await client
    .from("catalog")
    .update({ properties })
    .eq("id", 1)
    .eq("properties", JSON.stringify(data.properties))
    .select("id");
  if (updateError) throw updateError;
  saved = updated.length === 1;
}
if (!saved)
  throw new Error("Catalog changed concurrently; retry the replacement.");
const { data: rooms, error } = await client
  .from("games")
  .select("code")
  .eq("state->>phase", "lobby");
if (error) throw error;
let changed = 0;
for (const { code } of rooms) {
  let complete = false;
  for (let attempt = 0; attempt < 8 && !complete; attempt++) {
    const { data, error } = await client
      .from("games")
      .select("state,revision")
      .eq("code", code)
      .single();
    if (error) throw error;
    const game = data.state;
    if (
      game.phase !== "lobby" ||
      game.started !== null ||
      !game.rounds.some((r) => isOld(r.property))
    ) {
      complete = true;
      break;
    }
    game.rounds = game.rounds.map((r) =>
      isOld(r.property) ? { ...r, property: replacement } : r,
    );
    game.revision = data.revision + 1;
    const { data: updated, error: saveError } = await client.rpc("save_game", {
      room_code: code,
      expected_revision: data.revision,
      next_state: game,
    });
    if (saveError) throw saveError;
    if (updated) {
      changed++;
      complete = true;
    }
  }
  if (!complete)
    throw new Error(
      `Room ${code} is busy. Retry to finish updating its lobby.`,
    );
}
console.log(
  `Catalog replaced with ${replacement.address}; ${replacement.images.length} photos. Updated ${changed} waiting lobbies. Started and completed games retain their frozen properties.`,
);
