// Apply the curated 8-photo galleries; replace the old LA listing only before play.
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
process.loadEnvFile(".env.local");
const filename = path.resolve("lib/properties.ts");
const source = new Module(filename);
source.filename = filename;
source.paths = Module._nodeModulePaths(path.dirname(filename));
source._compile(
  ts.transpileModule(await readFile(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      resolveJsonModule: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  filename,
);
const seeds = source.exports.seedProperties;
const byId = new Map(seeds.map((p) => [p.id, p]));
for (const property of seeds)
  if (property.images.length !== 8)
    throw Error(`${property.id}: expected eight curated photos`);
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const oldLA = (p) => p.id === "west" && p.address === "6125 West Blvd";
let updatedCatalog;
for (let i = 0; i < 8 && !updatedCatalog; i++) {
  const { data, error } = await client
    .from("catalog")
    .select("properties")
    .eq("id", 1)
    .single();
  if (error) throw error;
  const properties = data.properties.map((p) =>
    oldLA(p)
      ? byId.get("la-spanish")
      : byId.has(p.id)
        ? { ...p, images: byId.get(p.id).images, facts: byId.get(p.id).facts }
        : p,
  );
  const { data: saved, error: saveError } = await client
    .from("catalog")
    .update({ properties })
    .eq("id", 1)
    .eq("properties", JSON.stringify(data.properties))
    .select("id");
  if (saveError) throw saveError;
  if (saved.length) updatedCatalog = properties;
}
if (!updatedCatalog) throw Error("Catalog is changing. Please retry.");
const { data: rooms, error } = await client.from("games").select("code");
if (error) throw error;
let lobbies = 0,
  photoUpdates = 0;
for (const { code } of rooms) {
  let done = false;
  for (let i = 0; i < 8 && !done; i++) {
    const { data, error } = await client
      .from("games")
      .select("state,revision")
      .eq("code", code)
      .single();
    if (error) throw error;
    const game = data.state;
    let changed = false,
      replaced = false;
    if (game.phase === "finished") {
      done = true;
      break;
    }
    game.rounds = game.rounds.map((round) => {
      const p = round.property;
      if (game.phase === "lobby" && game.started === null && oldLA(p)) {
        changed = true;
        replaced = true;
        return { ...round, property: byId.get("la-spanish") };
      }
      const seed = byId.get(p.id);
      if (
        seed &&
        seed.address === p.address &&
        JSON.stringify(p.images) !== JSON.stringify(seed.images)
      ) {
        changed = true;
        return { ...round, property: { ...p, images: seed.images } };
      }
      return round;
    });
    if (!changed) {
      done = true;
      break;
    }
    game.revision = data.revision + 1;
    const { data: saved, error: saveError } = await client.rpc("save_game", {
      room_code: code,
      expected_revision: data.revision,
      next_state: game,
    });
    if (saveError) throw saveError;
    if (saved) {
      photoUpdates++;
      if (replaced) lobbies++;
      done = true;
    }
  }
  if (!done) throw Error(`Room ${code} is busy. Retry this update.`);
}
console.log(
  JSON.stringify({
    properties: updatedCatalog.length,
    photos: updatedCatalog.reduce((n, p) => n + p.images.length, 0),
    roomsWithNewPhotos: photoUpdates,
    lobbiesWithReplacementLA: lobbies,
  }),
);
