import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { flowingText, slugify } from "@/lib/markdown";

/**
 * Les articles de `content/articles/` proviennent de l’export WordPress et sont
 * réécrits à chaque `pnpm wordpress:content`. Les articles rédigés depuis la
 * refonte vivent donc à part, dans `content/actualites/`, et sont fusionnés ici
 * avec l’export au moment du rendu.
 */
export const LOCAL_ARTICLES_DIR = path.join(process.cwd(), "content", "actualites");

export { flowingText, slugify };

export type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  status: string;
  author: string;
  publishedAt: string;
  modifiedAt: string;
  excerpt: string;
  categories: string[];
  categorySlugs: string[];
  tags: string[];
  featuredImage: string | null;
  /** `contain` : l’image est montrée entière dans les cartes (QR codes, affiches). */
  featuredImageFit: "contain" | null;
  originalUrl: string;
};

export type Article = ArticleSummary & { contentMarkdown: string };

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function listLocalArticleFiles(): string[] {
  try {
    return readdirSync(LOCAL_ARTICLES_DIR).filter((name) => name.endsWith(".md"));
  } catch {
    return []; // Aucun article maison pour l’instant.
  }
}

export function parseLocalArticle(fileName: string): Article {
  const raw = readFileSync(path.join(LOCAL_ARTICLES_DIR, fileName), "utf8").replace(/\r\n/g, "\n");
  const header = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!header) throw new Error(`Article local sans en-tête : ${fileName}`);

  const front: Record<string, unknown> = {};
  for (const line of header[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const value = line.slice(colon + 1).trim();
    // L’en-tête reprend la syntaxe des MDX générés : valeurs JSON, sinon texte brut.
    try {
      front[line.slice(0, colon).trim()] = JSON.parse(value);
    } catch {
      front[line.slice(0, colon).trim()] = value;
    }
  }

  const slug = String(front.slug ?? fileName.replace(/\.md$/, ""));
  const publishedAt = String(front.publishedAt ?? "");
  return {
    id: Number(front.id ?? 0),
    slug,
    title: String(front.title ?? slug),
    // Les fichiers écrits avant l’espace admin n’ont pas de `status` : ils sont publiés.
    status: front.status === "draft" ? "draft" : "publish",
    author: String(front.author ?? "Cercle d’Échecs de Bischwiller"),
    publishedAt,
    modifiedAt: String(front.modifiedAt ?? publishedAt),
    excerpt: String(front.excerpt ?? ""),
    categories: strings(front.categories),
    categorySlugs: strings(front.categorySlugs),
    tags: strings(front.tags),
    featuredImage: front.featuredImage ? String(front.featuredImage) : null,
    featuredImageFit: front.featuredImageFit === "contain" ? "contain" : null,
    originalUrl: String(front.originalUrl ?? ""),
    contentMarkdown: raw.slice(header[0].length).trim(),
  };
}

/** Tous les articles maison, brouillons compris : réservé à l’espace admin. */
export function readAllLocalArticles(): Article[] {
  return listLocalArticleFiles().map(parseLocalArticle);
}

/**
 * Le disque est relu à chaque rendu — et non une fois au démarrage — parce que
 * l’espace admin écrit dans `content/actualites/` pendant que le serveur tourne.
 * `cache()` limite la relecture à une fois par requête.
 */
export const getLocalArticles = cache((): Article[] =>
  readAllLocalArticles().filter((article) => article.status === "publish"),
);

export const getLocalArticleIndex = cache((): ArticleSummary[] =>
  getLocalArticles().map(({ contentMarkdown, ...summary }) => {
    void contentMarkdown;
    return summary;
  }),
);

/**
 * Fusionne export WordPress et articles maison, du plus récent au plus ancien.
 * Un article maison portant le slug d’un article importé le remplace : c’est
 * ainsi que l’espace admin corrige un article WordPress sans jamais toucher à
 * `content/articles/`, qui est régénéré à chaque réimportation.
 */
export function mergeArticles<
  A extends { slug: string; publishedAt: string },
  B extends { slug: string; publishedAt: string },
>(generated: readonly A[], locals: readonly B[]): (A | B)[] {
  const overridden = new Set(locals.map((article) => article.slug));
  return [...locals, ...generated.filter((article) => !overridden.has(article.slug))].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}
