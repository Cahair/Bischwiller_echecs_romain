import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { Icon } from "@/components/admin/icons";
import { readSession } from "@/lib/admin/session";
import styles from "@/components/admin/admin.module.css";

/**
 * Tout ce que ce groupe de routes contient exige une session. Les actions
 * serveur revérifient de leur côté : ce garde-fou protège l’affichage, pas
 * l’écriture, qui ne doit jamais dépendre de la page qui l’a déclenchée.
 */
export default async function AtelierLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/admin/connexion");

  return (
    <>
      <header className={styles.bar}>
        <Link className={styles.brand} href="/admin">
          <Image src="/media/wordpress/2025/06/images.webp" alt="" width={36} height={36} />
          <span className={styles.brandText}>
            Espace de rédaction
            <small>Cercle d’Échecs de Bischwiller</small>
          </span>
        </Link>
        <nav className={styles.barNav} aria-label="Espace admin">
          {session.role === "admin" ? (
            <Link className={styles.barLink} href="/admin/comptes">
              <Icon name="users" /> Comptes
            </Link>
          ) : null}
          <a className={styles.barLink} href="/" target="_blank" rel="noreferrer">
            Voir le site <Icon name="external" />
          </a>
          <span className={styles.who}>{session.name}</span>
          <form action={signOut}>
            <button className={styles.barLink} type="submit">
              Se déconnecter
            </button>
          </form>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </>
  );
}
