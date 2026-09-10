import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ADMIN_DATA_DIR,
  hashPassword,
  LOGIN_PATTERN,
  MIN_PASSWORD_LENGTH,
  normalizeLogin,
  readAdminUsers,
  writeAdminUsers,
  writeJsonAtomic,
  type AdminRole,
  type AdminUser,
} from "@/lib/admin/users";

/**
 * Liens d’accès à usage unique : une invitation crée un compte, une
 * réinitialisation remplace le mot de passe d’un compte existant. Le membre
 * choisit lui-même son mot de passe : personne d’autre ne le connaît jamais,
 * et le lien peut voyager par e-mail ou SMS sans rien révéler de réutilisable.
 *
 * Seule l’empreinte SHA-256 du jeton est conservée : lire ce fichier ne suffit
 * pas à se servir d’un lien. Ouvrir le lien ne le consomme pas — les
 * messageries l’ouvrent pour en afficher l’aperçu —, seul l’envoi du
 * formulaire le fait.
 */
const INVITATIONS_FILE = path.join(ADMIN_DATA_DIR, "invitations.json");
export const LINK_VALIDITY_DAYS = 7;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const EXPIRED_LINK =
  "Ce lien n’est plus valable : il a déjà servi, ou il a expiré. Demandez-en un nouveau à la personne qui vous l’a envoyé.";

export type LinkKind = "invitation" | "reinitialisation";
export type AccessLink = {
  id: string;
  tokenHash: string;
  kind: LinkKind;
  login: string;
  name: string;
  role: AdminRole;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
};

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

function readLinks(): AccessLink[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(INVITATIONS_FILE, "utf8"));
    const links = (parsed as { invitations?: unknown }).invitations;
    return Array.isArray(links) ? (links as AccessLink[]) : [];
  } catch {
    return [];
  }
}

function writeLinks(links: AccessLink[]): void {
  writeJsonAtomic(INVITATIONS_FILE, { invitations: links });
}

/** Les liens encore utilisables, les plus récents d’abord. Les expirés disparaissent à la prochaine écriture. */
export function listAccessLinks(now = Date.now()): AccessLink[] {
  return readLinks()
    .filter((link) => link.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function accessLinkPath(token: string): string {
  return `/admin/invitation/${token}`;
}

/**
 * Crée un lien et renvoie son jeton, qui ne sera plus jamais lisible ensuite :
 * c’est maintenant qu’il faut le transmettre. Un nouveau lien pour le même
 * identifiant remplace le précédent.
 */
export function createAccessLink(input: {
  kind: LinkKind;
  login: string;
  name: string;
  role: AdminRole;
  createdBy: string;
}): { token: string; link: AccessLink } {
  const login = normalizeLogin(input.login);
  const name = input.name.trim().replace(/\s+/g, " ");
  if (input.kind === "invitation" && !name) throw new Error("Indiquez le prénom et le nom du membre.");
  if (!LOGIN_PATTERN.test(login)) {
    throw new Error("L’identifiant doit compter 3 à 32 caractères : lettres sans accent, chiffres, point ou tiret.");
  }
  const exists = readAdminUsers().some((user) => user.login === login);
  if (input.kind === "invitation" && exists) throw new Error(`L’identifiant « ${login} » est déjà pris : choisissez-en un autre.`);
  if (input.kind === "reinitialisation" && !exists) throw new Error(`Compte introuvable : ${login}.`);

  const now = Date.now();
  const token = randomBytes(32).toString("base64url");
  const link: AccessLink = {
    id: randomBytes(9).toString("base64url"),
    tokenHash: digest(token),
    kind: input.kind,
    login,
    name: name || login,
    role: input.role,
    createdBy: input.createdBy,
    createdAt: now,
    expiresAt: now + LINK_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  };
  writeLinks([link, ...listAccessLinks(now).filter((other) => other.login !== login)]);
  return { token, link };
}

export function findAccessLink(token: string): AccessLink | null {
  if (!TOKEN_PATTERN.test(token)) return null;
  const hash = digest(token);
  return listAccessLinks().find((link) => link.tokenHash === hash) ?? null;
}

export function cancelAccessLink(id: string): void {
  writeLinks(listAccessLinks().filter((link) => link.id !== id));
}

/** Enregistre le mot de passe choisi par le membre, puis détruit le lien. */
export function redeemAccessLink(token: string, password: string): AdminUser {
  const link = findAccessLink(token);
  if (!link) throw new Error(EXPIRED_LINK);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Le mot de passe doit compter au moins ${MIN_PASSWORD_LENGTH} caractères.`);
  }

  const users = readAdminUsers();
  const index = users.findIndex((user) => user.login === link.login);
  let user: AdminUser;
  if (link.kind === "invitation") {
    if (index >= 0) throw new Error(`L’identifiant « ${link.login} » a été pris entre-temps. Demandez un nouveau lien.`);
    user = { login: link.login, name: link.name, passwordHash: hashPassword(password), role: link.role };
    users.push(user);
  } else {
    if (index < 0) throw new Error("Ce compte n’existe plus. Demandez un nouveau lien.");
    user = { ...users[index], passwordHash: hashPassword(password) };
    users[index] = user;
  }
  writeAdminUsers(users);
  writeLinks(listAccessLinks().filter((other) => other.id !== link.id));
  return user;
}

/** Retire un compte et les liens en attente à son nom. Le dernier administrateur reste. */
export function removeAccount(login: string): void {
  const users = readAdminUsers();
  const remaining = users.filter((user) => user.login !== login);
  if (remaining.length === users.length) throw new Error(`Compte introuvable : ${login}.`);
  if (!remaining.some((user) => user.role === "admin")) throw new Error("Impossible de retirer le dernier administrateur.");
  writeAdminUsers(remaining);
  writeLinks(listAccessLinks().filter((link) => link.login !== login));
}
