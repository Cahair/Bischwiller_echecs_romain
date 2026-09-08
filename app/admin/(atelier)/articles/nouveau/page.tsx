import Link from "next/link";
import { readSession } from "@/lib/admin/session";
import { knownCategories, stampDate, toInputDate } from "@/lib/admin/store";
import { ArticleEditor } from "@/components/admin/article-editor";
import styles from "@/components/admin/admin.module.css";

export default async function NewArticlePage() {
  const session = await readSession();

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Nouvel article</h1>
        <Link className={styles.buttonGhost} href="/admin">
          ← Tous les articles
        </Link>
      </div>
      <ArticleEditor
        isNew
        savedOnLoad={false}
        knownCategories={knownCategories()}
        article={{
          slug: "",
          title: "",
          publishedAt: toInputDate(stampDate(new Date())),
          author: session?.name ?? "Cercle d’Échecs de Bischwiller",
          excerpt: "",
          categories: "",
          tags: "",
          featuredImage: "",
          featuredImageFit: false,
          status: "draft",
          contentMarkdown: "",
        }}
      />
    </>
  );
}
