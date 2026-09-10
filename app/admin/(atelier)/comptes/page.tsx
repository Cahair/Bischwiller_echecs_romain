import Link from "next/link";
import { redirect } from "next/navigation";
import { cancelLink } from "@/app/admin/account-actions";
import { AccountRowActions } from "@/components/admin/account-row-actions";
import { Icon } from "@/components/admin/icons";
import { InviteForm } from "@/components/admin/invite-form";
import { LINK_VALIDITY_DAYS, listAccessLinks } from "@/lib/admin/accounts";
import { readAdminSession } from "@/lib/admin/session";
import { readAdminUsers } from "@/lib/admin/users";
import styles from "@/components/admin/admin.module.css";

const ROLE_LABEL = { admin: "Administrateur", redacteur: "Rédacteur" } as const;

function formatDay(time: number): string {
  return new Date(time).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

export default async function AccountsPage() {
  const session = await readAdminSession();
  if (!session) redirect("/admin");
  const users = readAdminUsers().sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const pending = listAccessLinks();

  return (
    <>
      <header className={styles.pageHead}>
        <Link className={styles.back} href="/admin">
          <Icon name="back" /> Retour à la liste des articles
        </Link>
        <h1>Les comptes</h1>
        <p>
          Invitez un membre du club&nbsp;: il reçoit un lien, choisit lui-même son mot de passe, et personne d’autre ne le connaît. Chaque
          lien ne sert qu’une fois et expire au bout de {LINK_VALIDITY_DAYS}&nbsp;jours.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="inviter">
        <h2 className={styles.sectionTitle} id="inviter">
          Inviter un membre
        </h2>
        <p className={styles.sectionHint}>Le lien s’envoie ensuite comme vous voulez&nbsp;: e-mail, SMS, WhatsApp…</p>
        <InviteForm />
      </section>

      {pending.length > 0 ? (
        <section className={styles.section} aria-labelledby="en-attente">
          <h2 className={styles.sectionTitle} id="en-attente">
            Liens pas encore utilisés
          </h2>
          <ul className={styles.accountList}>
            {pending.map((link) => (
              <li className={styles.accountRow} key={link.id}>
                <div className={styles.accountMain}>
                  <span className={styles.accountName}>{link.name}</span>
                  <span className={styles.accountMeta}>
                    {link.kind === "invitation" ? `Invitation · identifiant ${link.login}` : "Nouveau mot de passe"} · valable jusqu’au{" "}
                    {formatDay(link.expiresAt)}
                  </span>
                </div>
                <form className={styles.accountActions} action={cancelLink}>
                  <input type="hidden" name="id" value={link.id} />
                  <button className={styles.buttonGhost} type="submit">
                    Annuler ce lien
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="comptes-actifs">
        <h2 className={styles.sectionTitle} id="comptes-actifs">
          Comptes actifs ({users.length})
        </h2>
        <p className={styles.sectionHint}>
          «&nbsp;Nouveau mot de passe&nbsp;» crée un lien pour qui a oublié le sien. L’ancien mot de passe reste valable jusqu’à ce que le
          nouveau soit choisi.
        </p>
        <ul className={styles.accountList}>
          {users.map((user) => (
            <li className={styles.accountRow} key={user.login}>
              <div className={styles.accountMain}>
                <span className={styles.accountName}>
                  {user.name}
                  {user.login === session.login ? " (vous)" : ""}
                </span>
                <span className={styles.accountMeta}>
                  Identifiant&nbsp;: {user.login} ·{" "}
                  <span className={user.role === "admin" ? styles.roleAdmin : styles.roleWriter}>{ROLE_LABEL[user.role]}</span>
                </span>
              </div>
              <AccountRowActions login={user.login} name={user.name} self={user.login === session.login} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
