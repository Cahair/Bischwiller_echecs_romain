import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import generatedArticles from "@/data/generated/articles.json";
import { SiteFooter } from "@/components/layout/site-footer";
import { flowingText, localArticles, mergeArticles } from "@/lib/articles";
import { fullSizePhoto, photoFrame, photoSize } from "@/lib/image-size";
import styles from "@/components/articles/articles.module.css";

const articles = mergeArticles(generatedArticles, localArticles);

export function generateStaticParams() { return articles.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const article = articles.find((item) => item.slug === slug);
  return article ? { title: `${article.title} — Cercle d'Échecs de Bischwiller`, description: article.excerpt || undefined } : {};
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const article = articles.find((item) => item.slug === slug); if (!article) notFound();
  const date = new Date(article.publishedAt.replace(" ", "T") + "Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const cover = article.featuredImage || null;
  return <main className={styles.page}><header className={`${styles.articleHero} ${cover ? styles.heroSplit : ""}`}>{cover && <div className={styles.heroBackdrop} aria-hidden="true"><Image src={cover} alt="" fill quality={75} sizes="220px" /></div>}<div className={styles.shade} /><div className={styles.articleInner}><div className={styles.articleHeading}><span className={styles.eyebrow}>{article.categories.join(" · ") || "Actualités"}</span><h1>{article.title}</h1><p>{date} · {article.author}</p></div>{cover && <div className={styles.heroPhoto} style={photoFrame(cover)}><Image src={cover} alt="" fill priority quality={90} sizes="(max-width: 900px) 100vw, 620px" /></div>}</div></header><article className={styles.prose}><Link className={styles.back} href="/actualites">← Toutes les actualités</Link><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children, ...props }) => { const isDocument = href ? /\.(pdf|docx?|xlsx?|pptx?|odt|ods|zip)([?#]|$)/i.test(href) : false; return <a href={href} target={isDocument ? "_blank" : undefined} rel={isDocument ? "noreferrer" : undefined} {...props}>{children}</a>; }, img: ({ src, alt, title, ...props }) => {
    // Photos du club : servies à leur taille d’origine, à la largeur de la colonne.
    const photo = typeof src === "string" && src.startsWith("/") ? fullSizePhoto(src) : null;
    const size = photo ? photoSize(photo) : null;
    if (photo && size && size[0] >= 300) return <Image className={styles.photo} style={{ "--photo-width": `${size[0]}px` } as CSSProperties} src={photo} alt={alt ?? ""} title={title} width={size[0]} height={size[1]} quality={90} sizes="(max-width: 900px) 100vw, 940px" />;
    // Illustrations restées sur l’ancien serveur WordPress : dimensions inconnues.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} title={title} loading="lazy" {...props} />;
  } }}>{flowingText(article.contentMarkdown)}</ReactMarkdown></article><SiteFooter /></main>;
}
