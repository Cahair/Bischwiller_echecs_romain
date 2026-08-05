import { readFileSync } from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";

const DEFAULT_RATIO = "4/3";
const sizes = new Map<string, [number, number] | null>();

function dimensions(bytes: Buffer): [number, number] | null {
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8X") return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
    if (chunk === "VP8 ") return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
    if (chunk === "VP8L") {
      const bits = bytes.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    return null;
  }
  if (bytes.readUInt32BE(0) === 0x89504e47) return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let i = 2; i + 9 < bytes.length; ) {
      if (bytes[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = bytes[i + 1];
      // Les marqueurs SOFn portent la taille de l’image ; C4/C8/CC sont autre chose (tables de Huffman…).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return [bytes.readUInt16BE(i + 7), bytes.readUInt16BE(i + 5)];
      }
      i += 2 + bytes.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Dimensions natives d’une photo servie depuis /public, en pixels. */
export function photoSize(src: string): [number, number] | null {
  const known = sizes.get(src);
  if (known !== undefined) return known;
  let size: [number, number] | null = null;
  if (src.startsWith("/")) {
    try {
      const found = dimensions(readFileSync(path.join(process.cwd(), "public", src)));
      if (found && found[0] > 0 && found[1] > 0) size = found;
    } catch {
      // Photo illisible ou absente : le rendu retombe sur ses valeurs par défaut.
    }
  }
  sizes.set(src, size);
  return size;
}

/** Ratio natif d’une photo servie depuis /public, au format CSS `aspect-ratio`. */
export function photoRatio(src: string): string {
  const size = photoSize(src);
  return size ? `${size[0]}/${size[1]}` : DEFAULT_RATIO;
}

/**
 * WordPress insérait dans les articles la vignette d’une photo
 * (`podium-300x138.jpg`, voire un carré `-150x150` recadré) alors que
 * l’original est là, à côté. On sert l’original : sinon la photo s’affiche en
 * timbre-poste au milieu d’une colonne de 800 px.
 */
export function fullSizePhoto(src: string): string {
  const original = src.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "");
  if (original === src) return src;
  // Au-delà de 2560 px WordPress renomme l’original en `-scaled`.
  const scaled = original.replace(/(?=\.[a-z0-9]+$)/i, "-scaled");
  return [original, scaled].find((candidate) => photoSize(candidate)) ?? src;
}

/**
 * Donne au cadre le ratio exact de sa photo, pour que `object-fit:cover` n’ait
 * plus rien à rogner. Les cadres tiraient leur hauteur de la mise en page, donc
 * plus l’écran était étroit, plus les photos de groupe perdaient les personnes
 * placées sur les bords.
 */
export function photoFrame(src: string): CSSProperties {
  return { "--photo-ratio": photoRatio(src) } as CSSProperties;
}
