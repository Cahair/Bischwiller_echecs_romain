import Link from "next/link";
import generatedArticles from "@/data/generated/article-index.json";
import { listStoredArticles } from "@/lib/admin/store";
import styles from "@/components/admin/admin.module.css";

function formatDate(stamp: string): string {
  return new Date(`${stamp.replace(" ", "T")}Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function AdminArticlesPage() {
  const articles = listStoredArticles();
  const drafts = articles.filter((article) => article.status === "draft").length;

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Articles</h1>
        <Link className={styles.button} href="/admin/articles/nouveau">
          Nouvel article
        </Link>
        <p>
          {articles.length === 0
            ? "Aucun article rédigé depuis le site pour l’instant."
            : `${articles.length} article${articles.length > 1 ? "s" : ""} rédigé${articles.length > 1 ? "s" : ""} depuis le site${drafts > 0 ? `, dont ${drafts} en brouillon` : ""}.`}{" "}
          Les {generatedArticles.length} articles repris de l’ancien site WordPress restent en ligne mais se modifient dans{" "}
          <code>content/articles/</code>.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className={styles.empty}>Commencez par écrire le premier — le bouton est juste au-dessus.</p>
      ) : (
        <div className={styles.list}>
          {articles.map((article) => (
            <article className={styles.row} key={article.slug}>
              <div className={styles.rowMain}>
                <Link href={`/admin/articles/${article.slug}`}>{article.title}</Link>
                <p className={styles.rowMeta}>
                  {formatDate(article.publishedAt)} · {article.author}
                  {article.categories.length > 0 ? ` · ${article.categories.join(", ")}` : ""}
                </p>
              </div>
              <span className={`${styles.badge} ${article.status === "publish" ? styles.badgePublished : styles.badgeDraft}`}>
                {article.status === "publish" ? "En ligne" : "Brouillon"}
              </span>
              {article.status === "publish" ? (
                <Link className={styles.buttonGhost} href={`/actualites/${article.slug}`} target="_blank" rel="noreferrer">
                  Voir
                </Link>
              ) : null}
              <Link className={styles.buttonGhost} href={`/admin/articles/${article.slug}`}>
                Modifier
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
