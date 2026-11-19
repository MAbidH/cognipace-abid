import { cookies } from "next/headers";
import { safeEqual, sessionValue, studentToken } from "./guard";

export async function isStudent() {
  const c = (await cookies()).get("st")?.value;
  return safeEqual(c, sessionValue("student", studentToken()));
}

export async function isGuardian() {
  const c = (await cookies()).get("gd")?.value;
  return safeEqual(c, sessionValue("guardian", process.env.GUARDIAN_PASSWORD));
}

// Guardian cookie stays SameSite=strict. The student cookie is "lax" so her link works when opened
// from an email or chat app (strict cookies are withheld on that first cross-site arrival). Lax still
// blocks cross-site POSTs, and every API route also enforces the same-origin check.
export const cookieOpts = (maxAge, sameSite = "strict") => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite, path: "/", maxAge });
