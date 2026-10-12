#!/usr/bin/env node
/**
 * Prépare le dossier de données, juste avant `next build` (`npm run build`).
 *
 * Avec `SITE_DATA_DIR`, l'espace admin écrit hors du projet (`lib/storage.ts`).
 * Au premier passage, ce script y recopie ce qui vivait jusque-là dans le
 * projet — articles, contenu à la une, photos, comptes — sans rien écraser ni
 * rien effacer à l'ancien emplacement. Un fichier témoin empêche ensuite toute
 * nouvelle copie : un article supprimé depuis l'admin ne doit pas ressusciter
 * au déploiement suivant.
 *
 * Il échoue — et le build avec lui, le site en ligne restant intact — si le
 * dossier est mal placé ou inaccessible en écriture : mieux vaut un déploiement
 * refusé qu'un espace admin qui n'enregistre rien.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR, LOCATIONS } from "./data-dir.mjs";

const MARKER = ".reprise-faite";
const project = process.cwd();

function fail(message) {
  console.error(`\n✗ ${message}`);
  console.error("  Le site en ligne n'a pas été touché : il tourne toujours sur sa version précédente.");
  process.exit(1);
}

function countFiles(target) {
  if (!existsSync(target)) return 0;
  if (!statSync(target).isDirectory()) return 1;
  return readdirSync(target, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).length;
}

if (!DATA_DIR) {
  console.log(`Dossier de données : SITE_DATA_DIR n'est pas défini, l'espace admin écrit dans le projet (${project}).`);
  process.exit(0);
}

// Dans le projet, le dossier serait de nouveau à la merci de Git.
const inside = path.relative(project, DATA_DIR);
if (!inside.startsWith("..") && !path.isAbsolute(inside)) {
  fail(`SITE_DATA_DIR (${DATA_DIR}) est dans le dossier du site. Choisissez un dossier à l'extérieur, par exemple ${path.join(path.dirname(project), "donnees-bischwiller")}.`);
}

try {
  mkdirSync(DATA_DIR, { recursive: true });
  const probe = path.join(DATA_DIR, `.essai-${process.pid}`);
  writeFileSync(probe, "");
  rmSync(probe);
} catch (error) {
  fail(`Le dossier de données ${DATA_DIR} n'est pas accessible en écriture : ${error.message}`);
}

if (existsSync(path.join(DATA_DIR, MARKER))) {
  console.log(`Dossier de données : ${DATA_DIR}`);
  process.exit(0);
}

console.log(`Dossier de données : ${DATA_DIR}\nPremière mise en place, reprise de ce que contient le projet :`);
for (const { label, legacy, target } of LOCATIONS) {
  if (!existsSync(legacy)) {
    console.log(`  ${label} : rien à reprendre`);
    continue;
  }
  const before = countFiles(target);
  cpSync(legacy, target, { recursive: true, force: false, errorOnExist: false });
  console.log(`  ${label} : ${countFiles(target) - before} fichier(s) repris de ${path.relative(project, legacy)}`);
}
writeFileSync(path.join(DATA_DIR, MARKER), `Reprise faite le ${new Date().toISOString()} depuis ${project}\n`);
console.log("Les anciens emplacements sont laissés intacts : ils servent de copie de secours.");
