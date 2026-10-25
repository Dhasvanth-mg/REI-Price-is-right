import { test, expect } from "@playwright/test";
test("host and two players complete a round, moderate, and reconnect", async ({
  browser,
  page,
}) => {
  await page.goto("/host");
  await page.getByLabel("HOST PASSWORD").fill("rho2026");
  await page.getByRole("button", { name: "Enter host dashboard" }).click();
  await page.getByRole("button", { name: "Create game room" }).click();
  await expect(page).toHaveURL(/\/host\/\d{6}/);
  const code = page.url().split("/").pop()!;
  const baseURL = new URL(page.url()).origin;
  const a = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
  });
  const b = await browser.newContext({ baseURL });
  const alice = await a.newPage();
  const bob = await b.newPage();
  for (const [p, name] of [
    [alice, "Alice"],
    [bob, "Bob"],
  ] as const) {
    await p.goto("/play/" + code);
    await p.getByLabel("Your display name").fill(name);
    await p
      .getByLabel("Your emoji", { exact: true })
      .fill(name === "Alice" ? "👩🏽‍🚀" : "🫠");
    await p.getByRole("button", { name: "I’m in", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Players", exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByText("2 PLAYERS")).toBeVisible();
  await page
    .getByRole("button", { name: "Start the game", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open guessing", exact: true })
    .click();
  for (const [p, value] of [
    [alice, "319900"],
    [bob, "350000"],
  ] as const) {
    await expect(p.getByLabel("Your dollar estimate")).toBeEnabled();
    await p.getByLabel("Your dollar estimate").fill(value);
    await p.getByRole("button", { name: "Submit my guess" }).click();
    await expect(p.getByText(/submitted. You can edit/)).toBeVisible();
  }
  const view = await alice.request.get("/api/games/" + code);
  expect((await view.json()).property.price).toBeUndefined();
  await alice.reload();
  await expect(
    alice.getByRole("button", { name: "Update my guess" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lock guesses", exact: true }).click();
  await page
    .getByRole("button", { name: "Reveal the price", exact: true })
    .click();
  await expect(
    alice.getByRole("heading", { name: "$319,900", exact: true }),
  ).toBeVisible();
  await expect(alice.getByText("+15 points", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Show leaderboard", exact: true })
    .click();
  await expect(
    bob.getByRole("heading", { name: "Round complete" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Next property", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "534 Clarence Ave" }),
  ).toBeVisible();
  await expect(
    alice.getByRole("heading", { name: "534 Clarence Ave" }),
  ).toBeVisible();
  await a.close();
  await b.close();
});
