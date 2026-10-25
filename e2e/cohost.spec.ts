import { test, expect } from "@playwright/test";

test("two independent admin sessions control the same room and reject conflicting commands", async ({
  browser,
  page,
  request,
  baseURL,
}) => {
  await page.goto("/host");
  await page.getByLabel("HOST PASSWORD", { exact: true }).fill("rho2026");
  await page
    .getByRole("button", { name: "Enter host dashboard", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create game room", exact: true })
    .click();
  await expect(page).toHaveURL(/\/host\/\d{6}/);
  const code = page.url().split("/").pop()!;
  const secondContext = await browser.newContext({ baseURL });
  const second = await secondContext.newPage();
  await second.goto("/host");
  await second.getByLabel("HOST PASSWORD", { exact: true }).fill("rho2026");
  await second
    .getByRole("button", { name: "Enter host dashboard", exact: true })
    .click();
  await second
    .getByLabel("Existing game room code", { exact: true })
    .fill(code);
  await second
    .getByRole("button", { name: "Open admin controls", exact: true })
    .click();
  await expect(second).toHaveURL(new RegExp("/host/" + code + "$"));
  await expect(
    second.getByRole("button", { name: "Start the game", exact: true }),
  ).toBeVisible();
  expect(
    (await page.context().cookies()).find((c) => c.name === "rho_host")?.value,
  ).not.toBe(
    (await secondContext.cookies()).find((c) => c.name === "rho_host")?.value,
  );
  expect(
    (
      await request.post(`/api/games/${code}/join`, {
        data: { name: "Shared-room player", emoji: "🏡" },
      })
    ).ok(),
  ).toBe(true);
  const hidden = await (await request.get(`/api/games/${code}?host=1`)).json();
  expect(hidden.isHost).toBe(false);
  expect(hidden.property.price).toBeUndefined();
  expect((await request.get(`/api/games/${code}/export`)).ok()).toBe(false);
  expect(
    (
      await request.post(`/api/games/${code}/control`, {
        data: { action: "start", revision: 0, key: crypto.randomUUID() },
      })
    ).ok(),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Start the game", exact: true })
    .click();
  await expect(
    second.getByRole("button", { name: "Open guessing", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await second
    .getByRole("button", { name: "Open guessing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Lock guesses", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  const before = await (
    await page.request.get(`/api/games/${code}?host=1`)
  ).json();
  const commands = [0, 1].map(() => ({
    action: "lock",
    revision: before.controlRevision,
    key: crypto.randomUUID(),
  }));
  const attempts = await Promise.all([
    page.request.post(`/api/games/${code}/control`, { data: commands[0] }),
    second.request.post(`/api/games/${code}/control`, { data: commands[1] }),
  ]);
  expect(attempts.filter((r) => r.ok())).toHaveLength(1);
  expect(attempts.filter((r) => !r.ok())).toHaveLength(1);
  const winning = commands[attempts[0].ok() ? 0 : 1];
  expect(
    (
      await second.request.post(`/api/games/${code}/control`, { data: winning })
    ).ok(),
  ).toBe(true);
  const after = await (
    await second.request.get(`/api/games/${code}?host=1`)
  ).json();
  expect(after.phase).toBe("locked");
  expect(after.controlRevision).toBe(before.controlRevision + 1);
  expect(after.isHost).toBe(true);
  expect(after.property.price).toBe(319900);
  expect((await second.request.get(`/api/games/${code}/export`)).ok()).toBe(
    true,
  );
  await second.request.post(`/api/games/${code}/control`, {
    data: {
      action: "end",
      revision: after.controlRevision,
      key: crypto.randomUUID(),
    },
  });
  await secondContext.close();
});
