import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Racine du projet, fixée explicitement.
//
// Sans ça, Turbopack la devine en remontant les dossiers jusqu'au premier fichier
// de verrouillage trouvé. Sur le serveur, un package-lock.json égaré dans le dossier
// parent lui a fait prendre /srv/customer pour racine : le build écrit alors des
// chemins qui ne correspondent plus à l'endroit où le serveur cherche ses fichiers,
// et chaque page échoue sur « Failed to load chunk ».
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: projectRoot },
  // Nombre de processus de build. Laissé libre, Next compte les cœurs de la
  // machine : sur l'hébergement mutualisé il en voyait vingt et lançait vingt
  // processus, bien au-delà du quota de mémoire, et le build se faisait tuer en
  // silence pendant la génération des pages. Deux suffisent — 18 s au lieu de 15.
  experimental: { cpus: 2 },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
};

export default nextConfig;
