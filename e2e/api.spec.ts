import { test, expect, request as apiRequest } from "@playwright/test";
test("concurrent guesses, host authorization, idempotency, moderation, CSV and answer privacy", async ({
  request,
  baseURL,
}) => {
  const host = await apiRequest.newContext({ baseURL });
  expect(
    (await host.post("/api/login", { data: { password: "rho2026" } })).ok(),
  ).toBe(true);
  const created = await host.post("/api/games", {
    data: { title: "Concurrency test" },
  });
  expect(created.ok()).toBe(true);
  const { code } = await created.json();
  const players = await Promise.all(
    Array.from({ length: 8 }, () => apiRequest.newContext({ baseURL })),
  );
  const joined = await Promise.all(
    players.map((p, i) =>
      p.post(`/api/games/${code}/join`, {
        data: { name: `Appraiser ${i}`, emoji: i === 0 ? "🧑🏽‍🚀" : "🏡" },
      }),
    ),
  );
  expect(joined.every((r) => r.ok())).toBe(true);
  const ids = await Promise.all(joined.map((r) => r.json()));
  async function control(action: string, extra = {}) {
    const view = await (await host.get(`/api/games/${code}?host=1`)).json();
    return host.post(`/api/games/${code}/control`, {
      data: {
        action,
        key: crypto.randomUUID(),
        revision: view.controlRevision,
        ...extra,
      },
    });
  }
  const unauthorized = await request.post(`/api/games/${code}/control`, {
    data: { action: "start", key: crypto.randomUUID(), revision: 0 },
  });
  expect(unauthorized.ok()).toBe(false);
  expect((await control("start")).ok()).toBe(true);
  expect((await control("open")).ok()).toBe(true);
  const key = crypto.randomUUID();
  const guesses = await Promise.all(
    players.map((p, i) =>
      p.post(`/api/games/${code}/guess`, {
        data: {
          amount: 319900 + i * 100,
          key: i === 0 ? key : crypto.randomUUID(),
        },
      }),
    ),
  );
  expect(guesses.every((r) => r.ok())).toBe(true);
  expect(
    (
      await players[0].post(`/api/games/${code}/guess`, {
        data: { amount: 319900, key },
      })
    ).ok(),
  ).toBe(true);
  const publicView = await (await host.get(`/api/games/${code}`)).json();
  expect(publicView.submitted).toBe(8);
  expect(
    publicView.players.find(
      (p: { name: string; emoji: string }) => p.name === "Appraiser 0",
    ).emoji,
  ).toBe("🧑🏽‍🚀");
  expect(publicView.property.price).toBeUndefined();
  expect(publicView.property.source).toBeUndefined();
  expect(
    publicView.players.every(
      (p: Record<string, unknown>) => !("tokenHash" in p),
    ),
  ).toBe(true);
  expect((await control("lock")).ok()).toBe(true);
  expect(
    (
      await players[0].post(`/api/games/${code}/guess`, {
        data: { amount: 1, key: crypto.randomUUID() },
      })
    ).ok(),
  ).toBe(false);
  expect((await control("reveal")).ok()).toBe(true);
  const revealed = await (await players[0].get(`/api/games/${code}`)).json();
  expect(revealed.property.price).toBe(319900);
  expect(revealed.leaderboard[0].points).toBe(15);
  expect(
    (
      await control("rename", {
        playerId: ids[0].id,
        name: "Friendly appraiser",
        emoji: "🫠",
      })
    ).ok(),
  ).toBe(true);
  expect((await control("ban", { playerId: ids[1].id })).ok()).toBe(true);
  expect((await players[1].get(`/api/games/${code}`)).ok()).toBe(false);
  expect((await request.get(`/api/games/${code}/export`)).ok()).toBe(false);
  const csv = await host.get(`/api/games/${code}/export`);
  expect(csv.ok()).toBe(true);
  expect(await csv.text()).toContain("Friendly appraiser");
  await Promise.all(players.map((p) => p.dispose()));
  await host.dispose();
});
