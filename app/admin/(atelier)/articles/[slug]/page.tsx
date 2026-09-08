import Link from "next/link";
import { notFound } from "next/navigation";
import { findStoredArticle, knownCategories, toInputDate } from "@/lib/admin/store";
import { ArticleEditor } from "@/components/admin/article-editor";
import styles from "@/components/admin/admin.module.css";

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ enregistre?: string }>;
}) {
  const { slug } = await params;
  const article = findStoredArticle(slug);
  if (!article) notFound();
  const query = await searchParams;

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Modifier l’article</h1>
        {article.status === "publish" ? (
          <Link className={styles.buttonGhost} href={`/actualites/${article.slug}`} target="_blank" rel="noreferrer">
            Voir en ligne ↗
          </Link>
        ) : null}
        <Link className={styles.buttonGhost} href="/admin">
          ← Tous les articles
        </Link>
      </div>
      <ArticleEditor
        isNew={false}
        savedOnLoad={query.enregistre === "1"}
        knownCategories={knownCategories()}
        article={{
          slug: article.slug,
          title: article.title,
          publishedAt: toInputDate(article.publishedAt),
          author: article.author,
          excerpt: article.excerpt,
          categories: article.categories.join(", "),
          tags: article.tags.join(", "),
          featuredImage: article.featuredImage ?? "",
          featuredImageFit: article.featuredImageFit === "contain",
          status: article.status === "publish" ? "publish" : "draft",
          contentMarkdown: article.contentMarkdown,
        }}
      />
    </>
  );
}
