import { readFileSync } from "node:fs";
import path from "node:path";
import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Les comptes vivent hors du dépôt, dans `data/admin/users.json`, écrit par
 * `pnpm admin:user`. Le mot de passe n’est jamais stocké : seul le condensé
 * `scrypt:<sel hex>:<empreinte hex>` l’est, au même format que celui produit
 * par `scripts/admin/user.mjs`.
 */
const USERS_FILE = path.join(process.cwd(), "data", "admin", "users.json");
const KEY_LENGTH = 64;

export type AdminUser = { login: string; name: string; passwordHash: string };

export function readAdminUsers(): AdminUser[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(USERS_FILE, "utf8"));
    const users = (parsed as { users?: unknown }).users;
    if (!Array.isArray(users)) return [];
    return users.filter(
      (user): user is AdminUser =>
        typeof user?.login === "string" && typeof user?.name === "string" && typeof user?.passwordHash === "string",
    );
  } catch {
    return []; // Aucun compte créé : l’espace admin refuse toute connexion.
  }
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  return timingSafeEqual(expected, scryptSync(password, Buffer.from(salt, "hex"), KEY_LENGTH));
}

/** Renvoie le compte si le couple identifiant/mot de passe est valide. */
export function authenticate(login: string, password: string): AdminUser | null {
  const user = readAdminUsers().find((candidate) => candidate.login === login.trim().toLowerCase());
  // Un scrypt est calculé même sans compte trouvé, pour ne pas révéler par le
  // temps de réponse quels identifiants existent.
  const hash = user?.passwordHash ?? `scrypt:${"00".repeat(16)}:${"00".repeat(KEY_LENGTH)}`;
  const valid = verifyPassword(password, hash);
  return user && valid ? user : null;
}
