import Link from "next/link";
import { ArticleEditor } from "@/components/admin/article-editor";
import { Icon } from "@/components/admin/icons";
import { categoryUsage, DEFAULT_AUTHOR, stampDate, toInputDate } from "@/lib/admin/store";
import styles from "@/components/admin/admin.module.css";

export default function NewArticlePage() {
  return (
    <>
      <header className={styles.pageHead}>
        <Link className={styles.back} href="/admin">
          <Icon name="back" /> Retour à la liste des articles
        </Link>
        <h1>Écrire un nouvel article</h1>
        <p>
          Remplissez les étapes ci-dessous&nbsp;: seuls le titre et le texte sont obligatoires. Rien n’apparaît sur le site tant que
          vous n’avez pas cliqué sur «&nbsp;Publier l’article&nbsp;».
        </p>
      </header>
      <ArticleEditor
        mode="new"
        restoresOriginal={false}
        savedOnLoad={null}
        categories={categoryUsage()}
        article={{
          slug: "",
          title: "",
          publishedAt: toInputDate(stampDate(new Date())),
          author: DEFAULT_AUTHOR,
          excerpt: "",
          categories: [],
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
