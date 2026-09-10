"use client";

import { useActionState, useState } from "react";
import { inviteMember, type LinkState } from "@/app/admin/account-actions";
import { slugify } from "@/lib/markdown";
import { Icon } from "./icons";
import { LinkPanel } from "./link-panel";
import styles from "./admin.module.css";

/** Le prénom, sans accent ni majuscule : l’identifiant le plus facile à retenir. */
function suggestLogin(name: string): string {
  return slugify(name.trim().split(/\s+/)[0] ?? "").slice(0, 32);
}

export function InviteForm() {
  const [state, action, pending] = useActionState<LinkState, FormData>(inviteMember, {});
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [loginPinned, setLoginPinned] = useState(false);
  const [role, setRole] = useState<"redacteur" | "admin">("redacteur");

  // Invitation créée : le formulaire se vide pour la suivante, le lien reste affiché.
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.link) {
      setName("");
      setLogin("");
      setLoginPinned(false);
      setRole("redacteur");
    }
  }

  return (
    <>
      {state.link ? <LinkPanel link={state.link} /> : null}
      <form className={styles.inviteForm} action={action}>
        {state.error ? (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        ) : null}
        <div className={styles.row2}>
          <label className={styles.field}>
            <span>Prénom et nom</span>
            <input
              className={styles.input}
              name="name"
              value={name}
              required
              maxLength={60}
              placeholder="Par exemple : Jean Dupont"
              onChange={(event) => {
                setName(event.target.value);
                if (!loginPinned) setLogin(suggestLogin(event.target.value));
              }}
            />
          </label>
          <label className={styles.field}>
            <span>Identifiant</span>
            <input
              className={styles.input}
              name="login"
              value={login}
              required
              maxLength={32}
              autoCapitalize="none"
              spellCheck={false}
              onChange={(event) => {
                setLoginPinned(true);
                setLogin(event.target.value.toLowerCase());
              }}
            />
            <small className={styles.hint}>Ce que la personne tapera pour se connecter. Proposé d’après le prénom.</small>
          </label>
        </div>
        <fieldset className={styles.roles}>
          <legend>Ce qu’elle pourra faire</legend>
          <label className={styles.roleOption}>
            <input type="radio" name="role" value="redacteur" checked={role === "redacteur"} onChange={() => setRole("redacteur")} />
            <span>
              <strong>Rédacteur</strong> — écrire, publier et corriger des articles.
            </span>
          </label>
          <label className={styles.roleOption}>
            <input type="radio" name="role" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} />
            <span>
              <strong>Administrateur</strong> — en plus, inviter des membres et retirer des accès.
            </span>
          </label>
        </fieldset>
        <button className={styles.button} type="submit" disabled={pending}>
          <Icon name="plus" /> {pending ? "Création du lien…" : "Créer le lien d’invitation"}
        </button>
      </form>
    </>
  );
}
