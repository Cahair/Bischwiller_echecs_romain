import type { Metadata } from "next";
import Link from "next/link";
import { AccessForm } from "@/components/admin/access-form";
import { EXPIRED_LINK, findAccessLink } from "@/lib/admin/accounts";
import { MIN_PASSWORD_LENGTH } from "@/lib/admin/users";
import styles from "@/components/admin/admin.module.css";

// Le jeton est dans l’adresse : elle ne doit être transmise à aucun autre site.
export const metadata: Metadata = { title: "Votre accès", referrer: "no-referrer" };

/**
 * Page publique du lien d’invitation ou de nouveau mot de passe. L’afficher ne
 * consomme pas le lien — les messageries l’ouvrent pour en faire l’aperçu — :
 * seul l’envoi du formulaire le fait.
 */
export default async function AccessLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = findAccessLink(token);
  const firstName = link?.name.split(" ")[0] ?? "";

  return (
    <div className={styles.login}>
      <div className={styles.loginCard}>
        {link ? (
          <>
            <h1>{link.kind === "invitation" ? `Bienvenue ${firstName} !` : `Bonjour ${firstName}`}</h1>
            <p>
              {link.kind === "invitation"
                ? "Le club vous invite à écrire des articles pour son site. Il ne reste qu’à choisir votre mot de passe."
                : "Choisissez un nouveau mot de passe pour l’espace de rédaction du club."}
            </p>
            <div className={styles.identity}>
              <span>Votre identifiant</span>
              <strong>{link.login}</strong>
              <small>Notez-le&nbsp;: avec votre mot de passe, il vous servira à revenir.</small>
            </div>
            <AccessForm token={token} login={link.login} reset={link.kind === "reinitialisation"} minLength={MIN_PASSWORD_LENGTH} />
          </>
        ) : (
          <>
            <h1>Lien expiré</h1>
            <div>
              <p className={styles.error}>{EXPIRED_LINK}</p>
            </div>
            <Link className={styles.buttonGhost} href="/admin/connexion">
              J’ai déjà un accès&nbsp;: me connecter
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
