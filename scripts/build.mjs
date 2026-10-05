// Build de production, en deux temps : construire à côté, mettre en place après.
//
// Pourquoi : `next build` écrit directement dans .next. Un build interrompu — mémoire
// épuisée, délai dépassé, erreur en cours de route — y laisse donc un dossier à moitié
// écrit. Le serveur démarre quand même, puis échoue à chaque page sur un morceau de code
// introuvable (« Failed to load chunk … Cannot find module »), et c'est illisible parce
// que le journal de démarrage, lui, est propre.
//
// Ici le build écrit dans .next-build. Le dossier n'est mis en place qu'après vérification
// qu'il est complet. Un build qui échoue laisse donc le site en ligne intact, sur sa
// version précédente, et ressort en erreur au lieu de passer pour un succès.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const live = path.join(root, ".next");
const staging = path.join(root, ".next-build");
const previous = path.join(root, ".next-previous");

// Ce que `next start` exige pour reconnaître un build : s'il en manque un seul,
// le dossier est incomplet, quoi qu'ait affiché le build.
const REQUIRED = ["BUILD_ID", "routes-manifest.json", "build-manifest.json", "prerender-manifest.json", path.join("server", "app-paths-manifest.json")];

function fail(message) {
  console.error(`\n✗ ${message}`);
  console.error("  Le site en ligne n'a pas été touché : il tourne toujours sur sa version précédente.");
  process.exit(1);
}

const drop = (directory) => rmSync(directory, { recursive: true, force: true });

drop(staging);

const next = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(next)) fail("Next introuvable dans node_modules : installez les dépendances avant de lancer le build.");

const build = spawnSync(process.execPath, [next, "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NEXT_DIST_DIR: path.basename(staging) },
});

if (build.error) fail(`Le build n'a pas pu démarrer : ${build.error.message}`);
if (build.status !== 0) {
  // Un build tué par le système ne rend pas de code de sortie mais un signal.
  const cause = build.signal ? `interrompu par le système (signal ${build.signal}) — mémoire épuisée, le plus souvent` : `terminé en erreur (code ${build.status})`;
  drop(staging);
  fail(`Build ${cause}.`);
}

const missing = REQUIRED.filter((file) => !existsSync(path.join(staging, file)));
if (missing.length > 0) {
  drop(staging);
  fail(`Build incomplet : ${missing.join(", ")} manque${missing.length > 1 ? "nt" : ""} à l'appel.`);
}

// Le build note son dossier de sortie dans ce fichier ; après la mise en place,
// le nom doit être celui que lira `next start`.
const serverFiles = path.join(staging, "required-server-files.json");
if (existsSync(serverFiles)) {
  try {
    const content = JSON.parse(readFileSync(serverFiles, "utf8"));
    if (content.config?.distDir) {
      content.config.distDir = path.basename(live);
      writeFileSync(serverFiles, JSON.stringify(content));
    }
  } catch (error) {
    fail(`Lecture de required-server-files.json impossible : ${error.message}`);
  }
}

// Mise en place. Deux renommages : le site n'est sans dossier que le temps du second.
try {
  drop(previous);
  if (existsSync(live)) renameSync(live, previous);
  renameSync(staging, live);
} catch (error) {
  if (existsSync(previous) && !existsSync(live)) renameSync(previous, live);
  // Sous Windows, un dossier tenu ouvert par un serveur ne peut pas être renommé.
  const held = ["EPERM", "EBUSY", "ENOTEMPTY", "EACCES"].includes(error.code);
  fail(
    held
      ? `Le dossier .next est tenu par un autre programme (${error.code}). Arrêtez le serveur de développement (« npm run dev ») ou le serveur de production (« npm start »), puis relancez le build. Le build réussi est conservé dans .next-build.`
      : `Mise en place impossible : ${error.message}`,
  );
}
drop(previous);

console.log("\n✓ Build en place dans .next. Redémarrez le serveur pour le servir.");
