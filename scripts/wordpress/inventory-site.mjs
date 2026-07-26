import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GENERATED_DIR } from "./lib.mjs";

const endpoint =
  "https://bischwiller-echecs.com/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,link,title,status,parent,date_gmt,modified_gmt";
const response = await fetch(endpoint, {
  headers: { "user-agent": "Bischwiller-Echecs-Migration/1.0" },
  signal: AbortSignal.timeout(30_000),
});
if (!response.ok) throw new Error(`WordPress API: HTTP ${response.status}`);
const rawPages = await response.json();

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

const systemSlugs = new Set(["connexion", "modifier", "compte", "tableau-de-bord"]);
const archiveSlugs = new Set(["actualites", "tous-les-articles"]);
const duplicateSlugs = new Set(["un-peu-dhistoire-2"]);

const pages = rawPages
  .map((page) => {
    const contentHtml = "";
    const excerptHtml = "";
    const text = cleanText(contentHtml);
    let migrationRole = "content";
    if (page.slug === "accueil") migrationRole = "home";
    else if (systemSlugs.has(page.slug)) migrationRole = "wordpress-system";
    else if (archiveSlugs.has(page.slug)) migrationRole = "archive";
    else if (duplicateSlugs.has(page.slug)) migrationRole = "legacy-duplicate";

    return {
      id: page.id,
      slug: page.slug,
      title: cleanText(page.title?.rendered ?? ""),
      route: new URL(page.link).pathname,
      originalUrl: page.link,
      status: page.status,
      parentId: page.parent || null,
      publishedAt: page.date_gmt,
      modifiedAt: page.modified_gmt,
      migrationRole,
      migrate: !["wordpress-system", "legacy-duplicate"].includes(migrationRole),
      wordCount: text ? text.split(/\s+/).length : 0,
      imageCount: (contentHtml.match(/<img\b/gi) ?? []).length,
      headingCount: (contentHtml.match(/<h[1-6]\b/gi) ?? []).length,
      excerptHtml,
      contentHtml,
    };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

const navigation = [
  {
    label: "Le Club",
    href: "/le-club/",
    children: [
      { label: "Un peu d’Histoire", href: "/un-peu-dhistoire/" },
      { label: "Palmarès", href: "/palmares/" },
      { label: "Scolaire", href: "/scolaire/" },
      { label: "Partenaires", href: "/partenaires/" },
    ],
  },
  { label: "Inscription", href: "/#inscriptions" },
  {
    label: "Actualités",
    href: "/actualites/",
    children: [{ label: "Articles", href: "/tous-les-articles/" }],
  },
  {
    label: "Infos Pratiques",
    href: "/infos-pratiques/",
    children: [
      { label: "Administratif", href: "/administratif/" },
      { label: "Horaires", href: "/horraires/" },
      { label: "Documents", href: "/documents/" },
    ],
  },
];

const inventory = {
  generatedAt: new Date().toISOString(),
  source: endpoint,
  summary: {
    pages: pages.length,
    pagesToMigrate: pages.filter((page) => page.migrate).length,
    wordpressSystemPages: pages.filter((page) => page.migrationRole === "wordpress-system").length,
    legacyDuplicates: pages.filter((page) => page.migrationRole === "legacy-duplicate").length,
  },
  navigation,
  pages: pages.map(({ contentHtml, excerptHtml, ...page }) => {
    void contentHtml;
    void excerptHtml;
    return page;
  }),
};

const markdownRows = inventory.pages
  .map(
    (page) =>
      `| ${page.title} | \`${page.route}\` | ${page.migrationRole} | ${page.migrate ? "oui" : "non"} | ${page.wordCount} | ${page.imageCount} |`,
  )
  .join("\n");
const markdown = `# Inventaire du site\n\nGénéré le ${inventory.generatedAt}.\n\n- ${inventory.summary.pages} pages WordPress publiées\n- ${inventory.summary.pagesToMigrate} pages à reconstruire\n- ${inventory.summary.wordpressSystemPages} pages techniques WordPress à abandonner\n- ${inventory.summary.legacyDuplicates} doublon historique à rediriger\n\n| Page | Route | Rôle | Migrer | Mots | Images |\n| --- | --- | --- | --- | ---: | ---: |\n${markdownRows}\n`;

await mkdir(GENERATED_DIR, { recursive: true });
await mkdir(path.join(process.cwd(), "docs"), { recursive: true });
await Promise.all([
  writeFile(path.join(GENERATED_DIR, "pages.json"), `${JSON.stringify(pages, null, 2)}\n`),
  writeFile(
    path.join(GENERATED_DIR, "site-inventory.json"),
    `${JSON.stringify(inventory, null, 2)}\n`,
  ),
  writeFile(path.join(process.cwd(), "docs", "site-inventory.md"), markdown),
]);

console.log(
  `Inventaire : ${inventory.summary.pagesToMigrate} pages à migrer, ${inventory.summary.wordpressSystemPages} pages WordPress exclues.`,
);
