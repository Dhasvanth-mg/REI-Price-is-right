import { describe, it, expect } from "vitest";
import {
  acceptGuess,
  pointsFor,
  publicGame,
  rankings,
  settleClock,
  transition,
} from "../lib/engine";
import { defaults, type Game } from "../lib/types";
import { seedProperties } from "../lib/properties";
function game(): Game {
  return {
    code: "123456",
    owner: "host",
    title: "Test",
    revision: 0,
    created: 0,
    started: null,
    phase: "lobby",
    index: 0,
    deadline: null,
    paused: null,
    settings: { ...defaults },
    players: [
      {
        id: "a",
        tokenHash: "secret",
        name: "Alice",
        emoji: "🏡",
        team: "",
        captain: true,
        banned: false,
        joined: 0,
        bonus: 0,
      },
      {
        id: "b",
        tokenHash: "secret-b",
        name: "Bob",
        emoji: "🦊",
        team: "",
        captain: true,
        banned: false,
        joined: 0,
        bonus: 0,
      },
    ],
    rounds: seedProperties.slice(0, 2).map((p) => ({
      property: { ...p, price: 100000 },
      guesses: [],
      scored: false,
    })),
    commands: [],
  };
}
describe("scoring", () => {
  it("keeps last-round points visible after advancing to the next property", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    acceptGuess(g, "a", 100000, "", false, 3000);
    transition(g, "lock", 4000);
    transition(g, "reveal", 5000);
    expect(rankings(g).find((p) => p.id === "a")?.lastRoundPoints).toBe(15);
    transition(g, "leaderboard", 6000);
    transition(g, "next", 7000);
    const p = rankings(g).find((p) => p.id === "a");
    expect(p?.roundPoints).toBe(0);
    expect(p?.lastRoundPoints).toBe(15);
    expect(p?.points).toBe(15);
  });
  it.each([
    [100000, 15],
    [102000, 10],
    [105000, 7],
    [110000, 5],
    [120000, 2],
    [120001, 0],
    [80000, 2],
    [99999, 10],
  ])("scores $%s as %s points", (amount, points) =>
    expect(pointsFor(amount, 100000, defaults).points).toBe(points),
  );
  it("multiplies exact bonus in finale", () =>
    expect(pointsFor(100000, 100000, defaults, true).points).toBe(30));
  it("applies closest-under rule", () =>
    expect(
      pointsFor(100001, 100000, { ...defaults, closestUnder: true }).points,
    ).toBe(0));
});
describe("authoritative rounds", () => {
  it("plays a full round and scores two players", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    acceptGuess(g, "a", 100000, "", false, 3000);
    acceptGuess(g, "b", 110000, "", false, 4000);
    transition(g, "lock", 5000);
    transition(g, "reveal", 6000);
    expect(rankings(g).map((p) => p.points)).toEqual([15, 5]);
    transition(g, "leaderboard", 7000);
    transition(g, "next", 8000);
    expect(g.index).toBe(1);
    expect(g.phase).toBe("intro");
  });
  it("rejects invalid phase transitions", () => {
    expect(() => transition(game(), "reveal")).toThrow();
  });
  it("rejects late, paused, unauthorized and invalid guesses", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    expect(() => acceptGuess(g, "a", 100000, "", false, 47000)).toThrow();
    for (const v of [-1, 0, NaN, Infinity, 1.5, 1e10])
      expect(() => acceptGuess(g, "a", v, "", false, 3000)).toThrow();
    expect(() => acceptGuess(g, "missing", 100000, "", false, 3000)).toThrow();
    transition(g, "pause", 4000);
    expect(() => acceptGuess(g, "a", 100000, "", false, 5000)).toThrow();
    transition(g, "resume", 6000);
    expect(g.deadline).toBe(49000);
  });
  it("edits one official guess instead of duplicating", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    acceptGuess(g, "a", 120000, "", false, 3000);
    acceptGuess(g, "a", 100000, "", false, 4000);
    expect(g.rounds[0].guesses).toHaveLength(1);
    expect(g.rounds[0].guesses[0].amount).toBe(100000);
  });
  it("authorizes only a captain in team mode", () => {
    const g = game();
    g.settings.teamMode = true;
    g.players[0].captain = false;
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    expect(() => acceptGuess(g, "a", 100000, "", false, 3000)).toThrow(
      "captain",
    );
    acceptGuess(g, "b", 100000, "", false, 3000);
  });
  it("hides answers, listing sources, tokens and other guesses", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    acceptGuess(g, "a", 100000, "", false, 3000);
    const view = publicGame(g, "b");
    expect(view.property).not.toHaveProperty("price");
    expect(view.property).not.toHaveProperty("source");
    expect(view.players[0]).not.toHaveProperty("tokenHash");
    expect(view.me?.guess).toBeNull();
    expect(view.leaderboard.every((p) => p.guess === null)).toBe(true);
    expect(JSON.stringify(view)).not.toContain("secret");
    transition(g, "lock", 4000);
    transition(g, "reveal", 5000);
    expect(publicGame(g).property.price).toBe(100000);
  });
  it("locks expired rounds and enforces session length", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    expect(settleClock(g, 47000)).toBe(true);
    expect(g.phase).toBe("locked");
    settleClock(g, 1201000);
    expect(g.phase).toBe("finished");
  });
  it("restarts a round and entire game cleanly", () => {
    const g = game();
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    acceptGuess(g, "a", 100000, "", false, 3000);
    transition(g, "lock", 4000);
    transition(g, "reveal", 5000);
    transition(g, "restartRound", 6000);
    expect(g.rounds[0].scored).toBe(false);
    expect(g.rounds[0].guesses).toHaveLength(0);
    g.players[0].bonus = 5;
    transition(g, "restart", 7000);
    expect(g.phase).toBe("lobby");
    expect(g.players).toHaveLength(2);
    expect(g.players[0].bonus).toBe(0);
  });
  it("ranks non-submissions below guesses and resolves equal points by error", () => {
    const g = game();
    g.rounds[0].scored = true;
    g.rounds[0].guesses = [
      { playerId: "b", amount: 200000, submitted: 1, reason: "", wager: false },
    ];
    expect(rankings(g)[0].id).toBe("b");
    g.rounds[0].guesses.push({
      playerId: "a",
      amount: 100000,
      submitted: 2,
      reason: "",
      wager: false,
    });
    expect(rankings(g)[0].id).toBe("a");
  });
  it("does not allow wagers without existing points", () => {
    const g = game();
    g.settings.wagerEnabled = true;
    transition(g, "start", 1000);
    transition(g, "open", 2000);
    expect(() => acceptGuess(g, "a", 100000, "", true, 3000)).toThrow(
      "Not enough",
    );
  });
});
