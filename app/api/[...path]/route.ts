import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt, randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  createGame,
  getGame,
  mutateGame,
  getCatalog,
  saveCatalog,
  configured,
  db,
  rateLimit,
} from "@/lib/store";
import {
  hash,
  hostId,
  requireHost,
  playerToken,
  setCookie,
  sign,
  equal,
  token,
} from "@/lib/auth";
import {
  acceptGuess,
  publicGame,
  settleClock,
  transition,
  rankings,
} from "@/lib/engine";
import { defaults, emojis, type Game, type Property } from "@/lib/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const codeSchema = z.string().regex(/^\d{6}$/, "Enter a six-digit room code.");
const settingsSchema = z.object({
  roundSeconds: z.number().int().min(10).max(300),
  sessionMinutes: z.number().int().min(5).max(180),
  roundCount: z.number().int().min(1).max(50),
  finalMultiplier: z.number().min(1).max(5),
  exactBonus: z.number().int().min(0).max(100),
  thresholds: z
    .array(z.number().min(0).max(100))
    .length(4)
    .refine(
      (a) => a.every((v, i) => i === 0 || v > a[i - 1]),
      "Thresholds must increase.",
    ),
  points: z.array(z.number().int().min(0).max(100)).length(4),
  filterNames: z.boolean(),
  teamMode: z.boolean(),
  closestUnder: z.boolean(),
  challenge: z.boolean(),
  wagerEnabled: z.boolean(),
  wagerPoints: z.number().int().min(1).max(50),
  wagerThreshold: z.number().min(0).max(100),
});
const propertySchema = z.object({
  id: z.string().min(1).max(80),
  address: z.string().min(1).max(160),
  city: z.string().min(1).max(100),
  category: z.string().min(1).max(80),
  price: z.number().int().positive().max(1e9),
  beds: z.number().min(0).max(100).nullable(),
  baths: z.number().min(0).max(100).nullable(),
  sqft: z.number().positive().nullable(),
  acres: z.number().positive().optional(),
  type: z.string().min(1).max(100),
  facts: z.array(z.string().max(200)).max(10),
  images: z
    .array(
      z
        .string()
        .max(2048)
        .refine(
          (v) =>
            v.startsWith("/api/photo/") ||
            /^\/listings\/[a-z0-9-]+\/[0-9]+\.(jpg|png|webp)$/.test(v) ||
            /^https:\/\//.test(v),
          "Use an HTTPS image URL.",
        ),
    )
    .max(20),
  source: z.url(),
});
function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function safeName(name: string, filter: boolean) {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\p{C}<>]/gu, "")
    .trim();
  if (cleaned.length < 2 || cleaned.length > 24)
    throw new Error("Choose a name between 2 and 24 characters.");
  if (
    filter &&
    /\b(fuck|shit|bitch|cunt|nigger|faggot|asshole)\b/i.test(cleaned)
  )
    throw new Error("Choose a different display name.");
  return cleaned;
}
async function authorizedGame(code: string) {
  const g = await getGame(code);
  if (!g) throw new Error("Room not found.");
  const owner = await requireHost();
  if (g.owner !== owner) throw new Error("This room belongs to another host.");
  return g;
}
async function handle(req: NextRequest, segments: string[]) {
  const [resource, code, action] = segments;
  if (req.method === "GET") {
    if (resource === "status")
      return response({
        host: !!(await hostId()),
        storage: configured() ? "supabase" : "local",
      });
    if (resource === "catalog") {
      await requireHost();
      return response(await getCatalog());
    }
    if (
      resource === "photo" &&
      /^[a-f0-9-]+\.(jpg|png|webp)$/.test(code ?? "")
    ) {
      const bytes = await readFile(
        path.join(process.cwd(), ".local", "photos", code),
      );
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": code.endsWith(".jpg")
            ? "image/jpeg"
            : code.endsWith(".png")
              ? "image/png"
              : "image/webp",
          "Cache-Control": "public,max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (resource === "games") {
      codeSchema.parse(code);
      const initial = await getGame(code);
      if (!initial)
        throw new Error("Room not found. Check the six-digit code.");
      let g = initial;
      if (settleClock(structuredClone(g)))
        g = (await mutateGame(code, (x) => settleClock(x))).game;
      const host =
        (await hostId()) === g.owner &&
        (req.nextUrl.searchParams.get("host") === "1" || action === "export");
      const session = await playerToken(code);
      const p = session
        ? g.players.find((p) => p.tokenHash === hash(session))
        : undefined;
      if (action === "export") {
        if (!host) throw new Error("Host access required.");
        const csv = (v: unknown) =>
          '"' +
          String(v ?? "")
            .replace(/^[=+\-@\t\r]/, "'$&")
            .replaceAll('"', '""') +
          '"';
        return new NextResponse(
          [
            "Rank,Name,Team,Points,Average error,Exact guesses,Rounds",
            ...rankings(g).map((p) =>
              [
                p.rank,
                p.name,
                p.team,
                p.points,
                Number.isFinite(p.error) ? p.error.toFixed(2) : "",
                p.exact,
                p.submitted,
              ]
                .map(csv)
                .join(","),
            ),
          ].join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="rho-${code}-results.csv"`,
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (p?.banned)
        throw new Error("The host has removed you from this game.");
      return response(publicGame(g, p?.id, host));
    }
  }
  if (req.method !== "POST") return response({ error: "Not found" }, 404);
  const origin = req.headers.get("origin");
  if (
    origin &&
    origin !== req.nextUrl.origin &&
    new URL(origin).host !== req.headers.get("host")
  )
    return response({ error: "Invalid request origin." }, 403);
  const ip = hash(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local",
  );
  if (resource === "upload") {
    await requireHost();
    await rateLimit("upload:" + ip, 30);
    const form = await req.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    )
      throw new Error("Upload a JPG, PNG, or WebP under 8 MB.");
    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : "webp";
    const name = randomUUID() + "." + ext;
    const bytes = Buffer.from(await file.arrayBuffer());
    if (configured()) {
      const { error } = await db()
        .storage.from("property-photos")
        .upload(name, bytes, { contentType: file.type });
      if (error) throw error;
      return response({
        url: db().storage.from("property-photos").getPublicUrl(name).data
          .publicUrl,
      });
    }
    await mkdir(path.join(process.cwd(), ".local", "photos"), {
      recursive: true,
    });
    await writeFile(path.join(process.cwd(), ".local", "photos", name), bytes);
    return response({ url: "/api/photo/" + name });
  }
  const raw = await req.text();
  if (raw.length > 150000) throw new Error("Request too large.");
  const body = JSON.parse(raw || "{}");
  if (resource === "login") {
    await rateLimit("login:" + ip, 10, 300);
    const { password } = z
      .object({ password: z.string().max(200) })
      .parse(body);
    const expected =
      process.env.ADMIN_PASSWORD ||
      (process.env.NODE_ENV !== "production" ? "rho2026" : "");
    if (!expected) throw new Error("Set ADMIN_PASSWORD before deploying.");
    if (!equal(password, expected))
      return response({ error: "Incorrect host password." }, 401);
    const id = (await hostId()) ?? randomUUID();
    const expiry = Date.now() + 86400000 * 7;
    await setCookie("rho_host", `${id}.${expiry}.${sign(id + "." + expiry)}`);
    return response({ ok: true });
  }
  if (resource === "logout") {
    (await cookies()).delete("rho_host");
    return response({ ok: true });
  }
  if (resource === "catalog") {
    await requireHost();
    const properties = z.array(propertySchema).min(1).max(50).parse(body);
    if (new Set(properties.map((p) => p.id)).size !== properties.length)
      throw new Error("Property IDs must be unique.");
    await saveCatalog(properties as Property[]);
    return response({ ok: true });
  }
  if (resource === "games" && !code) {
    const owner = await requireHost();
    await rateLimit("create:" + owner, 20);
    const s = settingsSchema.parse({ ...defaults, ...body.settings });
    const properties = await getCatalog();
    s.roundCount = Math.min(s.roundCount, properties.length);
    for (let i = 0; i < 20; i++) {
      const room = String(randomInt(100000, 1000000));
      const g: Game = {
        code: room,
        owner,
        title: z
          .string()
          .min(1)
          .max(80)
          .parse(body.title ?? "The Rho Open House"),
        revision: 0,
        created: Date.now(),
        started: null,
        phase: "lobby",
        index: 0,
        deadline: null,
        paused: null,
        settings: s,
        players: [],
        rounds: properties.slice(0, s.roundCount).map((p) => ({
          property: structuredClone(p),
          guesses: [],
          scored: false,
        })),
        commands: [],
      };
      if (await createGame(g)) return response({ code: room });
    }
    throw new Error("Could not create a unique room. Try again.");
  }
  if (resource === "games" && code) {
    codeSchema.parse(code);
    if (action === "join") {
      await rateLimit("join:" + ip, 30);
      const input = z
        .object({
          name: z.string(),
          emoji: z.enum(emojis as [string, ...string[]]),
          team: z.string().max(24).default(""),
        })
        .parse(body);
      const session = (await playerToken(code)) ?? token();
      const id = randomUUID();
      const { result } = await mutateGame(code, (g) => {
        settleClock(g);
        const existing = g.players.find((p) => p.tokenHash === hash(session));
        if (existing) {
          if (existing.banned)
            throw new Error("The host has removed you from this game.");
          return existing.id;
        }
        if (g.phase !== "lobby")
          throw new Error("This game has already started. Join the next room.");
        if (g.players.length >= 100) throw new Error("This room is full.");
        const name = safeName(input.name, g.settings.filterNames);
        if (
          g.players.some(
            (p) => !p.banned && p.name.toLowerCase() === name.toLowerCase(),
          )
        )
          throw new Error("That name is taken. Try another.");
        const team = g.settings.teamMode
          ? safeName(input.team, g.settings.filterNames)
          : "";
        g.players.push({
          id,
          tokenHash: hash(session),
          name,
          emoji: input.emoji,
          team,
          captain:
            !g.settings.teamMode ||
            !g.players.some(
              (p) => !p.banned && p.team.toLowerCase() === team.toLowerCase(),
            ),
          banned: false,
          bonus: 0,
          joined: Date.now(),
        });
        return id;
      });
      await setCookie("rho_player_" + code, session);
      return response({ id: result, code });
    }
    if (action === "guess") {
      const session = await playerToken(code);
      if (!session) throw new Error("Join this room first.");
      await rateLimit("guess:" + hash(session), 60);
      const input = z
        .object({
          amount: z.number().int().positive().max(1e9),
          reason: z.string().max(200).default(""),
          wager: z.boolean().default(false),
          key: z.string().uuid(),
        })
        .parse(body);
      const { game } = await mutateGame(code, (g) => {
        const p = g.players.find(
          (p) => p.tokenHash === hash(session) && !p.banned,
        );
        if (!p) throw new Error("Join this room first.");
        if (g.commands.includes(input.key)) return;
        acceptGuess(g, p.id, input.amount, input.reason, input.wager);
        g.commands.push(input.key);
        g.commands = g.commands.slice(-1000);
      });
      return response({ ok: true, revision: game.revision });
    }
    if (action === "control") {
      const owner = await requireHost();
      await authorizedGame(code);
      await rateLimit("control:" + owner, 120);
      const input = z
        .object({
          action: z.string(),
          key: z.string().uuid(),
          revision: z.number().int(),
          playerId: z.string().optional(),
          name: z.string().optional(),
          emoji: z.string().optional(),
          bonus: z.number().int().min(-100).max(100).optional(),
        })
        .parse(body);
      const { game } = await mutateGame(code, (g) => {
        if (g.owner !== owner) throw new Error("Host access required.");
        if (g.commands.includes(input.key)) return;
        if ((g.controlRevision ?? 0) !== input.revision)
          throw new Error("The room changed. Please try again.");
        if (["ban", "rename", "bonus"].includes(input.action)) {
          const p = g.players.find((p) => p.id === input.playerId);
          if (!p) throw new Error("Player not found.");
          if (input.action === "ban") {
            p.banned = true;
            g.rounds.forEach(
              (r) => (r.guesses = r.guesses.filter((q) => q.playerId !== p.id)),
            );
            if (g.settings.teamMode && p.captain) {
              const next = g.players.find(
                (x) =>
                  !x.banned && x.team.toLowerCase() === p.team.toLowerCase(),
              );
              if (next) next.captain = true;
            }
          }
          if (input.action === "rename") {
            const name = safeName(
              input.name ?? "Player",
              g.settings.filterNames,
            );
            if (
              g.players.some(
                (x) =>
                  x.id !== p.id &&
                  !x.banned &&
                  x.name.toLowerCase() === name.toLowerCase(),
              )
            )
              throw new Error("That name is taken.");
            p.name = name;
            p.emoji = emojis.includes(input.emoji ?? "") ? input.emoji! : "🏡";
          }
          if (input.action === "bonus") p.bonus += input.bonus ?? 0;
        } else transition(g, input.action);
        g.controlRevision = (g.controlRevision ?? 0) + 1;
        g.commands.push(input.key);
        g.commands = g.commands.slice(-1000);
      });
      return response(publicGame(game, undefined, true));
    }
  }
  return response({ error: "Not found" }, 404);
}
async function route(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    return await handle(req, (await ctx.params).path);
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues[0]?.message
        : e instanceof Error
          ? e.message
          : "Something went wrong. Please retry.";
    return response({ error: message }, 400);
  }
}
export { route as GET, route as POST };
