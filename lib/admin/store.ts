import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import generatedIndex from "@/data/generated/article-index.json";
import {
  LOCAL_ARTICLES_DIR,
  listLocalArticleFiles,
  parseLocalArticle,
  slugify,
  type Article,
} from "@/lib/articles";

/**
 * Écriture des articles maison. L’espace admin produit exactement le format
 * lu par `lib/articles.ts` : un en-tête `clé: valeur JSON` suivi du Markdown,
 * pour qu’un article publié depuis le site soit indiscernable d’un article
 * écrit à la main dans `content/actualites/`.
 */
export type StoredArticle = Article & { fileName: string };

export type ArticleDraft = {
  title: string;
  slug: string;
  publishedAt: string;
  author: string;
  status: "draft" | "publish";
  excerpt: string;
  categories: string[];
  tags: string[];
  featuredImage: string;
  featuredImageFit: "contain" | null;
  contentMarkdown: string;
};

const FRONT_MATTER_ORDER = [
  "id",
  "title",
  "slug",
  "publishedAt",
  "modifiedAt",
  "author",
  "status",
  "categories",
  "categorySlugs",
  "tags",
  "excerpt",
  "featuredImage",
  "featuredImageFit",
  "originalUrl",
] as const;

/** `2026-09-08 09:00:00`, le format des en-têtes issus de WordPress. */
export function stampDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/** `2026-09-08 09:00:00` ⇄ la valeur d’un `<input type="datetime-local">`. */
export function toInputDate(stamp: string): string {
  return stamp.replace(" ", "T").slice(0, 16);
}

export function fromInputDate(value: string): string {
  const [day, time = "00:00"] = value.split("T");
  return `${day} ${time.length === 5 ? `${time}:00` : time}`;
}

export function listStoredArticles(): StoredArticle[] {
  return listLocalArticleFiles()
    .map((fileName) => ({ ...parseLocalArticle(fileName), fileName }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function findStoredArticle(slug: string): StoredArticle | null {
  return listStoredArticles().find((article) => article.slug === slug) ?? null;
}

/** Un slug déjà pris par un autre fichier reçoit un suffixe `-2`, `-3`… */
function availableSlug(wanted: string, currentFileName: string | null): string {
  const taken = new Set(
    listStoredArticles()
      .filter((article) => article.fileName !== currentFileName)
      .map((article) => article.slug),
  );
  if (!taken.has(wanted)) return wanted;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${wanted}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Les identifiants WordPress importés montent à quelques milliers ; un
 * horodatage `AAAAMMJJhhmm` reste au-dessus et se lit d’un coup d’œil.
 */
function nextId(existing: StoredArticle[]): number {
  const stamp = Number(stampDate(new Date()).replace(/[-: ]/g, "").slice(0, 12));
  const used = new Set(existing.map((article) => article.id));
  let id = stamp;
  while (used.has(id)) id += 1;
  return id;
}

function frontMatterLine(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return `${key}: ${JSON.stringify(value)}`;
}

export function serializeArticle(article: Article): string {
  const values: Record<string, unknown> = { ...article };
  const header = FRONT_MATTER_ORDER.map((key) => frontMatterLine(key, values[key])).filter(Boolean);
  return `---\n${header.join("\n")}\n---\n${article.contentMarkdown.replace(/\r\n/g, "\n").trim()}\n`;
}

/** Crée ou remplace un article, et renvoie son slug définitif. */
export function saveArticle(draft: ArticleDraft, previousSlug: string | null): StoredArticle {
  const existing = previousSlug ? findStoredArticle(previousSlug) : null;
  if (previousSlug && !existing) throw new Error(`Article introuvable : ${previousSlug}`);

  const slug = availableSlug(slugify(draft.slug) || slugify(draft.title) || `article-${Date.now()}`, existing?.fileName ?? null);
  const article: Article = {
    id: existing?.id ?? nextId(listStoredArticles()),
    slug,
    title: draft.title.trim(),
    status: draft.status,
    author: draft.author.trim() || "Cercle d’Échecs de Bischwiller",
    publishedAt: draft.publishedAt,
    modifiedAt: stampDate(new Date()),
    excerpt: draft.excerpt.trim(),
    categories: draft.categories,
    categorySlugs: draft.categories.map(slugify),
    tags: draft.tags,
    featuredImage: draft.featuredImage.trim() || null,
    featuredImageFit: draft.featuredImageFit,
    originalUrl: existing?.originalUrl ?? "",
    contentMarkdown: draft.contentMarkdown,
  };

  mkdirSync(LOCAL_ARTICLES_DIR, { recursive: true });
  const fileName = `${slug}.md`;
  writeFileSync(path.join(LOCAL_ARTICLES_DIR, fileName), serializeArticle(article), "utf8");
  // Renommage : le fichier de l’ancien slug n’a plus lieu d’être.
  if (existing && existing.fileName !== fileName) rmSync(path.join(LOCAL_ARTICLES_DIR, existing.fileName), { force: true });
  return { ...article, fileName };
}

/** Toutes les catégories déjà employées, export WordPress compris, pour l’auto-complétion. */
export function knownCategories(): string[] {
  const used = [...generatedIndex.flatMap((article) => article.categories), ...listStoredArticles().flatMap((article) => article.categories)];
  return Array.from(new Set(used)).sort((a, b) => a.localeCompare(b, "fr"));
}

export function removeArticle(slug: string): StoredArticle | null {
  const article = findStoredArticle(slug);
  if (!article) return null;
  rmSync(path.join(LOCAL_ARTICLES_DIR, article.fileName), { force: true });
  return article;
}
