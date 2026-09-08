"use client";

import { useActionState, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { deleteArticleForm, saveArticleForm, type FormState } from "@/app/admin/actions";
import { flowingText, slugify } from "@/lib/markdown";
import articleStyles from "@/components/articles/articles.module.css";
import styles from "./admin.module.css";

/** Ce que l’éditeur manipule : des chaînes prêtes pour les champs du formulaire. */
export type EditorArticle = {
  slug: string;
  title: string;
  publishedAt: string;
  author: string;
  excerpt: string;
  categories: string;
  tags: string;
  featuredImage: string;
  featuredImageFit: boolean;
  status: "draft" | "publish";
  contentMarkdown: string;
};

const TABLE = "\n| Colonne | Colonne |\n| --- | --- |\n|  |  |\n";

async function upload(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/media", { method: "POST", body });
  const payload: { url?: string; error?: string } = await response.json().catch(() => ({}));
  if (!response.ok || !payload.url) throw new Error(payload.error ?? "Envoi impossible.");
  return payload.url;
}

export function ArticleEditor({
  article,
  knownCategories,
  isNew,
  savedOnLoad,
}: {
  article: EditorArticle;
  knownCategories: string[];
  isNew: boolean;
  savedOnLoad: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveArticleForm,
    savedOnLoad ? { savedAt: "à l’instant" } : {},
  );
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [body, setBody] = useState(article.contentMarkdown);
  const [cover, setCover] = useState(article.featuredImage);
  const [coverContain, setCoverContain] = useState(article.featuredImageFit);
  const [busy, setBusy] = useState<"inline" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const inlineInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  // Le slug suit le titre tant qu’on n’y a pas touché ; sur un article
  // existant il reste figé, le changer casserait les liens déjà partagés.
  const [slugPinned, setSlugPinned] = useState(!isNew);
  function onTitle(value: string) {
    setTitle(value);
    if (!slugPinned) setSlug(slugify(value));
  }

  /** Remplace la sélection du corps de texte, puis y replace le curseur. */
  function replaceSelection(build: (selected: string) => string) {
    const field = bodyRef.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end } = field;
    const inserted = build(body.slice(start, end));
    setBody(body.slice(0, start) + inserted + body.slice(end));
    const caret = start + inserted.length;
    // Le curseur se replace après le re-rendu, sinon React écrase la position.
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(caret, caret);
    });
  }

  const wrap = (marker: string) => replaceSelection((selected) => `${marker}${selected || "texte"}${marker}`);
  const prefixLines = (marker: string) =>
    replaceSelection((selected) =>
      (selected || "texte")
        .split("\n")
        .map((line) => `${marker}${line}`)
        .join("\n"),
    );

  async function sendFile(input: HTMLInputElement, kind: "inline" | "cover", onDone: (url: string) => void) {
    const file = input.files?.[0];
    if (!file) return;
    setBusy(kind);
    setUploadError(null);
    try {
      onDone(await upload(file));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(null);
      input.value = ""; // Permet de renvoyer deux fois le même fichier.
    }
  }

  const previewDate = article.publishedAt
    ? new Date(`${article.publishedAt}:00Z`).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

  return (
    <div className={styles.editor}>
      <form className={styles.pane} action={action}>
        <input type="hidden" name="previousSlug" value={isNew ? "" : article.slug} />
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        {state.savedAt && !state.error ? <p className={styles.notice}>Enregistré {state.savedAt}.</p> : null}
        {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

        <label className={styles.field}>
          <span>Titre</span>
          <input className={styles.input} name="title" value={title} onChange={(event) => onTitle(event.target.value)} required />
        </label>

        <div className={styles.toolbar}>
          <button className={styles.tool} type="button" onClick={() => wrap("**")}>Gras</button>
          <button className={styles.tool} type="button" onClick={() => wrap("*")}>Italique</button>
          <button className={styles.tool} type="button" onClick={() => prefixLines("## ")}>Titre</button>
          <button className={styles.tool} type="button" onClick={() => prefixLines("### ")}>Sous-titre</button>
          <button className={styles.tool} type="button" onClick={() => prefixLines("- ")}>Liste</button>
          <button className={styles.tool} type="button" onClick={() => prefixLines("> ")}>Citation</button>
          <button className={styles.tool} type="button" onClick={() => replaceSelection((selected) => `[${selected || "texte du lien"}](https://)`)}>Lien</button>
          <button className={styles.tool} type="button" onClick={() => replaceSelection(() => TABLE)}>Tableau</button>
          <button className={styles.tool} type="button" onClick={() => replaceSelection(() => "\n---\n")}>Séparateur</button>
          <button className={styles.tool} type="button" disabled={busy !== null} onClick={() => inlineInput.current?.click()}>
            {busy === "inline" ? "Envoi…" : "Image ou PDF"}
          </button>
          <input
            ref={inlineInput}
            type="file"
            hidden
            accept="image/*,application/pdf"
            onChange={(event) =>
              sendFile(event.currentTarget, "inline", (url) =>
                replaceSelection((selected) =>
                  url.endsWith(".pdf")
                    ? `[${selected || "Télécharger le document"}](${url})`
                    : `\n![${selected || "Légende de la photo"}](${url})\n`,
                ),
              )
            }
          />
        </div>
        <textarea
          ref={bodyRef}
          className={`${styles.textarea} ${styles.body}`}
          name="contentMarkdown"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Le corps de l’article, en Markdown. Les boutons ci-dessus insèrent la syntaxe pour vous."
          spellCheck
        />

        <hr className={styles.divider} />

        <fieldset className={styles.fieldset}>
          <legend>Image à la une</legend>
          <label className={styles.field}>
            <span>Chemin</span>
            <input
              className={styles.input}
              name="featuredImage"
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              placeholder="/media/actualites/photo.jpg"
            />
          </label>
          <div className={styles.toolbar}>
            <button className={styles.tool} type="button" disabled={busy !== null} onClick={() => coverInput.current?.click()}>
              {busy === "cover" ? "Envoi…" : "Choisir une photo"}
            </button>
            {cover ? <button className={styles.tool} type="button" onClick={() => setCover("")}>Retirer</button> : null}
            <input ref={coverInput} type="file" hidden accept="image/*" onChange={(event) => sendFile(event.currentTarget, "cover", setCover)} />
          </div>
          <label className={styles.check}>
            <input type="checkbox" name="featuredImageFit" checked={coverContain} onChange={(event) => setCoverContain(event.target.checked)} />
            <span>Montrer l’image entière dans les cartes, sans recadrage (affiches, QR codes).</span>
          </label>
        </fieldset>

        <hr className={styles.divider} />

        <fieldset className={styles.fieldset}>
          <legend>Publication</legend>
          <label className={styles.field}>
            <span>Résumé</span>
            <textarea
              className={styles.textarea}
              name="excerpt"
              defaultValue={article.excerpt}
              rows={3}
              placeholder="Deux ou trois phrases, reprises dans les listes et les partages."
            />
          </label>
          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Date de publication</span>
              <input className={styles.input} type="datetime-local" name="publishedAt" defaultValue={article.publishedAt} required />
            </label>
            <label className={styles.field}>
              <span>Auteur</span>
              <input className={styles.input} name="author" defaultValue={article.author} />
            </label>
          </div>
          <label className={styles.field}>
            <span>Catégories</span>
            <input
              className={styles.input}
              name="categories"
              defaultValue={article.categories}
              list="categories-connues"
              placeholder="Résultats sportifs, Vie du club"
            />
            <span className={styles.hint}>Séparées par des virgules. Elles alimentent les filtres de la page Actualités.</span>
          </label>
          <datalist id="categories-connues">
            {knownCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <label className={styles.field}>
            <span>Mots-clés</span>
            <input className={styles.input} name="tags" defaultValue={article.tags} placeholder="open, tournoi" />
          </label>
          <label className={styles.field}>
            <span>Adresse de l’article</span>
            <input
              className={styles.input}
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugPinned(true);
                setSlug(event.target.value);
              }}
              required
            />
            <span className={styles.hint}>
              /actualites/{slugify(slug) || "…"}
              {isNew ? null : " — changer cette adresse casse les liens déjà partagés vers l’article."}
            </span>
          </label>
        </fieldset>

        <div className={styles.actions}>
          <button className={styles.button} type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Enregistrement…" : article.status === "publish" && !isNew ? "Mettre à jour" : "Publier"}
          </button>
          <button className={styles.buttonGhost} type="submit" name="intent" value="draft" disabled={pending}>
            Garder en brouillon
          </button>
          <span className={styles.spacer} />
          {isNew ? null : (
            <button className={styles.buttonDanger} type="submit" form="supprimer-article" disabled={pending}>
              Supprimer
            </button>
          )}
        </div>
      </form>

      {/* Hors du formulaire principal : le HTML interdit d’imbriquer deux <form>. */}
      {isNew ? null : (
        <form
          id="supprimer-article"
          action={deleteArticleForm}
          hidden
          onSubmit={(event) => {
            if (!confirm(`Supprimer définitivement « ${article.title} » ?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="slug" value={article.slug} />
        </form>
      )}

      <div className={`${styles.pane} ${styles.previewPane}`}>
        <p className={styles.paneHead}>Aperçu</p>
        {cover ? (
          // Chemin arbitraire saisi à la main : next/image exigerait une config par domaine.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`${styles.previewCover} ${coverContain ? styles.previewCoverContain : ""}`} src={cover} alt="" />
        ) : null}
        <h2 className={styles.previewTitle}>{title || "Titre de l’article"}</h2>
        <p className={styles.previewMeta}>{[previewDate, article.author].filter(Boolean).join(" · ")}</p>
        {/* .prose porte la largeur et les marges d’une page d’article : neutralisées ici. */}
        <div className={articleStyles.prose} style={{ width: "100%", padding: "0 0 24px" }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{flowingText(body)}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
