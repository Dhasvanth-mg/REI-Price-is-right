import type { Game, Guess, PublicGame, Score, Settings } from "./types";
export function pointsFor(
  amount: number,
  price: number,
  s: Settings,
  final = false,
) {
  const error = (Math.abs(amount - price) / price) * 100;
  const tier = s.thresholds.findIndex((t) => error <= t + 1e-10);
  const base =
    s.closestUnder && amount > price
      ? 0
      : (tier < 0 ? 0 : s.points[tier]) + (amount === price ? s.exactBonus : 0);
  return { error, points: base * (final ? s.finalMultiplier : 1) };
}
export function rankings(g: Game): Score[] {
  return g.players
    .filter((p) => !p.banned && (!g.settings.teamMode || p.captain))
    .map((p) => {
      let points = p.bonus,
        error = 0,
        exact = 0,
        submitted = 0,
        streak = 0,
        roundPoints = 0;
      let current: Guess | undefined;
      g.rounds.forEach((r, i) => {
        if (!r.scored) return;
        const q = r.guesses.find((q) => q.playerId === p.id);
        let gained = 0;
        if (q) {
          const result = pointsFor(
            q.amount,
            r.property.price,
            g.settings,
            i === g.rounds.length - 1,
          );
          gained = result.points;
          if (q.wager)
            gained +=
              result.error <= g.settings.wagerThreshold
                ? g.settings.wagerPoints
                : -g.settings.wagerPoints;
          error += result.error;
          exact += Number(q.amount === r.property.price);
          submitted++;
        }
        points += gained;
        streak = gained >= 5 ? streak + 1 : 0;
        if (i === g.index) {
          roundPoints = gained;
          current = q;
        }
      });
      return {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        team: p.team,
        points,
        roundPoints,
        error: submitted ? error / submitted : Infinity,
        exact,
        submitted,
        streak,
        guess: current?.amount ?? null,
        difference: current
          ? current.amount - g.rounds[g.index].property.price
          : null,
        percentage: current
          ? (Math.abs(current.amount - g.rounds[g.index].property.price) /
              g.rounds[g.index].property.price) *
            100
          : null,
        rank: 0,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        (a.submitted ? a.error * a.submitted : Infinity) -
          (b.submitted ? b.error * b.submitted : Infinity) ||
        b.exact - a.exact ||
        b.submitted - a.submitted ||
        a.name.localeCompare(b.name),
    )
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
export function settleClock(g: Game, now = Date.now()) {
  if (
    g.started &&
    g.phase !== "finished" &&
    now >= g.started + g.settings.sessionMinutes * 60000
  ) {
    if (g.phase === "guessing" || g.phase === "locked" || g.phase === "reveal")
      g.rounds[g.index].scored = true;
    g.phase = "finished";
    g.deadline = null;
    g.paused = null;
    return true;
  }
  if (g.phase === "guessing" && g.deadline !== null && now >= g.deadline) {
    g.phase = "locked";
    g.deadline = null;
    return true;
  }
  return false;
}
export function transition(g: Game, action: string, now = Date.now()) {
  settleClock(g, now);
  const phase = g.phase;
  const need = (...phases: string[]) => {
    if (!phases.includes(phase))
      throw new Error("That action is not available in this phase.");
  };
  switch (action) {
    case "start":
      need("lobby");
      if (!g.players.some((p) => !p.banned))
        throw new Error("Invite at least one player first.");
      g.started = now;
      g.phase = "intro";
      break;
    case "open":
      need("intro");
      g.phase = "guessing";
      g.deadline = now + g.settings.roundSeconds * 1000;
      break;
    case "pause":
      need("guessing");
      if (g.paused !== null) throw new Error("Already paused.");
      g.paused = Math.max(0, (g.deadline ?? now) - now);
      g.deadline = null;
      break;
    case "resume":
      need("guessing");
      if (g.paused === null) throw new Error("Timer is running.");
      g.deadline = now + g.paused;
      g.paused = null;
      break;
    case "lock":
      need("guessing");
      g.phase = "locked";
      g.deadline = null;
      g.paused = null;
      break;
    case "reveal":
      need("locked");
      g.rounds[g.index].scored = true;
      g.phase = "reveal";
      break;
    case "leaderboard":
      need("reveal");
      g.phase = "leaderboard";
      break;
    case "next":
      need("leaderboard");
      if (g.index === g.rounds.length - 1) g.phase = "finished";
      else {
        g.index++;
        g.phase = "intro";
      }
      break;
    case "skip":
      need("intro", "guessing", "locked");
      g.rounds[g.index].guesses = [];
      g.rounds[g.index].scored = true;
      g.phase = "leaderboard";
      g.deadline = null;
      g.paused = null;
      break;
    case "restartRound":
      need("intro", "guessing", "locked", "reveal", "leaderboard");
      g.rounds[g.index].guesses = [];
      g.rounds[g.index].scored = false;
      g.phase = "intro";
      g.deadline = null;
      g.paused = null;
      break;
    case "restart":
      g.rounds.forEach((r) => {
        r.guesses = [];
        r.scored = false;
      });
      g.players.forEach((p) => (p.bonus = 0));
      g.index = 0;
      g.phase = "lobby";
      g.started = null;
      g.deadline = null;
      g.paused = null;
      break;
    case "end":
      if (g.phase === "guessing" || g.phase === "locked")
        g.rounds[g.index].scored = true;
      g.phase = "finished";
      g.deadline = null;
      g.paused = null;
      break;
    default:
      throw new Error("Unknown game control.");
  }
}
export function acceptGuess(
  g: Game,
  id: string,
  amount: number,
  reason = "",
  wager = false,
  now = Date.now(),
) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000_000)
    throw new Error("Enter a whole dollar amount between $1 and $1 billion.");
  if (
    g.phase !== "guessing" ||
    g.paused !== null ||
    g.deadline === null ||
    now >= g.deadline ||
    (g.started !== null && now >= g.started + g.settings.sessionMinutes * 60000)
  )
    throw new Error("Guesses are closed.");
  const player = g.players.find((p) => p.id === id && !p.banned);
  if (!player) throw new Error("Player not found.");
  if (g.settings.teamMode && !player.captain)
    throw new Error("Only your team captain can submit.");
  if (
    wager &&
    (!g.settings.wagerEnabled ||
      (rankings(g).find((p) => p.id === id)?.points ?? 0) <
        g.settings.wagerPoints)
  )
    throw new Error("Not enough points for this wager.");
  const r = g.rounds[g.index];
  const q = {
    playerId: id,
    amount,
    reason: g.settings.challenge ? reason.slice(0, 200) : "",
    wager,
    submitted: now,
  };
  r.guesses = r.guesses.filter((q) => q.playerId !== id);
  r.guesses.push(q);
}
export function publicGame(
  g: Game,
  playerId?: string,
  host = false,
): PublicGame {
  const r = g.rounds[g.index],
    revealed = r.scored || host;
  const { price, source, ...property } = r.property;
  const leaderboard = rankings(g);
  const roundLeaderboard = [...leaderboard]
    .sort(
      (a, b) =>
        (a.percentage ?? Infinity) - (b.percentage ?? Infinity) ||
        (r.guesses.find((q) => q.playerId === a.id)?.submitted ?? Infinity) -
          (r.guesses.find((q) => q.playerId === b.id)?.submitted ?? Infinity),
    )
    .map((p, i) => ({ ...p, rank: i + 1 }));
  return {
    code: g.code,
    title: g.title,
    revision: g.revision,
    controlRevision: g.controlRevision ?? 0,
    phase: g.phase,
    index: g.index,
    total: g.rounds.length,
    deadline: g.deadline,
    paused: g.paused,
    sessionDeadline: g.started
      ? g.started + g.settings.sessionMinutes * 60000
      : null,
    serverNow: Date.now(),
    settings: g.settings,
    players: g.players
      .filter((p) => host || !p.banned)
      .map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        team: p.team,
        captain: p.captain,
        banned: p.banned,
        joined: p.joined,
        bonus: p.bonus,
      })),
    property: { ...property, ...(revealed ? { price, source } : {}) },
    submitted: r.guesses.length,
    leaderboard,
    roundLeaderboard,
    me: playerId
      ? {
          id: playerId,
          guess: r.guesses.find((q) => q.playerId === playerId) ?? null,
        }
      : undefined,
    isHost: host,
  };
}
