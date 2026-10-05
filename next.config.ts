import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Le build écrit dans un dossier d'attente que scripts/build.mjs met en place
  // seulement s'il a réussi. Sans variable, c'est le dossier habituel : c'est
  // ce que lit `next start`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
};

export default nextConfig;
