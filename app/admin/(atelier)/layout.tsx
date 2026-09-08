import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
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
      <div className={styles.bar}>
        <Link className={styles.brand} href="/admin">
          Articles <span>C.E. Bischwiller</span>
        </Link>
        <Link className={styles.barLink} href="/actualites" target="_blank" rel="noreferrer">
          Voir le site ↗
        </Link>
        <span className={styles.who}>{session.name}</span>
        <form action={signOut}>
          <button className={styles.barLink} type="submit">
            Déconnexion
          </button>
        </form>
      </div>
      <main className={styles.main}>{children}</main>
    </>
  );
}
