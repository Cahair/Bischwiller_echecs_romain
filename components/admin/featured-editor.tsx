"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { saveFeaturedForm, type FeaturedState } from "@/app/admin/featured-actions";
import { Icon } from "./icons";
import { Step } from "./step";
import { uploadFile } from "./upload";
import styles from "./admin.module.css";

export type FeaturedDraft = { enabled: boolean; title: string; text: string; image: string; imageAlt: string };

const UNSAVED = "Vous n’avez pas enregistré vos modifications. Quitter cette page quand même ?";

export function FeaturedEditor({ featured }: { featured: FeaturedDraft }) {
  const [state, action, pending] = useActionState<FeaturedState, FormData>(saveFeaturedForm, {});

  const [enabled, setEnabled] = useState(featured.enabled);
  const [title, setTitle] = useState(featured.title);
  const [text, setText] = useState(featured.text);
  const [image, setImage] = useState(featured.image);
  const [imageAlt, setImageAlt] = useState(featured.imageAlt);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<FeaturedState | null>(null);
  const [dragging, setDragging] = useState(false);
  // Clic sur « Enregistrer » avec le bloc allumé mais sans titre.
  const [attempted, setAttempted] = useState(false);

  const imageInput = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const snapshot = JSON.stringify([enabled, title, text, image, imageAlt]);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const [submittedSnapshot, setSubmittedSnapshot] = useState(snapshot);
  const [confirmation, setConfirmation] = useState<boolean | null>(null);
  const dirty = snapshot !== savedSnapshot;
  const busy = progress !== null;
  const titleMissing = attempted && enabled && title.trim() === "";

  // Réponse de l’action serveur, intégrée pendant le rendu : la confirmation
  // s’affiche sans rendu intermédiaire.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.savedAt) {
      setSavedSnapshot(submittedSnapshot);
      setConfirmation(state.savedEnabled ?? enabled);
    }
  }

  useEffect(() => {
    if (state.savedAt) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  // Quitter la page avec des modifications en cours : on demande d’abord.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    // Les liens internes naviguent sans recharger la page : `beforeunload` ne
    // les voit pas, on les intercepte avant Next.
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank" || window.confirm(UNSAVED)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("La photo doit être une image (JPEG, PNG…).");
      return;
    }
    setMessage(null);
    setProgress(0);
    try {
      setImage(await uploadFile(file, setProgress));
    } catch (error) {
      setMessage(`La photo n’a pas pu être envoyée. ${error instanceof Error ? error.message : ""}`);
    } finally {
      setProgress(null);
    }
  }

  /** Même contrôle que le serveur : un bloc affiché sans titre n’aurait rien à montrer. */
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (enabled && title.trim() === "") {
      event.preventDefault();
      setAttempted(true);
      const step = document.getElementById("etape-1-bloc");
      step?.scrollIntoView({ behavior: "smooth", block: "start" });
      step?.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
      return;
    }
    setAttempted(false);
    setSubmittedSnapshot(snapshot);
  }

  const serverError = state.error && dismissed !== state ? state.error : null;
  const alert = message ?? serverError;
  const statusLine = busy
    ? "Envoi de la photo en cours…"
    : titleMissing
      ? "Il manque le titre (étape 1)."
      : dirty
        ? "Modifications non enregistrées"
        : state.savedAt
          ? `Enregistré à ${state.savedAt}`
          : "";

  return (
    <>
      <div ref={topRef} className={styles.anchor} />
      {confirmation !== null && !dirty ? (
        <div className={styles.success} role="status">
          <span className={styles.successIcon}>
            <Icon name="check" size="1.6em" />
          </span>
          <div className={styles.successBody}>
            <strong>{confirmation ? "C’est en ligne ! Le contenu est à la une du site." : "C’est enregistré, et masqué."}</strong>
            <p>
              {confirmation
                ? "Il s’affiche en haut de la page d’accueil, juste sous la vidéo."
                : "Rien n’apparaît sur la page d’accueil. Vos textes restent ici, prêts à être réaffichés."}
            </p>
            <div className={styles.successActions}>
              {confirmation ? (
                <a className={styles.button} href="/" target="_blank" rel="noreferrer">
                  Voir la page d’accueil <Icon name="external" />
                </a>
              ) : null}
              <Link className={styles.buttonGhost} href="/admin">
                <Icon name="back" /> Retour à la liste des articles
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <form
        className={styles.form}
        action={action}
        noValidate
        onSubmit={onSubmit}
        onKeyDown={(event) => {
          // Entrée dans un champ d’une ligne enverrait tout le formulaire : surprise garantie.
          if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type !== "checkbox") {
            event.preventDefault();
          }
        }}
      >
        <section className={styles.switchCard} aria-labelledby="interrupteur">
          <h2 className={styles.switchTitle} id="interrupteur">
            Afficher ce contenu sur le site
          </h2>
          <label className={styles.switchRow}>
            <span className={styles.switch}>
              <input type="checkbox" name="enabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              <span className={styles.switchTrack} aria-hidden="true" />
            </span>
            <span className={styles.switchText}>
              <strong>{enabled ? "Affiché" : "Masqué"}</strong>
              <small>
                {enabled
                  ? "Le bloc apparaît en haut de la page d’accueil, juste sous la vidéo."
                  : "Rien n’apparaît sur la page d’accueil. Ce que vous écrivez ici reste enregistré."}
              </small>
            </span>
          </label>
        </section>

        <Step
          number={1}
          title="Le titre"
          need="required"
          done={title.trim() !== ""}
          error={titleMissing ? "Il manque le titre : écrivez-le dans le cadre ci-dessous." : null}
          hint="Court et parlant, comme un titre de journal."
        >
          <input
            className={`${styles.input} ${styles.titleInput}`}
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Par exemple : Open de Bischwiller, les inscriptions sont ouvertes"
            aria-labelledby="etape-1"
            aria-invalid={titleMissing || undefined}
            aria-describedby={titleMissing ? "etape-1-erreur" : undefined}
            maxLength={120}
          />
        </Step>

        <Step
          number={2}
          title="Le texte"
          need="optional"
          done={text.trim() !== ""}
          hint="Deux ou trois phrases. Pour commencer un nouveau paragraphe, laissez une ligne vide."
        >
          <textarea
            className={styles.textarea}
            name="text"
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Écrivez ici le texte qui accompagne le titre…"
            aria-labelledby="etape-2"
            spellCheck
          />
        </Step>

        <Step number={3} title="La photo" need="optional" done={image !== ""} hint="Elle s’affiche à côté du titre et du texte.">
          {progress !== null ? (
            <div className={styles.uploading} role="status">
              <span className={styles.spinner} /> Envoi de la photo… {progress} %
            </div>
          ) : image ? (
            <>
              {/* Adresse parfois tapée à la main : next/image exigerait des dimensions connues. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.coverImg} src={image} alt="Photo choisie pour la une" />
              <div className={styles.coverActions}>
                <button type="button" className={styles.buttonGhost} onClick={() => imageInput.current?.click()}>
                  <Icon name="camera" /> Changer de photo
                </button>
                <button type="button" className={styles.buttonGhost} onClick={() => setImage("")}>
                  <Icon name="trash" /> Retirer la photo
                </button>
              </div>
              <label className={styles.field}>
                <span>Description de la photo</span>
                <input
                  className={styles.input}
                  name="imageAlt"
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value)}
                  placeholder="Par exemple : les joueurs du club autour de l’échiquier"
                />
                <small className={styles.hint}>
                  Elle n’apparaît pas sur le site : elle est lue à voix haute aux personnes qui n’y voient pas.
                </small>
              </label>
            </>
          ) : (
            <button
              type="button"
              className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
              onClick={() => imageInput.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void pickImage(event.dataTransfer.files[0]);
              }}
            >
              <span className={styles.dropIcon}>
                <Icon name="camera" size="2em" />
              </span>
              Choisir une photo
              <span className={styles.dropSub}>ou faites-la glisser dans ce cadre</span>
            </button>
          )}
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = ""; // Permet de choisir deux fois la même photo.
              void pickImage(file);
            }}
          />
        </Step>

        <input type="hidden" name="image" value={image} />
        {image ? null : <input type="hidden" name="imageAlt" value="" />}

        <div className={styles.actionBar}>
          {alert ? (
            <p className={styles.actionAlert} role="alert">
              {alert}
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setDismissed(state);
                }}
              >
                Fermer
              </button>
            </p>
          ) : null}
          <span className={`${styles.actionStatus} ${titleMissing && !busy ? styles.actionStatusWarn : ""}`} aria-live="polite">
            {statusLine}
          </span>
          <button type="submit" className={styles.button} disabled={pending || busy}>
            <Icon name="check" /> {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}
