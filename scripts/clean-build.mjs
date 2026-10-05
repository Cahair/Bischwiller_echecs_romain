// Vide .next avant un build.
//
// Un build qui se superpose au précédent laisse un dossier mélangé : les
// manifestes d'une version pointent vers des morceaux de code (« chunks ») de
// l'autre, et le serveur démarre en apparence puis échoue à chaque page avec
// « Failed to load chunk … Cannot find module ». La bascule de version de Next
// est le cas le plus traître, parce que rien ne prévient au build.
//
// Partir du vide coûte quelques secondes de build et supprime le cache des
// images optimisées, qui se reconstitue tout seul aux premières visites.
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".next");

if (existsSync(output)) {
  rmSync(output, { recursive: true, force: true });
  console.log("Dossier .next vidé avant le build.");
} else {
  console.log("Pas de dossier .next à vider.");
}
