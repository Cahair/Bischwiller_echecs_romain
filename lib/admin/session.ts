import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { passwordStamp, readAdminUsers, type AdminRole, type AdminUser } from "@/lib/admin/users";

/**
 * Session sans base de données : le cookie porte le compte et sa date
 * d’expiration, signés en HMAC-SHA256 avec `ADMIN_SESSION_SECRET`. Changer ce
 * secret invalide toutes les sessions ouvertes.
 *
 * Le cookie porte aussi une empreinte du mot de passe, et chaque lecture
 * revérifie le compte : retirer l’accès à quelqu’un, ou changer son mot de
 * passe, ferme aussitôt ses sessions sans attendre qu’elles expirent.
 */
const COOKIE = "cebi_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

type SessionPayload = { login: string; stamp: string; expiresAt: number };
export type AdminSession = { login: string; name: string; role: AdminRole; expiresAt: number };

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

export async function openSession(user: AdminUser): Promise<void> {
  const session: SessionPayload = {
    login: user.login,
    stamp: passwordStamp(user),
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
  };
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
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof session.login !== "string" || typeof session.stamp !== "string" || typeof session.expiresAt !== "number") return null;
    if (session.expiresAt <= Date.now()) return null;
    const user = readAdminUsers().find((candidate) => candidate.login === session.login);
    if (!user || passwordStamp(user) !== session.stamp) return null;
    return { login: user.login, name: user.name, role: user.role, expiresAt: session.expiresAt };
  } catch {
    return null; // Cookie tronqué, secret changé ou charge illisible.
  }
}

/** Pour les pages et actions réservées à qui gère les comptes. */
export async function readAdminSession(): Promise<AdminSession | null> {
  const session = await readSession();
  return session?.role === "admin" ? session : null;
}
