import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import articles from "@/data/generated/articles.json";
import { SiteFooter } from "@/components/layout/site-footer";
import styles from "@/components/articles/articles.module.css";

export function generateStaticParams() { return articles.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const article = articles.find((item) => item.slug === slug);
  return article ? { title: `${article.title} — Cercle d'Échecs de Bischwiller`, description: article.excerpt || undefined } : {};
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const article = articles.find((item) => item.slug === slug); if (!article) notFound();
  const date = new Date(article.publishedAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return <main className={styles.page}><header className={styles.articleHero}>{article.featuredImage && <Image src={article.featuredImage} alt="" fill priority quality={90} sizes="100vw" />}<div className={styles.shade} /><div className={styles.articleHeading}><span className={styles.eyebrow}>{article.categories.join(" · ") || "Actualités"}</span><h1>{article.title}</h1><p>{date} · {article.author}</p></div></header><article className={styles.prose}><Link className={styles.back} href="/actualites">← Toutes les actualités</Link><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children, ...props }) => { const isDocument = href ? /\.(pdf|docx?|xlsx?|pptx?|odt|ods|zip)([?#]|$)/i.test(href) : false; return <a href={href} target={isDocument ? "_blank" : undefined} rel={isDocument ? "noreferrer" : undefined} {...props}>{children}</a>; } }}>{article.contentMarkdown}</ReactMarkdown></article><SiteFooter /></main>;
}
