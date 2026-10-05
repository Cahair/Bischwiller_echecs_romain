import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Le contenu « à la une » de la page d’accueil : un titre, un texte, une photo,
 * et un interrupteur. Il vit dans `content/`, comme les articles écrits depuis
 * le site, pour être repris dans Git avec eux.
 */
const FILE = path.join(process.cwd(), "content", "a-la-une.json");

export type Featured = {
  /** Éteint, le bloc disparaît du site ; le texte, lui, reste enregistré. */
  enabled: boolean;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  updatedAt: string;
  updatedBy: string;
};

export const EMPTY_FEATURED: Featured = {
  enabled: false,
  title: "",
  text: "",
  image: "",
  imageAlt: "",
  updatedAt: "",
  updatedBy: "",
};

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

export function readFeatured(): Featured {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<Record<keyof Featured, unknown>>;
    const image = asText(parsed.image);
    return {
      enabled: parsed.enabled === true,
      title: asText(parsed.title),
      text: asText(parsed.text),
      // Une photo ne peut désigner qu’un fichier servi par le site.
      image: image.startsWith("/") ? image : "",
      imageAlt: asText(parsed.imageAlt),
      updatedAt: asText(parsed.updatedAt),
      updatedBy: asText(parsed.updatedBy),
    };
  } catch {
    return EMPTY_FEATURED; // Jamais renseigné : rien à la une.
  }
}

/** Ce que la page d’accueil affiche : rien tant que l’interrupteur est éteint. */
export function visibleFeatured(): Featured | null {
  const featured = readFeatured();
  return featured.enabled && featured.title.trim() !== "" ? featured : null;
}

export function writeFeatured(featured: Featured): void {
  mkdirSync(path.dirname(FILE), { recursive: true });
  // Écriture atomique : un fichier à moitié écrit viderait la une du site.
  const temporary = `${FILE}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(featured, null, 2)}\n`, "utf8");
  renameSync(temporary, FILE);
}

/** Le texte tel qu’il a été tapé : une ligne vide sépare deux paragraphes. */
export function featuredParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}
