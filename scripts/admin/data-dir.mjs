/**
 * Les chemins de `lib/storage.ts`, pour les scripts lancés par `node`, hors de
 * Next. Next lit `.env.local` de lui-même ; ici il faut le faire à la main,
 * sans quoi `pnpm admin:user` écrirait les comptes là où le site ne les lit pas.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

// Même ordre que Next en production : la première valeur trouvée l'emporte.
const ENV_FILES = [".env.production.local", ".env.local", ".env.production", ".env"];

function envValue(name) {
  if (process.env[name] !== undefined) return process.env[name];
  const pattern = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*(.*?)\\s*$`);
  for (const file of ENV_FILES) {
    let text;
    try {
      text = readFileSync(path.join(process.cwd(), file), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const match = pattern.exec(line);
      if (!match) continue;
      const quoted = /^(["'])(.*)\1$/.exec(match[1]);
      return quoted ? quoted[2] : match[1].replace(/\s+#.*$/, "");
    }
  }
  return undefined;
}

const configured = envValue("SITE_DATA_DIR")?.trim();
export const DATA_DIR = configured ? path.resolve(configured) : null;

const legacyPath = (...parts) => path.join(process.cwd(), ...parts);
const location = (label, name, ...legacy) => ({
  label,
  legacy: legacyPath(...legacy),
  target: DATA_DIR ? path.join(DATA_DIR, name) : legacyPath(...legacy),
});

/** Chaque emplacement écrit par l'espace admin, avec sa place historique dans le projet. */
export const LOCATIONS = [
  location("Articles", "actualites", "content", "actualites"),
  location("Contenu à la une", "a-la-une.json", "content", "a-la-une.json"),
  location("Photos et PDF", "medias", "public", "media", "actualites"),
  location("Comptes", "admin", "data", "admin"),
];

export const ADMIN_DATA_DIR = LOCATIONS[3].target;
