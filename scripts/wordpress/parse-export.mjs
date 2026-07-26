import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CONTENT_EXPORT,
  GENERATED_DIR,
  MEDIA_EXPORT,
  PAGE_SNAPSHOT,
  array,
  extractUploadUrls,
  localMediaPath,
  normalizeSourceUrl,
  normalizedItem,
  readExport,
} from "./lib.mjs";

const [contentExport, mediaExport] = await Promise.all([
  readExport(CONTENT_EXPORT),
  readExport(MEDIA_EXPORT),
]);

const contentItems = array(contentExport.item).map(normalizedItem);
const mediaItems = array(mediaExport.item).map(normalizedItem);
const allItems = [...contentItems, ...mediaItems];
const mediaSourceKinds = new Map();
let pageSnapshots = [];
try {
  pageSnapshots = JSON.parse(await readFile(PAGE_SNAPSHOT, "utf8"));
} catch {}

function registerMedia(rawUrl, kind, ownerId = null) {
  const sourceUrl = normalizeSourceUrl(rawUrl);
  if (!sourceUrl) return;
  const record = mediaSourceKinds.get(sourceUrl) ?? {
    sourceUrl,
    kinds: new Set(),
    ownerIds: new Set(),
  };
  record.kinds.add(kind);
  if (ownerId) record.ownerIds.add(ownerId);
  mediaSourceKinds.set(sourceUrl, record);
}

for (const item of allItems) {
  if (item.attachmentUrl) registerMedia(item.attachmentUrl, "attachment", item.id);
  for (const url of extractUploadUrls(item.contentHtml)) registerMedia(url, "content", item.id);
  for (const url of extractUploadUrls(item.excerptHtml)) registerMedia(url, "excerpt", item.id);
}
for (const page of pageSnapshots) {
  for (const url of extractUploadUrls(page.contentHtml)) registerMedia(url, "page-content", page.id);
  for (const url of extractUploadUrls(page.excerptHtml)) registerMedia(url, "page-excerpt", page.id);
}

const usedPaths = new Map();
const mediaSources = [...mediaSourceKinds.values()]
  .map((record) => ({
    sourceUrl: record.sourceUrl,
    localPath: localMediaPath(record.sourceUrl, usedPaths),
    kinds: [...record.kinds].sort(),
    ownerIds: [...record.ownerIds].sort((a, b) => a - b),
  }))
  .sort((a, b) => a.localPath.localeCompare(b.localPath));

function countBy(items, key) {
  return Object.fromEntries(
    [...new Map(items.map((item) => [item[key], 0])).keys()]
      .filter(Boolean)
      .sort()
      .map((value) => [value, items.filter((item) => item[key] === value).length]),
  );
}

const publishedPosts = contentItems.filter(
  (item) => item.type === "post" && item.status === "publish",
);
const audit = {
  generatedAt: new Date().toISOString(),
  exports: {
    contentItems: contentItems.length,
    mediaItems: mediaItems.length,
  },
  counts: {
    byType: countBy(contentItems, "type"),
    byStatus: countBy(contentItems, "status"),
    publishedPosts: publishedPosts.length,
    mediaUrls: mediaSources.length,
  },
  dateRange: {
    from: publishedPosts.map((item) => item.publishedAt).sort()[0] ?? null,
    to: publishedPosts.map((item) => item.publishedAt).sort().at(-1) ?? null,
  },
  categories: Object.entries(
    publishedPosts
      .flatMap((item) => item.categories.filter((category) => category.domain === "category"))
      .reduce((counts, category) => {
        counts[category.name] = (counts[category.name] ?? 0) + 1;
        return counts;
      }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count),
};

await mkdir(GENERATED_DIR, { recursive: true });
await Promise.all([
  writeFile(
    path.join(GENERATED_DIR, "wordpress-audit.json"),
    `${JSON.stringify(audit, null, 2)}\n`,
  ),
  writeFile(
    path.join(GENERATED_DIR, "media-sources.json"),
    `${JSON.stringify(mediaSources, null, 2)}\n`,
  ),
]);

console.log(`Audit terminé : ${publishedPosts.length} articles publiés.`);
console.log(`${mediaSources.length} URL de médias uniques à télécharger.`);
