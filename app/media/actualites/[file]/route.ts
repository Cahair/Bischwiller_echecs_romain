import { readFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA_DIR } from "@/lib/admin/media";

/**
 * En production, Next ne sert depuis `public/` que les fichiers présents au
 * démarrage du serveur : une photo envoyée depuis l’espace admin resterait
 * introuvable — dans l’éditeur comme sur le site — jusqu’au prochain
 * redémarrage. Les requêtes que `public/` ne sait pas satisfaire aboutissent
 * ici, et le fichier est lu directement sur le disque. Après un redémarrage,
 * Next le sert de nouveau lui-même et cette route n’est plus sollicitée.
 */
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  pdf: "application/pdf",
};

/** Les noms produits par l’envoi : ni barre oblique, ni rien qui sorte du dossier. */
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*\.([a-z0-9]+)$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const extension = SAFE_NAME.exec(file)?.[1].toLowerCase();
  const type = extension ? TYPES[extension] : undefined;
  if (!type) return new Response("Introuvable", { status: 404 });

  try {
    const bytes = await readFile(path.join(MEDIA_DIR, file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}
