import { describe, it, expect } from "vitest";
import { avatarSchema } from "../lib/emoji";
describe("custom emoji avatars", () => {
  it.each(["🫠", "🧑🏽‍🚀", "👨‍👩‍👧‍👦", "🇺🇸", "🏳️‍⚧️", "1️⃣", "❤️", "🦖💸🔥"])(
    "accepts %s without restricting to presets",
    (value) => expect(avatarSchema.parse(value)).toBe(value),
  );
  it("removes spaces between emojis", () =>
    expect(avatarSchema.parse(" 🐈 💸 ")).toBe("🐈💸"));
  it.each(["", "hello", "<script>", "💸hello", "🐈🐈🐈🐈", "\u0000"])(
    "rejects invalid avatar %j",
    (value) => expect(avatarSchema.safeParse(value).success).toBe(false),
  );
});
