import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { slugify } from "@/lib/articles";
import { forgetPhotoSize } from "@/lib/image-size";

/**
 * Les visuels envoyés depuis l’espace admin rejoignent ceux des articles
 * maison, dans `public/media/actualites/`, servis tels quels par Next.
 */
export const MEDIA_DIR = path.join(process.cwd(), "public", "media", "actualites");
export const MEDIA_URL = "/media/actualites";
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Extension → type MIME attendu, pour refuser un exécutable renommé en .jpg. */
const ACCEPTED: Record<string, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  avif: ["image/avif"],
  gif: ["image/gif"],
  pdf: ["application/pdf"],
};

export const ACCEPTED_EXTENSIONS = Object.keys(ACCEPTED);

/** Les premiers octets doivent confirmer l’extension annoncée. */
function signatureMatches(extension: string, bytes: Buffer): boolean {
  if (extension === "pdf") return bytes.toString("ascii", 0, 5) === "%PDF-";
  if (extension === "png") return bytes.readUInt32BE(0) === 0x89504e47;
  if (extension === "gif") return bytes.toString("ascii", 0, 3) === "GIF";
  if (extension === "jpg" || extension === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  // WebP et AVIF partagent une entête à conteneur : RIFF/WEBP et ftyp/avif.
  if (extension === "webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (extension === "avif") return bytes.toString("ascii", 4, 8) === "ftyp";
  return false;
}

function availableName(base: string, extension: string): string {
  const stem = slugify(base) || "media";
  for (let suffix = 0; ; suffix += 1) {
    const name = suffix === 0 ? `${stem}.${extension}` : `${stem}-${suffix}.${extension}`;
    if (!existsSync(path.join(MEDIA_DIR, name))) return name;
  }
}

export type UploadResult = { url: string; name: string };

/** Écrit un fichier envoyé par l’éditeur et renvoie son URL publique. */
export function saveUpload(file: { name: string; type: string; bytes: Buffer }): UploadResult {
  if (file.bytes.length === 0) throw new Error("Fichier vide.");
  if (file.bytes.length > MAX_UPLOAD_BYTES) throw new Error(`Fichier trop lourd (maximum ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo).`);

  const extension = path.extname(file.name).slice(1).toLowerCase();
  const accepted = ACCEPTED[extension];
  if (!accepted) throw new Error(`Format refusé. Formats acceptés : ${ACCEPTED_EXTENSIONS.join(", ")}.`);
  if (file.type && !accepted.includes(file.type)) throw new Error("Le type du fichier ne correspond pas à son extension.");
  if (!signatureMatches(extension, file.bytes)) throw new Error("Le contenu du fichier ne correspond pas à son extension.");

  mkdirSync(MEDIA_DIR, { recursive: true });
  const name = availableName(path.basename(file.name, path.extname(file.name)), extension);
  writeFileSync(path.join(MEDIA_DIR, name), file.bytes);
  const url = `${MEDIA_URL}/${name}`;
  forgetPhotoSize(url); // Le chemin a pu être demandé — et mis en cache comme absent — pendant l’aperçu.
  return { url, name };
}
