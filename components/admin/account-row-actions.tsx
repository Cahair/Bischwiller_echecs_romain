"use client";

import { useActionState } from "react";
import { createResetLink, removeMember, type LinkState } from "@/app/admin/account-actions";
import { Icon } from "./icons";
import { LinkPanel } from "./link-panel";
import styles from "./admin.module.css";

/** Boutons d’un compte. Le lien de nouveau mot de passe s’affiche sous la ligne. */
export function AccountRowActions({ login, name, self }: { login: string; name: string; self: boolean }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(createResetLink, {});

  return (
    <>
      <div className={styles.accountActions}>
        <form action={action}>
          <input type="hidden" name="login" value={login} />
          <button className={styles.buttonGhost} type="submit" disabled={pending}>
            <Icon name="key" /> {pending ? "Création du lien…" : "Nouveau mot de passe"}
          </button>
        </form>
        {self ? null : (
          <form
            action={removeMember}
            onSubmit={(event) => {
              if (!window.confirm(`Retirer l’accès de ${name} ? Si cette personne est connectée, elle sera déconnectée aussitôt.`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="login" value={login} />
            <button className={styles.buttonDanger} type="submit">
              <Icon name="trash" /> Retirer l’accès
            </button>
          </form>
        )}
      </div>
      {state.error ? (
        <p className={`${styles.error} ${styles.accountWide}`} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.link ? (
        <div className={styles.accountWide}>
          <LinkPanel link={state.link} />
        </div>
      ) : null}
    </>
  );
}
