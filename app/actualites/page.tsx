import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import generatedArticles from "@/data/generated/article-index.json";
import { localArticleIndex, mergeArticles } from "@/lib/articles";
import { FilterRail } from "@/components/articles/filter-rail";
import { SiteFooter } from "@/components/layout/site-footer";
import styles from "@/components/articles/articles.module.css";

export const metadata: Metadata = { title: "Actualités — Cercle d'Échecs de Bischwiller" };
const PAGE_SIZE = 12;
type Search = Promise<{ page?: string; categorie?: string }>;

export default async function NewsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const articles = mergeArticles(generatedArticles, localArticleIndex);
  const categories = Array.from(new Set(articles.flatMap((article) => article.categories))).sort();
  const selected = query.categorie ?? "";
  const filtered = selected ? articles.filter((article) => article.categories.includes(selected)) : articles;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(query.page) || 1));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const href = (nextPage: number) => `/actualites?page=${nextPage}${selected ? `&categorie=${encodeURIComponent(selected)}` : ""}`;

  return <main className={styles.page}>
    <header className={styles.hero}><div className={styles.heroInner}><span className={styles.eyebrow}>La vie du club</span><h1>Actualités</h1><p>Compétitions, résultats, formations et temps forts du Cercle d’Échecs de Bischwiller.</p></div></header>
    <section className={styles.content}>
      <FilterRail className={styles.filters}><Link className={!selected ? styles.active : ""} aria-current={!selected ? "page" : undefined} href="/actualites">Tout</Link>{categories.map((category) => <Link className={selected === category ? styles.active : ""} aria-current={selected === category ? "page" : undefined} href={`/actualites?categorie=${encodeURIComponent(category)}`} key={category}>{category}</Link>)}</FilterRail>
      <div className={styles.grid}>{visible.map((article) => <article className={styles.card} key={article.id} data-reveal>
        <Link className={styles.image} href={`/actualites/${article.slug}`}>{article.featuredImage ? <Image src={article.featuredImage} alt="" fill sizes="(max-width: 560px) 100vw, (max-width: 850px) 50vw, 33vw" /> : null}</Link>
        <div className={styles.cardBody}><span className={styles.meta}>{new Date(article.publishedAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</span><h2><Link href={`/actualites/${article.slug}`}>{article.title}</Link></h2><Link className={styles.read} href={`/actualites/${article.slug}`}>Lire l’article →</Link></div>
      </article>)}</div>
      {pages > 1 && <nav className={styles.pagination} aria-label="Pagination">{page > 1 && <Link href={href(page - 1)}>←</Link>}<span className={styles.current}>{page}</span><span>sur {pages}</span>{page < pages && <Link href={href(page + 1)}>→</Link>}</nav>}
    </section><SiteFooter />
  </main>;
}
