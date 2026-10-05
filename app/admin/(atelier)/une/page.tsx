import Link from "next/link";
import { FeaturedEditor } from "@/components/admin/featured-editor";
import { Icon } from "@/components/admin/icons";
import { readFeatured } from "@/lib/featured";
import styles from "@/components/admin/admin.module.css";

function formatStamp(stamp: string): string {
  const date = new Date(`${stamp.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export default function FeaturedPage() {
  const featured = readFeatured();
  const updated = featured.updatedAt ? formatStamp(featured.updatedAt) : "";

  return (
    <>
      <header className={styles.pageHead}>
        <Link className={styles.back} href="/admin">
          <Icon name="back" /> Retour à la liste des articles
        </Link>
        <h1>Le contenu à la une</h1>
        <p>
          Ce bloc s’affiche en haut de la page d’accueil, juste sous la vidéo&nbsp;: une annonce, un tournoi, un résultat à mettre en
          avant. L’interrupteur ci-dessous l’affiche ou le retire du site, sans rien effacer.
        </p>
        {updated ? (
          <p className={styles.pageHeadMeta}>
            Dernière modification le {updated}
            {featured.updatedBy ? ` par ${featured.updatedBy}` : ""}.
          </p>
        ) : null}
      </header>
      <FeaturedEditor
        featured={{
          enabled: featured.enabled,
          title: featured.title,
          text: featured.text,
          image: featured.image,
          imageAlt: featured.imageAlt,
        }}
      />
    </>
  );
}
