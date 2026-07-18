import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

export const ROOT_DIR = process.cwd();
export const CONTENT_EXPORT = path.join(ROOT_DIR, "data", "wordpress", "content.xml");
export const MEDIA_EXPORT = path.join(ROOT_DIR, "data", "wordpress", "media.xml");
export const GENERATED_DIR = path.join(ROOT_DIR, "data", "generated");
export const PAGE_SNAPSHOT = path.join(GENERATED_DIR, "pages.json");
export const MEDIA_DIR = path.join(ROOT_DIR, "public", "media", "wordpress");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: false,
  isArray: (_name, jPath) =>
    [
      "rss.channel.item",
      "rss.channel.item.category",
      "rss.channel.item.wp:postmeta",
      "rss.channel.item.wp:comment",
    ].includes(jPath),
});

export async function readExport(filePath) {
  const xml = await readFile(filePath, "utf8");
  return parser.parse(xml).rss.channel;
}

const windows1252Bytes = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

function repairMojibake(value) {
  if (!/[ÃÂâð]/.test(value)) return value;
  const bytes = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0xff) bytes.push(codePoint);
    else if (windows1252Bytes.has(codePoint)) bytes.push(windows1252Bytes.get(codePoint));
    else return value;
  }
  const repaired = Buffer.from(bytes).toString("utf8");
  if (repaired.includes("�")) return value;
  return (repaired.match(/[ÃÂâð]/g) ?? []).length < (value.match(/[ÃÂâð]/g) ?? []).length
    ? repaired
    : value;
}

export function text(value) {
  if (value == null) return "";
  const raw =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : String(value["#text"] ?? "");
  return repairMojibake(repairMojibake(raw));
}

export function array(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function decodeHtmlEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#038;", "&")
    .replaceAll("&#38;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    );
}

export function slugify(value, fallback = "contenu") {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug || fallback;
}

export function postMeta(item) {
  return Object.fromEntries(
    array(item["wp:postmeta"]).map((meta) => [
      text(meta["wp:meta_key"]),
      text(meta["wp:meta_value"]),
    ]),
  );
}

export function categories(item) {
  return array(item.category).map((category) => ({
    domain: category["@_domain"] ?? "",
    slug: category["@_nicename"] ?? slugify(text(category)),
    name: text(category),
  }));
}

export function normalizedItem(item) {
  const id = Number(text(item["wp:post_id"])) || 0;
  const title = decodeHtmlEntities(text(item.title)).trim();
  const postName = text(item["wp:post_name"]).trim();
  const type = text(item["wp:post_type"]);
  const status = text(item["wp:status"]);
  const meta = postMeta(item);

  return {
    id,
    type,
    status,
    title,
    slug: slugify(postName || title, `${type || "contenu"}-${id}`),
    link: text(item.link).trim(),
    guid: text(item.guid).trim(),
    author: text(item["dc:creator"]).trim(),
    publishedAt: text(item["wp:post_date_gmt"]).trim() || text(item["wp:post_date"]).trim(),
    modifiedAt:
      text(item["wp:post_modified_gmt"]).trim() || text(item["wp:post_modified"]).trim(),
    excerptHtml: text(item["excerpt:encoded"]).trim(),
    contentHtml: text(item["content:encoded"]).trim(),
    categories: categories(item),
    featuredMediaId: Number(meta._thumbnail_id) || null,
    attachmentUrl: text(item["wp:attachment_url"]).trim(),
    parentId: Number(text(item["wp:post_parent"])) || null,
  };
}

export function extractUploadUrls(value) {
  if (!value) return [];
  const decoded = decodeHtmlEntities(value);
  const matches = decoded.match(/https?:\/\/[^\s"'<>\\)]+/gi) ?? [];
  return matches
    .map((url) => url.replace(/[.,;:]$/, ""))
    .filter((url) => /\/wp-content\/uploads\//i.test(url));
}

export function normalizeSourceUrl(value) {
  try {
    const cleaned = decodeHtmlEntities(value).split("|")[0].split("]")[0];
    const url = new URL(cleaned);
    if (url.hostname.toLowerCase() === "www.bischwiller-echecs.com") {
      url.hostname = "bischwiller-echecs.com";
      url.protocol = "https:";
    }
    url.hash = "";
    url.search = "";
    return url.href;
  } catch {
    return null;
  }
}

function safeSegment(value) {
  return decodeURIComponent(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/[. ]+$/g, "")
    .slice(0, 160);
}

export function localMediaPath(sourceUrl, usedPaths = new Map()) {
  const url = new URL(sourceUrl);
  const marker = "/wp-content/uploads/";
  const markerIndex = url.pathname.toLowerCase().indexOf(marker);
  const rawRelative =
    markerIndex >= 0
      ? url.pathname.slice(markerIndex + marker.length)
      : `misc/${path.posix.basename(url.pathname) || "media"}`;
  const safeRelative = rawRelative
    .split("/")
    .filter(Boolean)
    .map(safeSegment)
    .join("/");
  let localPath = `/media/wordpress/${safeRelative || "media"}`;
  const existingSource = usedPaths.get(localPath.toLowerCase());
  if (existingSource && existingSource !== sourceUrl) {
    const extension = path.posix.extname(localPath);
    const suffix = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 8);
    localPath = `${localPath.slice(0, -extension.length)}-${suffix}${extension}`;
  }
  usedPaths.set(localPath.toLowerCase(), sourceUrl);
  return localPath;
}

export function sortByDateDescending(items) {
  return [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
