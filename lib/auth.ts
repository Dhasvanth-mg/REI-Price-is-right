import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export const token = () => randomBytes(32).toString("hex");
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production")
    throw new Error("Set SESSION_SECRET before deploying.");
  return "local-development-session-key-change-before-hosting";
}
export function sign(v: string) {
  return createHmac("sha256", secret()).update(v).digest("hex");
}
export function equal(a: string, b: string) {
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}
export async function hostId() {
  const value = (await cookies()).get("rho_host")?.value;
  if (!value) return null;
  const [id, expires, sig] = value.split(".");
  if (
    !id ||
    !expires ||
    !sig ||
    Date.now() > Number(expires) ||
    !equal(sign(id + "." + expires), sig)
  )
    return null;
  return id;
}
export async function requireHost() {
  const id = await hostId();
  if (!id) throw new Error("Sign in to host this game.");
  return id;
}
export async function setCookie(
  name: string,
  value: string,
  maxAge = 86400 * 7,
) {
  (await cookies()).set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}
export async function playerToken(code: string) {
  return (await cookies()).get("rho_player_" + code)?.value;
}
