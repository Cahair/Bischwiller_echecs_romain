"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { deleteArticleForm, saveArticleForm, type FormState } from "@/app/admin/actions";
import { flowingText, slugify } from "@/lib/markdown";
import articleStyles from "@/components/articles/articles.module.css";
import {
  blockId,
  blocksToMarkdown,
  fitsSimpleEditor,
  insertBlocks,
  markdownToBlocks,
  normalizeMarkdown,
  tidyBlocks,
  type Block,
  type InsertionPoint,
} from "./blocks";
import { Icon } from "./icons";
import { uploadFile } from "./upload";
import styles from "./admin.module.css";

/** Ce que l’éditeur reçoit : des valeurs prêtes pour les champs du formulaire. */
export type EditorArticle = {
  slug: string;
  title: string;
  publishedAt: string;
  author: string;
  excerpt: string;
  categories: string[];
  tags: string;
  featuredImage: string;
  featuredImageFit: boolean;
  status: "draft" | "publish";
  contentMarkdown: string;
};

type Saved = "draft" | "publish";

/** Au-delà, les rubriques se déplient sur demande : 13 boutons d’un coup, c’est trop. */
const TOP_CATEGORIES = 6;
const TABLE = "\n| Colonne | Colonne |\n| --- | --- |\n|  |  |\n";
const UNSAVED = "Vous n’avez pas enregistré vos modifications. Quitter cette page quand même ?";
/** `.prose` porte la largeur et les marges d’une page d’article : neutralisées ici. */
const PROSE_IN_EDITOR = { width: "100%", padding: "4px 0 32px" };

function formatDate(value: string): string {
  const date = new Date(`${value.slice(0, 16)}:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function Step({
  number,
  title,
  hint,
  optional = false,
  done = false,
  children,
}: {
  number: number;
  title: string;
  hint?: ReactNode;
  optional?: boolean;
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={styles.step} aria-labelledby={`etape-${number}`}>
      <div className={styles.stepHead}>
        {/* Le numéro devient une coche une fois l’étape remplie : on voit où l’on en est. */}
        <span className={`${styles.stepNum} ${done ? styles.stepNumDone : ""}`} aria-hidden="true">
          {done ? <Icon name="check" /> : number}
        </span>
        <div>
          <h2 className={styles.stepTitle} id={`etape-${number}`}>
            {title}
            {optional ? <span className={styles.optional}>facultatif</span> : null}
          </h2>
          {hint ? <p className={styles.stepHint}>{hint}</p> : null}
        </div>
      </div>
      <div className={styles.stepBody}>{children}</div>
    </section>
  );
}

/** Zone de texte qui grandit avec son contenu : pas de barre de défilement dans la page. */
function GrowingTextarea({
  value,
  rows,
  placeholder,
  onChange,
  onCaret,
}: {
  value: string;
  rows: number;
  placeholder: string;
  onChange: (value: string) => void;
  onCaret: (position: number) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight + 4}px`;
  }, [value]);
  const report = () => {
    if (ref.current) onCaret(ref.current.selectionStart);
  };
  return (
    <textarea
      ref={ref}
      className={`${styles.textarea} ${styles.blockText}`}
      value={value}
      rows={rows}
      placeholder={placeholder}
      aria-label="Texte de l’article"
      spellCheck
      onChange={(event) => onChange(event.target.value)}
      onSelect={report}
      onKeyUp={report}
      onClick={report}
      onFocus={report}
    />
  );
}

