#!/usr/bin/env node
/**
 * Gestion des comptes de l'espace admin.
 *
 *   pnpm admin:user lister
 *   pnpm admin:user ajouter <identifiant> "<Nom affiché>"
 *   pnpm admin:user supprimer <identifiant>
 *   pnpm admin:user secret
 *
 * Les comptes vivent dans `data/admin/users.json`, hors du dépôt. Le mot de
 * passe n'y figure jamais : seul son condensé scrypt, au format
 * `scrypt:<sel hex>:<empreinte hex>` que relit `lib/admin/users.ts`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { randomBytes, scryptSync } from "node:crypto";

const USERS_FILE = path.join(process.cwd(), "data", "admin", "users.json");
const KEY_LENGTH = 64;

function readUsers() {
  try {
    const parsed = JSON.parse(readFileSync(USERS_FILE, "utf8"));
    return Array.isArray(parsed.users) ? parsed.users : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  writeFileSync(USERS_FILE, `${JSON.stringify({ users }, null, 2)}\n`, "utf8");
}

function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

/** Saisie sans écho : le mot de passe ne doit pas rester dans le terminal. */
function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let promptWritten = false;
    rl._writeToOutput = () => {
      if (promptWritten) return;
      rl.output.write(prompt);
      promptWritten = true;
    };
    rl.question(prompt, (answer) => {
      rl.output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const [command, login, ...rest] = process.argv.slice(2);

if (command === "secret") {
  console.log(randomBytes(48).toString("base64url"));
  console.log("\nÀ recopier dans .env.local :\n  ADMIN_SESSION_SECRET=<la valeur ci-dessus>");
} else if (command === "lister") {
  const users = readUsers();
  if (users.length === 0) console.log("Aucun compte. Créez-en un avec : pnpm admin:user ajouter <identifiant> \"<Nom>\"");
  for (const user of users) console.log(`${user.login.padEnd(16)} ${user.name}`);
} else if (command === "ajouter") {
  if (!login) fail('Usage : pnpm admin:user ajouter <identifiant> "<Nom affiché>"');
  const identifier = login.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(identifier)) fail("Identifiant : 3 à 32 caractères, lettres, chiffres, . _ -");
  const name = rest.join(" ").trim() || identifier;

  // En non interactif (déploiement scripté), le mot de passe passe par
  // l'environnement : la ligne de commande, elle, est lisible par tous.
  const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Mot de passe : "));
  if (password.length < 10) fail("Mot de passe : 10 caractères minimum.");
  if (!process.env.ADMIN_PASSWORD) {
    const confirmation = await askHidden("Confirmer     : ");
    if (confirmation !== password) fail("Les deux saisies diffèrent.");
  }

  const users = readUsers();
  const existing = users.findIndex((user) => user.login === identifier);
  const record = { login: identifier, name, passwordHash: hashPassword(password) };
  if (existing >= 0) users[existing] = record;
  else users.push(record);
  writeUsers(users);
  console.log(`✓ Compte ${existing >= 0 ? "mis à jour" : "créé"} : ${identifier} (${name})`);
} else if (command === "supprimer") {
  if (!login) fail("Usage : pnpm admin:user supprimer <identifiant>");
  const users = readUsers();
  const remaining = users.filter((user) => user.login !== login.trim().toLowerCase());
  if (remaining.length === users.length) fail(`Compte introuvable : ${login}`);
  writeUsers(remaining);
  console.log(`✓ Compte supprimé : ${login}`);
} else {
  console.log(`Gestion des comptes de l'espace admin.

  pnpm admin:user lister
  pnpm admin:user ajouter <identifiant> "<Nom affiché>"
  pnpm admin:user supprimer <identifiant>
  pnpm admin:secret                        # génère ADMIN_SESSION_SECRET`);
  process.exit(command ? 1 : 0);
}
