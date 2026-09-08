"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "@/app/admin/actions";
import styles from "./admin.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className={styles.button} type="submit" disabled={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export function SignInForm() {
  const [state, action] = useActionState(signIn, {});

  return (
    <form action={action}>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <label className={styles.field}>
        <span>Identifiant</span>
        <input className={styles.input} name="login" autoComplete="username" autoCapitalize="none" required autoFocus />
      </label>
      <label className={styles.field}>
        <span>Mot de passe</span>
        <input className={styles.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      <Submit />
    </form>
  );
}