export function ArticleEditor({
  article,
  mode,
  restoresOriginal,
  categories: categoryOptions,
  savedOnLoad,
}: {
  article: EditorArticle;
  /** `imported` : article de l’ancien site, que l’enregistrement copiera avant de le corriger. */
  mode: "new" | "local" | "imported";
  /** Ce fichier maison masque un article de l’ancien site : le supprimer rend l’original. */
  restoresOriginal: boolean;
  categories: { name: string; count: number }[];
  savedOnLoad: Saved | null;
}) {
  const isNew = mode === "new";
  const [state, action, pending] = useActionState<FormState, FormData>(saveArticleForm, {});

  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [slugPinned, setSlugPinned] = useState(!isNew);
  const [cover, setCover] = useState(article.featuredImage);
  const [coverContain, setCoverContain] = useState(article.featuredImageFit);
  const [chosen, setChosen] = useState(article.categories);
  const [publishedAt, setPublishedAt] = useState(article.publishedAt);
  const [author, setAuthor] = useState(article.author);
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [tags, setTags] = useState(article.tags);
  const [status, setStatus] = useState(article.status);

  // L’éditeur simple d’office, sauf si l’article contient ce qu’il ne sait pas
  // restituer sans perte : liens, images, tableaux… (voir blocks.ts). Les
  // articles collés depuis un traitement de texte, coupés tous les cent
  // caractères, y sont montrés recollés — tels que le site les affiche.
  const [editorMode, setEditorMode] = useState<"simple" | "markdown">(() =>
    fitsSimpleEditor(flowingText(article.contentMarkdown)) ? "simple" : "markdown",
  );
  const [blocks, setBlocks] = useState<Block[]>(() => markdownToBlocks(flowingText(article.contentMarkdown)));
  const [markdown, setMarkdown] = useState(article.contentMarkdown);

  const [uploads, setUploads] = useState<Record<string, number>>({});
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [markdownProgress, setMarkdownProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<FormState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [dragging, setDragging] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const insertion = useRef<InsertionPoint>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const markdownFileInput = useRef<HTMLInputElement>(null);

  const content = editorMode === "simple" ? blocksToMarkdown(blocks) : markdown;
  const snapshot = JSON.stringify([title, slug, cover, coverContain, chosen, publishedAt, author, excerpt, tags, normalizeMarkdown(content)]);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const [submittedSnapshot, setSubmittedSnapshot] = useState(snapshot);
  const [confirmation, setConfirmation] = useState<Saved | null>(savedOnLoad);
  const dirty = snapshot !== savedSnapshot;
  const busy = Object.keys(uploads).length > 0 || coverProgress !== null || markdownProgress !== null;

  // Réponse de l’action serveur, intégrée pendant le rendu plutôt que dans un
  // effet : la confirmation s’affiche sans rendu intermédiaire.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    setPreviewOpen(false);
    if (state.savedStatus) {
      setSavedSnapshot(submittedSnapshot);
      setStatus(state.savedStatus);
      setConfirmation(state.savedStatus);
    }
  }

  useEffect(() => {
    if (state.savedStatus) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  useEffect(() => {
    if (!previewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen]);

  function onTitle(value: string) {
    setTitle(value);
    if (!slugPinned) setSlug(slugify(value));
  }

  function toggleCategory(name: string) {
    setChosen((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  function addCategory() {
    // Les rubriques voyagent séparées par des virgules : une virgule dans un nom le couperait en deux.
    const name = newCategory.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!name) return;
    setChosen((current) => (current.includes(name) ? current : [...current, name]));
    setNewCategory("");
  }

  async function pickCover(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("La photo principale doit être une image (JPEG, PNG…).");
      return;
    }
    setMessage(null);
    setCoverProgress(0);
    try {
      setCover(await uploadFile(file, setCoverProgress));
    } catch (error) {
      setMessage(`La photo n’a pas pu être envoyée. ${error instanceof Error ? error.message : ""}`);
    } finally {
      setCoverProgress(null);
    }
  }

  const patchBlock = (id: string, patch: (block: Block) => Block) =>
    setBlocks((current) => current.map((block) => (block.id === id ? patch(block) : block)));

  function place(fresh: Block[]) {
    // Lu avant la mise à jour : React peut rejouer la fonction de mise à jour.
    const at = insertion.current;
    setBlocks((current) => insertBlocks(current, fresh, at));
    insertion.current = { kind: "after", id: fresh[fresh.length - 1].id };
  }

  async function addFiles(files: File[]) {
    const accepted = files.filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
    setMessage(accepted.length < files.length ? "Seules les photos et les documents PDF peuvent être ajoutés." : null);
    if (accepted.length === 0) return;
    const fresh = accepted.map(
      (file): Block =>
        file.type === "application/pdf"
          ? { id: blockId(), kind: "file", src: "", label: file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ") }
          : { id: blockId(), kind: "photo", src: "", alt: "" },
    );
    place(fresh);
    // Une à une : sur une connexion lente, dix envois simultanés échoueraient tous.
    for (const [index, file] of accepted.entries()) {
      const id = fresh[index].id;
      setUploads((current) => ({ ...current, [id]: 0 }));
      try {
        const url = await uploadFile(file, (percent) => setUploads((current) => ({ ...current, [id]: percent })));
        patchBlock(id, (block) => (block.kind === "photo" || block.kind === "file" ? { ...block, src: url } : block));
      } catch (error) {
        setBlocks((current) => tidyBlocks(current.filter((block) => block.id !== id)));
        setMessage(`« ${file.name} » n’a pas pu être envoyé. ${error instanceof Error ? error.message : ""}`);
      } finally {
        setUploads((current) => {
          const rest = { ...current };
          delete rest[id];
          return rest;
        });
      }
    }
  }

  function addHeading() {
    const heading: Block = { id: blockId(), kind: "heading", level: 2, text: "" };
    place([heading]);
    setFocusId(heading.id);
  }

  function moveBlock(index: number, step: -1 | 1) {
    setBlocks((current) => {
      const target = index + step;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeBlock(block: Block) {
    const filled = block.kind === "photo" || block.kind === "file" ? block.src !== "" : block.text.trim() !== "";
    const what = { text: "ce texte", heading: "cet intertitre", photo: "cette photo", file: "ce document" }[block.kind];
    if (filled && !window.confirm(`Retirer ${what} de l’article ?`)) return;
    setBlocks((current) => tidyBlocks(current.filter((item) => item.id !== block.id)));
    insertion.current = null;
  }

  /** Remplace la sélection du texte Markdown, puis y replace le curseur. */
  function replaceSelection(build: (selected: string) => string) {
    const field = markdownRef.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end } = field;
    const inserted = build(field.value.slice(start, end));
    setMarkdown((current) => current.slice(0, start) + inserted + current.slice(end));
    const caret = start + inserted.length;
    // Le curseur se replace après le rendu, sinon React écrase sa position.
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

  async function addMarkdownFiles(files: File[]) {
    for (const file of files) {
      setMarkdownProgress(0);
      try {
        const url = await uploadFile(file, setMarkdownProgress);
        replaceSelection((selected) =>
          file.type === "application/pdf"
            ? `[${selected || "Télécharger le document"}](${url})`
            : `\n![${selected || "Description de la photo"}](${url})\n`,
        );
      } catch (error) {
        setMessage(`« ${file.name} » n’a pas pu être envoyé. ${error instanceof Error ? error.message : ""}`);
      } finally {
        setMarkdownProgress(null);
      }
    }
  }

  const simpleFits = editorMode === "markdown" && fitsSimpleEditor(flowingText(markdown));

  function switchToMarkdown() {
    setMarkdown(blocksToMarkdown(blocks));
    setEditorMode("markdown");
  }

  function switchToSimple() {
    const source = flowingText(markdown);
    if (!fitsSimpleEditor(source)) return;
    setBlocks(markdownToBlocks(source));
    insertion.current = null;
    setEditorMode("simple");
  }

  const optionNames = categoryOptions.map((option) => option.name);
  const allNames = [...optionNames, ...chosen.filter((name) => !optionNames.includes(name))];
  const shownNames = showAllCategories
    ? allNames
    : allNames.filter((name, index) => index < TOP_CATEGORIES || chosen.includes(name));
  const hiddenCount = allNames.length - shownNames.length;

  const published = status === "publish";
  const primaryLabel =
    mode === "imported" ? "Enregistrer la correction" : published && !isNew ? "Enregistrer les modifications" : "Publier l’article";
  const offerDraft = mode !== "imported" && !published;
  const serverError = state.error && dismissed !== state ? state.error : null;
  const alert = message ?? serverError;
  const statusLine = busy
    ? "Envoi des fichiers en cours…"
    : dirty
      ? "Modifications non enregistrées"
      : state.savedAt
        ? `Enregistré à ${state.savedAt}`
        : "";

  return (
    <>
      <div ref={topRef} className={styles.anchor} />
      {confirmation && !dirty ? (
        <div className={styles.success} role="status">
          <span className={styles.successIcon}>
            <Icon name="check" size="1.6em" />
          </span>
          <div className={styles.successBody}>
            <strong>
              {confirmation === "publish" ? "C’est en ligne ! Votre article est visible sur le site." : "Brouillon enregistré."}
            </strong>
            <p>
              {confirmation === "publish"
                ? "Vous pouvez encore le modifier ici à tout moment."
                : "Il n’est pas visible sur le site. Vous le retrouverez dans la liste des articles pour le terminer plus tard."}
            </p>
            <div className={styles.successActions}>
              {confirmation === "publish" ? (
                <a className={styles.button} href={`/actualites/${article.slug}`} target="_blank" rel="noreferrer">
                  Voir l’article sur le site <Icon name="external" />
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
        id="editeur"
        className={`${styles.form} ${editorMode === "markdown" ? styles.formWide : ""}`}
        action={action}
        onSubmit={() => setSubmittedSnapshot(snapshot)}
        onKeyDown={(event) => {
          // Entrée dans un champ d’une ligne enverrait tout le formulaire : surprise garantie.
          if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type !== "checkbox") {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="previousSlug" value={isNew ? "" : article.slug} />
        {mode === "imported" ? <input type="hidden" name="wasImported" value="1" /> : null}
        <input type="hidden" name="contentMarkdown" value={content} />
        <input type="hidden" name="categories" value={chosen.join(", ")} />
        <input type="hidden" name="featuredImage" value={cover} />

        <Step number={1} title="Le titre" done={title.trim() !== ""} hint="Court et parlant, comme un titre de journal.">
          <input
            className={`${styles.input} ${styles.titleInput}`}
            name="title"
            value={title}
            onChange={(event) => onTitle(event.target.value)}
            placeholder="Par exemple : Victoire de l’équipe 1 contre Metz"
            aria-labelledby="etape-1"
            maxLength={200}
            required
          />
        </Step>

        <Step
          number={2}
          title="La photo principale"
          optional
          done={cover !== ""}
          hint="Elle s’affiche en grand en haut de l’article et dans la liste des actualités."
        >
          {coverProgress !== null ? (
            <div className={styles.uploading} role="status">
              <span className={styles.spinner} /> Envoi de la photo… {coverProgress} %
            </div>
          ) : cover ? (
            <>
              {/* Adresse parfois tapée à la main : next/image exigerait des dimensions connues. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={`${styles.coverImg} ${coverContain ? styles.coverContain : ""}`} src={cover} alt="Photo principale choisie" />
              <div className={styles.coverActions}>
                <button type="button" className={styles.buttonGhost} onClick={() => coverInput.current?.click()}>
                  <Icon name="camera" /> Changer de photo
                </button>
                <button type="button" className={styles.buttonGhost} onClick={() => setCover("")}>
                  <Icon name="trash" /> Retirer la photo
                </button>
              </div>
              <label className={styles.check}>
                <input type="checkbox" name="featuredImageFit" checked={coverContain} onChange={(event) => setCoverContain(event.target.checked)} />
                <span>
                  Montrer la photo en entier, sans la rogner <small>(pour une affiche ou un QR code)</small>
                </span>
              </label>
            </>
          ) : (
            <button
              type="button"
              className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
              onClick={() => coverInput.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void pickCover(event.dataTransfer.files[0]);
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
            ref={coverInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = ""; // Permet de choisir deux fois la même photo.
              void pickCover(file);
            }}
          />
        </Step>

        <Step
          number={3}
          title="Le texte"
          done={content.trim() !== ""}
          hint={
            editorMode === "simple"
              ? "Écrivez comme dans un e-mail. Pour commencer un nouveau paragraphe, laissez une ligne vide."
              : "Éditeur avancé : le texte s’écrit en Markdown, et l’aperçu montre le résultat au fur et à mesure."
          }
        >
          {editorMode === "simple" ? (
            <>
              <div className={styles.blocks}>
                {blocks.map((block, index) => (
                  <div className={styles.block} key={block.id}>
                    {block.kind === "text" ? (
                      <GrowingTextarea
                        value={block.text}
                        rows={blocks.length === 1 ? 9 : 3}
                        placeholder={index === 0 ? "Écrivez votre texte ici…" : "Suite du texte (facultatif)…"}
                        onChange={(text) => patchBlock(block.id, (current) => (current.kind === "text" ? { ...current, text } : current))}
                        onCaret={(position) => {
                          insertion.current = { kind: "caret", id: block.id, position };
                        }}
                      />
                    ) : block.kind === "heading" ? (
                      <input
                        className={`${styles.input} ${styles.blockHeading}`}
                        value={block.text}
                        autoFocus={block.id === focusId}
                        placeholder="Intertitre, par exemple « Les résultats »"
                        aria-label="Intertitre"
                        onChange={(event) => {
                          const text = event.target.value;
                          patchBlock(block.id, (current) => (current.kind === "heading" ? { ...current, text } : current));
                        }}
                        onFocus={() => {
                          insertion.current = { kind: "after", id: block.id };
                        }}
                      />
                    ) : block.kind === "photo" ? (
                      <figure className={styles.blockPhoto}>
                        {block.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className={styles.blockPhotoImg} src={block.src} alt="" />
                        ) : (
                          <div className={styles.uploading} role="status">
                            <span className={styles.spinner} /> Envoi de la photo… {uploads[block.id] ?? 0} %
                          </div>
                        )}
                        <input
                          className={styles.input}
                          value={block.alt}
                          placeholder="Décrivez la photo en quelques mots (facultatif)"
                          aria-label="Description de la photo"
                          onChange={(event) => {
                            const alt = event.target.value;
                            patchBlock(block.id, (current) => (current.kind === "photo" ? { ...current, alt } : current));
                          }}
                          onFocus={() => {
                            insertion.current = { kind: "after", id: block.id };
                          }}
                        />
                      </figure>
                    ) : (
                      <div className={styles.blockFile}>
                        <span className={styles.fileBadge}>
                          <Icon name="file" size="1.5em" /> PDF
                        </span>
                        {block.src ? (
                          <label className={`${styles.field} ${styles.blockFileField}`}>
                            <span>Texte du lien vers le document</span>
                            <input
                              className={styles.input}
                              value={block.label}
                              onChange={(event) => {
                                const label = event.target.value;
                                patchBlock(block.id, (current) => (current.kind === "file" ? { ...current, label } : current));
                              }}
                              onFocus={() => {
                                insertion.current = { kind: "after", id: block.id };
                              }}
                            />
                          </label>
                        ) : (
                          <div className={`${styles.uploading} ${styles.blockFileField}`} role="status">
                            <span className={styles.spinner} /> Envoi du document… {uploads[block.id] ?? 0} %
                          </div>
                        )}
                      </div>
                    )}
                    {block.kind !== "text" || blocks.length > 1 ? (
                      <div className={styles.blockTools}>
                        <button type="button" className={styles.tool} onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                          <Icon name="up" /> Monter
                        </button>
                        <button type="button" className={styles.tool} onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>
                          <Icon name="down" /> Descendre
                        </button>
                        <button type="button" className={styles.tool} onClick={() => removeBlock(block)}>
                          <Icon name="trash" /> Retirer
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className={styles.addRow}>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => photosInput.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void addFiles(Array.from(event.dataTransfer.files));
                  }}
                >
                  <Icon name="camera" /> Ajouter des photos
                </button>
                <button type="button" className={styles.addButton} onClick={addHeading}>
                  <Icon name="heading" /> Ajouter un intertitre
                </button>
                <button type="button" className={styles.addButton} onClick={() => documentInput.current?.click()}>
                  <Icon name="file" /> Joindre un PDF
                </button>
              </div>
              <p className={styles.hint}>
                Photos, intertitres et documents se placent à l’endroit où se trouve votre curseur dans le texte. Vous pouvez choisir
                plusieurs photos d’un coup.
              </p>
              <input
                ref={photosInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  void addFiles(files);
                }}
              />
              <input
                ref={documentInput}
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  void addFiles(files);
                }}
              />
              <button type="button" className={styles.modeSwitch} onClick={switchToMarkdown}>
                <Icon name="code" /> Passer à l’éditeur avancé (Markdown)
              </button>
            </>
          ) : (
            <>
              {!simpleFits ? (
                <p className={styles.modeNote}>
                  Ce texte contient une mise en forme — liens, images, tableaux… — que l’éditeur simple ne sait pas afficher : il reste
                  dans l’éditeur avancé pour ne rien abîmer.
                </p>
              ) : null}
              <div className={styles.mdSplit}>
                <div>
                  <div className={styles.toolbar}>
                    <button type="button" className={styles.tool} onClick={() => wrap("**")}>Gras</button>
                    <button type="button" className={styles.tool} onClick={() => wrap("*")}>Italique</button>
                    <button type="button" className={styles.tool} onClick={() => prefixLines("## ")}>Intertitre</button>
                    <button type="button" className={styles.tool} onClick={() => prefixLines("- ")}>Liste</button>
                    <button type="button" className={styles.tool} onClick={() => prefixLines("> ")}>Citation</button>
                    <button type="button" className={styles.tool} onClick={() => replaceSelection((selected) => `[${selected || "texte du lien"}](https://)`)}>
                      Lien
                    </button>
                    <button type="button" className={styles.tool} onClick={() => replaceSelection(() => TABLE)}>Tableau</button>
                    <button
                      type="button"
                      className={styles.tool}
                      disabled={markdownProgress !== null}
                      onClick={() => markdownFileInput.current?.click()}
                    >
                      <Icon name="camera" /> {markdownProgress !== null ? `Envoi… ${markdownProgress} %` : "Photo ou PDF"}
                    </button>
                  </div>
                  <textarea
                    ref={markdownRef}
                    className={`${styles.textarea} ${styles.mdArea}`}
                    value={markdown}
                    onChange={(event) => setMarkdown(event.target.value)}
                    aria-labelledby="etape-3"
                    spellCheck
                  />
                </div>
                <div className={styles.mdPreview}>
                  <p className={styles.mdPreviewLabel}>Aperçu en direct</p>
                  <div className={articleStyles.prose} style={PROSE_IN_EDITOR}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{flowingText(markdown)}</ReactMarkdown>
                  </div>
                </div>
              </div>
              <input
                ref={markdownFileInput}
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  void addMarkdownFiles(files);
                }}
              />
              <button type="button" className={styles.modeSwitch} onClick={switchToSimple} disabled={!simpleFits}>
                <Icon name="pen" /> Revenir à l’éditeur simple
              </button>
            </>
          )}
        </Step>

        <Step
          number={4}
          title="La rubrique"
          done={chosen.length > 0}
          hint="Choisissez-en une ou plusieurs : elles servent à trier les actualités sur le site."
        >
          <div className={styles.chips}>
            {shownNames.map((name) => {
              const on = chosen.includes(name);
              return (
                <button
                  type="button"
                  key={name}
                  className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                  aria-pressed={on}
                  onClick={() => toggleCategory(name)}
                >
                  {on ? <Icon name="check" /> : null}
                  {name}
                </button>
              );
            })}
            {hiddenCount > 0 || showAllCategories ? (
              <button type="button" className={styles.chipMore} onClick={() => setShowAllCategories((open) => !open)}>
                {showAllCategories ? "Moins de rubriques" : `Voir les autres rubriques (${hiddenCount})`}
              </button>
            ) : null}
          </div>
          {showAllCategories ? (
            <div className={styles.newCategory}>
              <input
                className={styles.input}
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addCategory();
                }}
                placeholder="Nom d’une nouvelle rubrique"
                aria-label="Nom d’une nouvelle rubrique"
              />
              <button type="button" className={styles.buttonGhost} onClick={addCategory}>
                <Icon name="plus" /> Créer la rubrique
              </button>
            </div>
          ) : null}
        </Step>

        <details className={styles.more}>
          <summary>
            Plus d’options
            <span className={styles.moreHint}>date, auteur, résumé, adresse de la page — facultatif</span>
          </summary>
          <div className={styles.moreBody}>
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>Date de publication</span>
                <input
                  className={styles.input}
                  type="datetime-local"
                  name="publishedAt"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                />
                <small className={styles.hint}>{isNew ? "Par défaut, maintenant." : "Elle fixe la place de l’article dans les actualités."}</small>
              </label>
              <label className={styles.field}>
                <span>Auteur</span>
                <input className={styles.input} name="author" value={author} onChange={(event) => setAuthor(event.target.value)} />
              </label>
            </div>
            <label className={styles.field}>
              <span>Résumé</span>
              <textarea className={styles.textarea} name="excerpt" rows={3} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
              <small className={styles.hint}>
                Deux ou trois phrases, reprises par Google et lors des partages. Laissé vide, ce sont les premières lignes du texte qui
                servent.
              </small>
            </label>
            <label className={styles.field}>
              <span>Adresse de la page</span>
              <input
                className={styles.input}
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugPinned(true);
                  setSlug(event.target.value);
                }}
              />
              <small className={styles.hint}>
                bischwiller-echecs.com/actualites/{slugify(slug) || "…"}
                {isNew ? null : " — la changer casse les liens déjà partagés vers l’article."}
              </small>
            </label>
            <label className={styles.field}>
              <span>Mots-clés</span>
              <input
                className={styles.input}
                name="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="open, tournoi, jeunes"
              />
              <small className={styles.hint}>Séparés par des virgules.</small>
            </label>
          </div>
        </details>

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
          <button type="button" className={styles.buttonGhost} onClick={() => setPreviewOpen(true)}>
            <Icon name="eye" /> Aperçu
          </button>
          <span className={styles.actionStatus} aria-live="polite">
            {statusLine}
          </span>
          {offerDraft ? (
            <button type="submit" name="intent" value="draft" className={styles.buttonGhost} disabled={pending || busy}>
              Enregistrer sans publier
            </button>
          ) : null}
          <button type="submit" name="intent" value="publish" className={styles.button} disabled={pending || busy}>
            <Icon name="check" /> {pending ? "Enregistrement…" : primaryLabel}
          </button>
        </div>
      </form>

      {mode === "local" ? (
        <section className={styles.danger} aria-labelledby="autres-actions">
          <h2 id="autres-actions">Autres actions</h2>
          <p>
            {restoresOriginal
              ? "Rétablir la version d’origine efface vos corrections : l’article de l’ancien site reprend sa place."
              : "La suppression retire définitivement l’article du site et de l’espace admin."}
          </p>
          <div className={styles.dangerActions}>
            {published ? (
              <button
                type="submit"
                form="editeur"
                name="intent"
                value="draft"
                className={styles.buttonGhost}
                disabled={pending || busy}
                onClick={(event) => {
                  if (!window.confirm("Retirer cet article du site ? Il restera enregistré comme brouillon, et vous pourrez le republier.")) {
                    event.preventDefault();
                  }
                }}
              >
                Retirer du site (garder en brouillon)
              </button>
            ) : null}
            <button type="submit" form="supprimer-article" className={styles.buttonDanger} disabled={pending}>
              <Icon name="trash" /> {restoresOriginal ? "Rétablir la version d’origine" : "Supprimer l’article"}
            </button>
          </div>
        </section>
      ) : null}

      {/* Hors du formulaire principal : le HTML interdit d’imbriquer deux <form>. */}
      {mode === "local" ? (
        <form
          id="supprimer-article"
          action={deleteArticleForm}
          hidden
          onSubmit={(event) => {
            const question = restoresOriginal
              ? `Abandonner vos corrections et rétablir la version d’origine de « ${article.title} » ?`
              : `Supprimer définitivement « ${article.title} » ?`;
            if (!window.confirm(question)) event.preventDefault();
          }}
        >
          <input type="hidden" name="slug" value={article.slug} />
        </form>
      ) : null}

      {previewOpen ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Aperçu de l’article">
          <div className={styles.overlayBar}>
            <button type="button" className={styles.buttonGhost} onClick={() => setPreviewOpen(false)} autoFocus>
              <Icon name="back" /> Continuer à modifier
            </button>
            <p className={styles.overlayNote}>Aperçu : voici l’article tel que le verront les visiteurs.</p>
            <button type="submit" form="editeur" name="intent" value="publish" className={styles.button} disabled={pending || busy}>
              <Icon name="check" /> {pending ? "Enregistrement…" : primaryLabel}
            </button>
          </div>
          <article className={styles.overlayBody}>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={`${styles.previewCover} ${coverContain ? styles.previewCoverContain : ""}`} src={cover} alt="" />
            ) : null}
            <p className={styles.previewEyebrow}>{chosen.join(" · ") || "Actualités"}</p>
            <h1 className={styles.previewTitle}>{title || "Titre de l’article"}</h1>
            <p className={styles.previewMeta}>{[formatDate(publishedAt), author].filter(Boolean).join(" · ")}</p>
            <div className={articleStyles.prose} style={PROSE_IN_EDITOR}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{flowingText(content)}</ReactMarkdown>
            </div>
          </article>
        </div>
      ) : null}
    </>
  );
}
