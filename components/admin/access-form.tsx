"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { acceptAccessLink, type LinkState } from "@/app/admin/account-actions";
import styles from "./admin.module.css";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={styles.button} type="submit" disabled={pending}>
      {pending ? "Un instant…" : label}
    </button>
  );
}

/** Le membre choisit son mot de passe ; personne d’autre ne le verra jamais. */
export function AccessForm({ token, login, reset, minLength }: { token: string; login: string; reset: boolean; minLength: number }) {
  const [state, action] = useActionState<LinkState, FormData>(acceptAccessLink, {});
  const [visible, setVisible] = useState(false);
  const type = visible ? "text" : "password";

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {/* Pour que le navigateur retienne le mot de passe avec le bon identifiant. */}
      <input type="text" name="username" value={login} autoComplete="username" readOnly hidden />
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}
      <label className={styles.field}>
        <span>{reset ? "Votre nouveau mot de passe" : "Choisissez votre mot de passe"}</span>
        <input className={styles.input} name="password" type={type} autoComplete="new-password" minLength={minLength} required autoFocus />
      </label>
      <label className={styles.field}>
        <span>Retapez-le pour vérifier</span>
        <input className={styles.input} name="confirmation" type={type} autoComplete="new-password" minLength={minLength} required />
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} />
        <span>Afficher le mot de passe</span>
      </label>
      <p className={`${styles.hint} ${styles.accessHint}`}>
        Au moins {minLength} caractères. Le plus simple : trois ou quatre mots faciles à retenir, séparés par des espaces.
      </p>
      <Submit label={reset ? "Enregistrer mon nouveau mot de passe" : "Créer mon accès"} />
    </form>
  );
}
