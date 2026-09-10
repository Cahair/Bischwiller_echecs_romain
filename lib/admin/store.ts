import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import generatedIndex from "@/data/generated/article-index.json";
import generatedArticles from "@/data/generated/articles.json";
import {
  LOCAL_ARTICLES_DIR,
  listLocalArticleFiles,
  parseLocalArticle,
  mergeArticles,
  slugify,
  type Article,
  type ArticleSummary,
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

const PARIS_CLOCK = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * `2026-09-08 09:00:00`, le format des en-têtes issus de WordPress, à l’heure
 * de Paris : le site affiche la date telle qu’enregistrée, et en temps
 * universel un article publié à 0 h 30 serait daté de la veille.
 */
export function stampDate(date: Date): string {
  const part = Object.fromEntries(PARIS_CLOCK.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${part.year}-${part.month}-${part.day} ${part.hour}:${part.minute}:${part.second}`;
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

/**
 * `imported` : article venu de l’export WordPress, encore servi depuis
 * `data/generated/`. Le modifier ne le touche pas — l’enregistrement écrit un
 * fichier maison de même slug, qui le masque partout sur le site. Supprimer ce
 * fichier fait donc réapparaître la version d’origine, intacte.
 */
export type ArticleSource = "local" | "imported";
export type AdminArticleSummary = ArticleSummary & { source: ArticleSource; fileName: string | null };
export type AdminArticle = Article & {
  source: ArticleSource;
  fileName: string | null;
  /** Vrai quand ce fichier maison masque un article importé de même slug :
   *  le supprimer ne retire alors rien du site, il rétablit l’original. */
  shadowsImported: boolean;
};

function importedSummary(article: (typeof generatedIndex)[number]): AdminArticleSummary {
  return { ...article, featuredImageFit: null, source: "imported", fileName: null };
}

/** Les 568 articles du site, fichiers maison en tête de ceux qu’ils masquent. */
export function listAdminArticles(): AdminArticleSummary[] {
  const locals: AdminArticleSummary[] = listStoredArticles().map(({ contentMarkdown, fileName, ...summary }) => {
    void contentMarkdown;
    return { ...summary, source: "local", fileName };
  });
  return mergeArticles(generatedIndex.map(importedSummary), locals);
}

export function findAdminArticle(slug: string): AdminArticle | null {
  const imported = generatedArticles.find((article) => article.slug === slug);
  const local = findStoredArticle(slug);
  if (local) return { ...local, source: "local", shadowsImported: imported !== undefined };
  if (!imported) return null;
  return { ...imported, featuredImageFit: null, source: "imported", fileName: null, shadowsImported: false };
}

/**
 * Un slug déjà pris reçoit un suffixe `-2`, `-3`… Les slugs importés comptent
 * eux aussi comme pris : sans quoi un nouvel article masquerait par accident un
 * article WordPress homonyme. Seul `keepable` — le slug d’où l’on vient — y
 * échappe, puisque le masquer est précisément l’intention.
 */
function availableSlug(wanted: string, currentFileName: string | null, keepable: string | null): string {
  const taken = new Set<string>(generatedIndex.map((article) => article.slug));
  for (const article of listStoredArticles()) {
    if (article.fileName !== currentFileName) taken.add(article.slug);
  }
  if (keepable) taken.delete(keepable);
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

/**
 * Crée ou remplace un article. Modifier un article importé n’écrit pas dans
 * `content/articles/` : le fichier maison produit ici prend sa place.
 */
export function saveArticle(draft: ArticleDraft, previousSlug: string | null): StoredArticle {
  const existing = previousSlug ? findAdminArticle(previousSlug) : null;
  if (previousSlug && !existing) throw new Error(`Article introuvable : ${previousSlug}`);

  const slug = availableSlug(
    slugify(draft.slug) || slugify(draft.title) || `article-${Date.now()}`,
    existing?.fileName ?? null,
    previousSlug,
  );
  const article: Article = {
    // Un article importé garde son identifiant : la copie prolonge l’original.
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
  if (existing?.fileName && existing.fileName !== fileName) rmSync(path.join(LOCAL_ARTICLES_DIR, existing.fileName), { force: true });
  return { ...article, fileName };
}

/** Rubriques déjà employées sur le site, les plus courantes d’abord : l’éditeur les propose d’un clic. */
export function categoryUsage(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const article of listAdminArticles()) {
    for (const name of article.categories) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

export function removeArticle(slug: string): StoredArticle | null {
  const article = findStoredArticle(slug);
  if (!article) return null;
  rmSync(path.join(LOCAL_ARTICLES_DIR, article.fileName), { force: true });
  return article;
}
