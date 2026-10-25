import { z } from "zod";

export function isEmojiAvatar(value: string) {
  const parts = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
  );
  return (
    parts.length >= 1 &&
    parts.length <= 3 &&
    parts.every(({ segment }) =>
      /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3/u.test(
        segment,
      ),
    )
  );
}

export const avatarSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s/gu, ""))
  .pipe(
    z
      .string()
      .min(1)
      .max(64)
      .refine(
        isEmojiAvatar,
        "Use 1–3 emojis. Flags, skin tones, and combined emojis all work.",
      ),
  );
