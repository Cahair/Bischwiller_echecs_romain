import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Session sans base de données : le cookie porte lui-même le compte et sa date
 * d’expiration, signés en HMAC-SHA256 avec `ADMIN_SESSION_SECRET`. Changer ce
 * secret invalide toutes les sessions ouvertes.
 */
const COOKIE = "cebi_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export type AdminSession = { login: string; name: string; expiresAt: number };

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET ?? "";
  if (value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET absent ou trop court : 32 caractères minimum (voir .env.example).");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function signatureMatches(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function openSession(user: { login: string; name: string }): Promise<void> {
  const session: AdminSession = { login: user.login, name: user.name, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const store = await cookies();
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function closeSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function readSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = token.slice(0, separator);
  try {
    if (!signatureMatches(payload, token.slice(separator + 1))) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (typeof session?.login !== "string" || typeof session?.expiresAt !== "number") return null;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null; // Cookie tronqué, secret changé ou charge illisible.
  }
}
