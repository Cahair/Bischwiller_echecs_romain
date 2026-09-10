import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Les comptes vivent hors du dépôt, dans `data/admin/users.json`, écrit par
 * `pnpm admin:user` et par la page « Comptes ». Le mot de passe n’est jamais
 * stocké : seul le condensé `scrypt:<sel hex>:<empreinte hex>` l’est, au même
 * format que celui produit par `scripts/admin/user.mjs`.
 */
export const ADMIN_DATA_DIR = path.join(process.cwd(), "data", "admin");
const USERS_FILE = path.join(ADMIN_DATA_DIR, "users.json");
const KEY_LENGTH = 64;

/** Mêmes règles que `scripts/admin/user.mjs`. */
export const LOGIN_PATTERN = /^[a-z0-9._-]{3,32}$/;
export const MIN_PASSWORD_LENGTH = 10;

/**
 * `admin` gère aussi les comptes, `redacteur` écrit et publie. Un compte sans
 * rôle a été créé en ligne de commande, par qui tient le serveur : il est
 * administrateur.
 */
export type AdminRole = "admin" | "redacteur";
export type AdminUser = { login: string; name: string; passwordHash: string; role: AdminRole };

export function readAdminUsers(): AdminUser[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(USERS_FILE, "utf8"));
    const users = (parsed as { users?: unknown }).users;
    if (!Array.isArray(users)) return [];
    return users
      .filter((user) => typeof user?.login === "string" && typeof user?.name === "string" && typeof user?.passwordHash === "string")
      .map((user) => ({
        login: user.login,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role === "redacteur" ? "redacteur" : "admin",
      }));
  } catch {
    return []; // Aucun compte créé : l’espace admin refuse toute connexion.
  }
}

/** Écriture atomique : un fichier de comptes à moitié écrit fermerait la porte à tout le monde. */
export function writeJsonAtomic(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, file);
}

export function writeAdminUsers(users: AdminUser[]): void {
  writeJsonAtomic(USERS_FILE, { users });
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  return timingSafeEqual(expected, scryptSync(password, Buffer.from(salt, "hex"), KEY_LENGTH));
}

/**
 * Empreinte courte du mot de passe, glissée dans le cookie de session : quand
 * le mot de passe change, les sessions ouvertes avec l’ancien se ferment.
 */
export function passwordStamp(user: AdminUser): string {
  return createHash("sha256").update(user.passwordHash).digest("base64url").slice(0, 16);
}

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

/** Renvoie le compte si le couple identifiant/mot de passe est valide. */
export function authenticate(login: string, password: string): AdminUser | null {
  const user = readAdminUsers().find((candidate) => candidate.login === normalizeLogin(login));
  // Un scrypt est calculé même sans compte trouvé, pour ne pas révéler par le
  // temps de réponse quels identifiants existent.
  const hash = user?.passwordHash ?? `scrypt:${"00".repeat(16)}:${"00".repeat(KEY_LENGTH)}`;
  const valid = verifyPassword(password, hash);
  return user && valid ? user : null;
}
