import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import TurndownService from "turndown";
import {
  CONTENT_EXPORT,
  GENERATED_DIR,
  ROOT_DIR,
  array,
  normalizedItem,
  readExport,
  sortByDateDescending,
} from "./lib.mjs";

const exportData = await readExport(CONTENT_EXPORT);
const allItems = array(exportData.item).map(normalizedItem);
const manifest = JSON.parse(
  await readFile(path.join(GENERATED_DIR, "media-manifest.json"), "utf8"),
);
const mediaMap = new Map(
  manifest
    .filter((item) => item.status !== "failed")
    .map((item) => [item.sourceUrl, item.localPath]),
);
const attachmentById = new Map(
  allItems
    .filter((item) => item.type === "attachment")
    .map((item) => [item.id, item]),
);

function localizeMedia(html) {
  let localized = html;
  for (const [sourceUrl, localPath] of mediaMap) {
    const variants = new Set([
      sourceUrl,
      sourceUrl.replace("https://bischwiller-echecs.com", "http://www.bischwiller-echecs.com"),
      sourceUrl.replace("https://bischwiller-echecs.com", "https://www.bischwiller-echecs.com"),
      sourceUrl.replace("https://bischwiller-echecs.com", "http://bischwiller-echecs.com"),
    ]);
    for (const variant of variants) {
      localized = localized.replaceAll(variant, localPath);
      localized = localized.replaceAll(variant.replaceAll("&", "&amp;"), localPath);
    }
  }
  return localized;
}

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});
turndown.remove(["script", "style", "noscript", "iframe"]);
turndown.addRule("wordpressCaption", {
  filter: (node) => node.nodeName === "FIGURE",
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

function articleRecord(item) {
  const categoryRecords = item.categories.filter((category) => category.domain === "category");
  const tagRecords = item.categories.filter((category) => category.domain === "post_tag");
  const localizedHtml = localizeMedia(item.contentHtml);
  const featuredAttachment = item.featuredMediaId
    ? attachmentById.get(item.featuredMediaId)
    : null;
  const featuredImage = featuredAttachment?.attachmentUrl
    ? mediaMap.get(featuredAttachment.attachmentUrl) ?? featuredAttachment.attachmentUrl
    : null;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    status: item.status,
    author: item.author,
    publishedAt: item.publishedAt,
    modifiedAt: item.modifiedAt,
    excerpt: turndown.turndown(localizeMedia(item.excerptHtml)).trim(),
    categories: categoryRecords.map((category) => category.name),
    categorySlugs: categoryRecords.map((category) => category.slug),
    tags: tagRecords.map((tag) => tag.name),
    featuredImage,
    originalUrl: item.link,
    contentHtml: localizedHtml,
    contentMarkdown: turndown.turndown(localizedHtml).trim(),
  };
}

const posts = allItems.filter((item) => item.type === "post").map(articleRecord);
const published = sortByDateDescending(posts.filter((item) => item.status === "publish"));
const drafts = sortByDateDescending(posts.filter((item) => item.status === "draft"));
const articleDir = path.join(ROOT_DIR, "content", "articles");
await rm(articleDir, { recursive: true, force: true });
await mkdir(articleDir, { recursive: true });

for (const article of published) {
  const frontmatter = [
    "---",
    `id: ${article.id}`,
    `title: ${yamlString(article.title)}`,
    `slug: ${yamlString(article.slug)}`,
    `publishedAt: ${yamlString(article.publishedAt)}`,
    `modifiedAt: ${yamlString(article.modifiedAt)}`,
    `author: ${yamlString(article.author)}`,
    `categories: ${JSON.stringify(article.categories)}`,
    `tags: ${JSON.stringify(article.tags)}`,
    `featuredImage: ${yamlString(article.featuredImage)}`,
    `originalUrl: ${yamlString(article.originalUrl)}`,
    "---",
    "",
  ].join("\n");
  await writeFile(
    path.join(articleDir, `${article.slug}.mdx`),
    `${frontmatter}${article.contentMarkdown}\n`,
  );
}

const index = published.map(({ contentHtml, contentMarkdown, ...article }) => {
  void contentHtml;
  void contentMarkdown;
  return article;
});
await Promise.all([
  writeFile(
    path.join(GENERATED_DIR, "articles.json"),
    `${JSON.stringify(published, null, 2)}\n`,
  ),
  writeFile(
    path.join(GENERATED_DIR, "article-index.json"),
    `${JSON.stringify(index, null, 2)}\n`,
  ),
  writeFile(
    path.join(GENERATED_DIR, "drafts.json"),
    `${JSON.stringify(drafts, null, 2)}\n`,
  ),
]);

console.log(`${published.length} articles MDX générés, ${drafts.length} brouillons archivés.`);
