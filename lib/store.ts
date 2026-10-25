import { createClient } from "@supabase/supabase-js";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  open,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import type { Game, Property } from "./types";
import { seedProperties } from "./properties";
export const configured = () =>
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
export function db() {
  if (!configured()) throw new Error("Supabase is not configured.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
const dir = path.join(process.cwd(), ".local");
async function localRead<T>(key: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(dir, key + ".json"), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
function localOnly() {
  if (
    process.env.VERCEL ||
    (process.env.NODE_ENV === "production" &&
      process.env.ALLOW_LOCAL_STORAGE !== "true")
  )
    throw new Error(
      "Connect Supabase before hosting this game. See the setup guide.",
    );
}
async function localWrite(key: string, value: unknown) {
  await mkdir(dir, { recursive: true });
  const temp = path.join(dir, `${key}.${crypto.randomUUID()}.tmp`);
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, path.join(dir, key + ".json"));
}
async function locked<T>(key: string, fn: () => Promise<T>) {
  await mkdir(dir, { recursive: true });
  const lock = path.join(dir, key + ".lock");
  let handle;
  for (let i = 0; i < 200; i++) {
    try {
      handle = await open(lock, "wx");
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  if (!handle) throw new Error("Room is busy. Please retry.");
  try {
    return await fn();
  } finally {
    await handle.close();
    await unlink(lock);
  }
}
export async function getGame(code: string): Promise<Game | null> {
  if (configured()) {
    const { data, error } = await db()
      .from("games")
      .select("state")
      .eq("code", code)
      .maybeSingle();
    if (error) throw error;
    return data?.state ?? null;
  }
  localOnly();
  return localRead<Game>("game-" + code);
}
export async function createGame(g: Game) {
  if (configured()) {
    const { error } = await db()
      .from("games")
      .insert({ code: g.code, revision: g.revision, state: g });
    if (error) {
      if (error.code === "23505") return false;
      throw error;
    }
    return true;
  }
  localOnly();
  return locked(g.code, async () => {
    if (await getGame(g.code)) return false;
    await localWrite("game-" + g.code, g);
    return true;
  });
}
export async function mutateGame<T>(
  code: string,
  fn: (g: Game) => T,
): Promise<{ game: Game; result: T }> {
  if (!configured()) {
    localOnly();
    return locked(code, async () => {
      const g = await getGame(code);
      if (!g) throw new Error("Room not found. Check the six-digit code.");
      const result = fn(g);
      g.revision++;
      await localWrite("game-" + code, g);
      return { game: g, result };
    });
  }
  for (let i = 0; i < 30; i++) {
    const g = await getGame(code);
    if (!g) throw new Error("Room not found. Check the six-digit code.");
    const rev = g.revision;
    const result = fn(g);
    g.revision++;
    const { data, error } = await db().rpc("save_game", {
      room_code: code,
      expected_revision: rev,
      next_state: g,
    });
    if (error) throw error;
    if (data) return { game: g, result };
    await new Promise((r) => setTimeout(r, 10 + Math.random() * 40));
  }
  throw new Error("Room is busy. Please retry.");
}
export async function getCatalog(): Promise<Property[]> {
  if (configured()) {
    const { data, error } = await db()
      .from("catalog")
      .select("properties")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return data?.properties ?? seedProperties;
  }
  localOnly();
  return (
    (await localRead<Property[]>("catalog")) ?? structuredClone(seedProperties)
  );
}
export async function saveCatalog(properties: Property[]) {
  if (configured()) {
    const { error } = await db().from("catalog").upsert({ id: 1, properties });
    if (error) throw error;
    return;
  }
  localOnly();
  await locked("catalog", () => localWrite("catalog", properties));
}
export async function rateLimit(key: string, limit: number, seconds = 60) {
  if (configured()) {
    const { data, error } = await db().rpc("consume_rate_limit", {
      bucket_key: key,
      max_hits: limit,
      window_seconds: seconds,
    });
    if (error) throw error;
    if (!data) throw new Error("Too many requests. Try again in a minute.");
    return;
  }
  localOnly();
  await locked("rate", async () => {
    const now = Date.now();
    const buckets =
      (await localRead<Record<string, { time: number; hits: number }>>(
        "rates",
      )) ?? {};
    for (const k of Object.keys(buckets))
      if (buckets[k].time < now - 3600000) delete buckets[k];
    const b = buckets[key];
    if (!b || now - b.time > seconds * 1000)
      buckets[key] = { time: now, hits: 1 };
    else {
      b.hits++;
      if (b.hits > limit)
        throw new Error("Too many requests. Try again in a minute.");
    }
    await localWrite("rates", buckets);
  });
}
