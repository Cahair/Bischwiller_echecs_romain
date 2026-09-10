import { redirect } from "next/navigation";
import { readSession } from "@/lib/admin/session";
import { readAdminUsers } from "@/lib/admin/users";
import { SignInForm } from "@/components/admin/sign-in-form";
import styles from "@/components/admin/admin.module.css";

export default async function SignInPage() {
  if (await readSession()) redirect("/admin");
  const hasAccounts = readAdminUsers().length > 0;

  return (
    <div className={styles.login}>
      <div className={styles.loginCard}>
        <h1>Espace admin</h1>
        <p>Cercle d’Échecs de Bischwiller</p>
        {hasAccounts ? (
          <>
            <SignInForm />
            <p className={styles.loginHelp}>
              Mot de passe oublié&nbsp;? Demandez à un administrateur du club de vous envoyer un lien pour en choisir un nouveau.
            </p>
          </>
        ) : (
          <p className={styles.error}>
            Aucun compte n’est encore créé. Depuis la console SSH du serveur, dans le dossier du site, lancez{" "}
            <code>node scripts/admin/user.mjs ajouter &lt;identifiant&gt; &quot;&lt;Nom&gt;&quot;</code> puis rechargez cette page.
          </p>
        )}
      </div>
    </div>
  );
}
