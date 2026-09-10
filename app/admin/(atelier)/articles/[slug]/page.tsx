import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/article-editor";
import { Icon } from "@/components/admin/icons";
import { categoryUsage, findAdminArticle, toInputDate } from "@/lib/admin/store";
import styles from "@/components/admin/admin.module.css";

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ enregistre?: string }>;
}) {
  const { slug } = await params;
  const article = findAdminArticle(slug);
  if (!article) notFound();
  const { enregistre } = await searchParams;
  const saved = enregistre === "publish" || enregistre === "draft" ? enregistre : null;

  return (
    <>
      <header className={styles.pageHead}>
        <Link className={styles.back} href="/admin">
          <Icon name="back" /> Retour à la liste des articles
        </Link>
        <h1>Modifier l’article</h1>
        <p>
          {article.source === "imported"
            ? "Cet article vient de l’ancien site. Vos corrections en créeront une copie qui le remplacera sur le site ; l’original reste de côté et pourra être rétabli."
            : article.status === "draft"
              ? "Ce brouillon n’est pas encore visible sur le site."
              : "Cet article est en ligne : vos modifications seront visibles dès que vous les aurez enregistrées."}
        </p>
      </header>
      <ArticleEditor
        mode={article.source === "imported" ? "imported" : "local"}
        restoresOriginal={article.shadowsImported}
        savedOnLoad={saved}
        categories={categoryUsage()}
        article={{
          slug: article.slug,
          title: article.title,
          publishedAt: toInputDate(article.publishedAt),
          author: article.author,
          excerpt: article.excerpt,
          categories: article.categories,
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
