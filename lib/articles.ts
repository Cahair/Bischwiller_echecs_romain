import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Les articles de `content/articles/` proviennent de l’export WordPress et sont
 * réécrits à chaque `pnpm wordpress:content`. Les articles rédigés depuis la
 * refonte vivent donc à part, dans `content/actualites/`, et sont fusionnés ici
 * avec l’export au moment du rendu.
 */
const LOCAL_DIR = path.join(process.cwd(), "content", "actualites");

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
  originalUrl: string;
};

export type Article = ArticleSummary & { contentMarkdown: string };

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function parseArticle(fileName: string): Article {
  const raw = readFileSync(path.join(LOCAL_DIR, fileName), "utf8").replace(/\r\n/g, "\n");
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
    status: "publish",
    author: String(front.author ?? "Cercle d’Échecs de Bischwiller"),
    publishedAt,
    modifiedAt: String(front.modifiedAt ?? publishedAt),
    excerpt: String(front.excerpt ?? ""),
    categories: strings(front.categories),
    categorySlugs: strings(front.categorySlugs),
    tags: strings(front.tags),
    featuredImage: front.featuredImage ? String(front.featuredImage) : null,
    originalUrl: String(front.originalUrl ?? ""),
    contentMarkdown: raw.slice(header[0].length).trim(),
  };
}

function readLocalArticles(): Article[] {
  let files: string[] = [];
  try {
    files = readdirSync(LOCAL_DIR).filter((name) => name.endsWith(".md"));
  } catch {
    return []; // Aucun article maison pour l’instant.
  }
  return files.map(parseArticle);
}

export const localArticles: Article[] = readLocalArticles();

export const localArticleIndex: ArticleSummary[] = localArticles.map(
  ({ contentMarkdown, ...summary }) => {
    void contentMarkdown;
    return summary;
  },
);

const HARD_BREAK = /(?: {2,}|\\)$/;
const ENDS_SENTENCE = /[.!?:;»)\]]$/;
const BLOCK_LINE = /^\s*(?:[-*+>#|]|\d+[.)])/;

/**
 * Beaucoup d’articles ont été collés dans WordPress depuis un traitement de
 * texte : ils arrivent coupés tous les cent caractères, en plein milieu des
 * phrases. Ces retours forcés empêchent toute justification — une ligne suivie
 * d’un `<br>` est une fin de paragraphe, que le navigateur laisse au fer à
 * gauche — et hachent la lecture sur mobile. On ne recolle que les lignes
 * manifestement tronquées (longues et sans ponctuation finale) : listes de
 * résultats, notations de parties et tableaux gardent leurs retours.
 */
export function flowingText(markdown: string): string {
  const flowed: string[] = [];
  let inCodeFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(?:```|~~~)/.test(line)) inCodeFence = !inCodeFence;
    const previous = flowed.at(-1);
    const text = previous === undefined ? "" : previous.replace(/\s+$/, "");
    const joinable =
      !inCodeFence &&
      previous !== undefined &&
      HARD_BREAK.test(previous) &&
      text.length >= 60 &&
      !ENDS_SENTENCE.test(text) &&
      !BLOCK_LINE.test(text) &&
      line.trim() !== "" &&
      !BLOCK_LINE.test(line);
    if (joinable) flowed[flowed.length - 1] = `${text} ${line.trimStart()}`;
    else flowed.push(line);
  }
  return flowed.join("\n");
}

/** Fusionne export WordPress et articles maison, du plus récent au plus ancien. */
export function mergeArticles<A extends { publishedAt: string }, B extends { publishedAt: string }>(
  generated: readonly A[],
  locals: readonly B[],
): (A | B)[] {
  return [...locals, ...generated].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
