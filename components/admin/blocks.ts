/**
 * L’éditeur simplifié présente l’article comme une suite de blocs — du texte,
 * des intertitres, des photos, des documents — pour que personne n’ait à voir
 * une ligne de Markdown. Ce module fait l’aller-retour entre ces blocs et le
 * Markdown enregistré sur le disque. Il ne dépend de rien, pour pouvoir être
 * éprouvé sur tous les articles du site en dehors de React.
 */

export type Block =
  | { id: string; kind: "text"; text: string }
  | { id: string; kind: "heading"; text: string; level: 2 | 3 }
  | { id: string; kind: "photo"; src: string; alt: string }
  | { id: string; kind: "file"; src: string; label: string };

/** Où insérer une photo : là où est le curseur, ou juste après le dernier ajout. */
export type InsertionPoint = { kind: "caret"; id: string; position: number } | { kind: "after"; id: string } | null;

let sequence = 0;
/** Identifiant d’un bloc créé dans le navigateur ; ceux lus sur le disque sont numérotés à part. */
export function blockId(): string {
  sequence += 1;
  return `bloc-${Date.now().toString(36)}-${sequence}`;
}

const PHOTO = /^!\[([^\]\n]*)\]\(([^()\s]+)\)$/;
const FILE = /^\[([^\]\n]+)\]\(([^()\s]+\.pdf)\)$/i;
const HEADING = /^(#{2,3})[ \t]+(\S.*?)[ \t]*$/;
const TRAILING_BREAK = /(?:\\| {2,})$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;
/** Seuls ces débuts de liste interrompent un paragraphe en Markdown. */
const LIST_START = /^\s*(?:[-*+]|1[.)])\s/;
/** Syntaxe qui resterait affichée telle quelle, brute, dans une zone de texte. */
const RAW_SYNTAX = /!\[|\]\(|<\/?[a-z][^>]*>|^\s*\|.*\|\s*$|^\s*(?:```|~~~)|^\s{0,3}#{1,6}\s|^\s{0,3}>/im;

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

/**
 * Forme canonique d’un Markdown, pour comparer deux textes au rendu près : fins
 * de ligne, espaces de fin, style des retours forcés (`\` ou deux espaces) et
 * lignes vides en surnombre n’y comptent plus.
 */
export function normalizeMarkdown(markdown: string): string {
  return (
    markdown
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => {
        if (line.trim() === "") return "";
        return TRAILING_BREAK.test(line) ? `${line.replace(TRAILING_BREAK, "").trimEnd()}  ` : line.trimEnd();
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      // Un retour forcé en fin de paragraphe ne produit rien : on l’efface.
      .replace(/ {2}(?=\n\n|$)/g, "")
      .trim()
  );
}

export function markdownToBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const chunks = normalizeMarkdown(markdown)
    .split(/\n{2,}/)
    .filter((chunk) => chunk.trim() !== "");

  for (const [index, chunk] of chunks.entries()) {
    const id = `lu-${index}`;
    const photo = PHOTO.exec(chunk);
    const file = FILE.exec(chunk);
    const heading = HEADING.exec(chunk);
    if (photo) blocks.push({ id, kind: "photo", alt: photo[1], src: photo[2] });
    else if (file) blocks.push({ id, kind: "file", label: file[1], src: file[2] });
    else if (heading) blocks.push({ id, kind: "heading", level: heading[1].length === 3 ? 3 : 2, text: heading[2] });
    else {
      // Les retours forcés redeviennent de simples retours à la ligne, comme tapés.
      const text = chunk
        .split("\n")
        .map((line) => line.replace(/ {2}$/, ""))
        .join("\n");
      const previous = blocks.at(-1);
      if (previous?.kind === "text") previous.text = `${previous.text}\n\n${text}`;
      else blocks.push({ id, kind: "text", text });
    }
  }
  return blocks.length > 0 ? blocks : [{ id: "lu-0", kind: "text", text: "" }];
}

/**
 * Le texte tapé doit s’afficher tel qu’il a été tapé. Or en Markdown un simple
 * retour à la ligne ne fait qu’une espace : il faut deux espaces en fin de
 * ligne pour le conserver. Exception : avant un élément de liste, qui commence
 * de lui-même sur sa propre ligne. Les retraits en début de ligne — vieux réflexe
 * de machine à écrire — sont retirés : quatre espaces feraient un bloc de code.
 */
function textToMarkdown(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.trim() !== "")
        .map((line) => (LIST_ITEM.test(line) ? line.replace(/^\t+/, (tabs) => "  ".repeat(tabs.length)) : line.trimStart()));
      let markdown = "";
      lines.forEach((line, index) => {
        if (index === 0) {
          markdown = line;
          return;
        }
        const newline = LIST_ITEM.test(lines[index - 1]) ? LIST_ITEM.test(line) : LIST_START.test(line);
        markdown += `${newline ? "\n" : "  \n"}${line}`;
      });
      return markdown;
    })
    .filter((paragraph) => paragraph !== "")
    .join("\n\n");
}

export function blocksToMarkdown(blocks: readonly Block[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case "photo":
          return block.src ? `![${oneLine(block.alt).replace(/[[\]]/g, "")}](${block.src})` : "";
        case "file":
          return block.src ? `[${oneLine(block.label).replace(/[[\]]/g, "") || "Télécharger le document"}](${block.src})` : "";
        case "heading":
          return oneLine(block.text) ? `${"#".repeat(block.level)} ${oneLine(block.text)}` : "";
        default:
          return textToMarkdown(block.text);
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Un article ne s’ouvre dans l’éditeur simplifié que si l’aller-retour par les
 * blocs le laisse intact et qu’aucun bloc de texte n’afficherait de syntaxe
 * brute (lien, image, tableau…). Sinon l’éditeur Markdown prend le relais :
 * mieux vaut un éditeur moins accueillant qu’un article abîmé.
 */
export function fitsSimpleEditor(markdown: string): boolean {
  const blocks = markdownToBlocks(markdown);
  if (blocks.some((block) => block.kind === "text" && RAW_SYNTAX.test(block.text))) return false;
  return normalizeMarkdown(blocksToMarkdown(blocks)) === normalizeMarkdown(markdown);
}

/**
 * Place de nouveaux blocs à l’endroit du curseur, comme on insère une photo
 * dans un traitement de texte. Le texte est coupé en fin de ligne — jamais au
 * milieu d’un mot — et un bloc de texte vide suit toujours le dernier ajout,
 * pour pouvoir continuer à écrire.
 */
export function insertBlocks(blocks: readonly Block[], fresh: readonly Block[], at: InsertionPoint): Block[] {
  const index = at ? blocks.findIndex((block) => block.id === at.id) : -1;
  const target = blocks[index];
  let next: Block[];

  if (index === -1) {
    const last = blocks[blocks.length - 1];
    // Un bloc de texte vide en fin d’article reste en dernier : il attend la suite.
    if (last && last.kind === "text" && last.text.trim() === "") next = [...blocks.slice(0, -1), ...fresh, last];
    else next = [...blocks, ...fresh];
  } else if (at?.kind === "caret" && target.kind === "text") {
    const lineEnd = target.text.indexOf("\n", at.position);
    const cut = lineEnd === -1 ? target.text.length : lineEnd;
    const before = target.text.slice(0, cut).trimEnd();
    const after = target.text.slice(cut).trim();
    next = [
      ...blocks.slice(0, index),
      ...(before ? [{ ...target, text: before }] : []),
      ...fresh,
      ...(after ? [{ id: blockId(), kind: "text" as const, text: after }] : []),
      ...blocks.slice(index + 1),
    ];
  } else {
    next = [...blocks.slice(0, index + 1), ...fresh, ...blocks.slice(index + 1)];
  }

  if (next[next.length - 1]?.kind !== "text") next.push({ id: blockId(), kind: "text", text: "" });
  return next;
}

/** Deux blocs de texte devenus voisins — une photo retirée entre eux — n’en font plus qu’un. */
export function tidyBlocks(blocks: readonly Block[]): Block[] {
  const tidy: Block[] = [];
  for (const block of blocks) {
    const previous = tidy[tidy.length - 1];
    if (block.kind === "text" && previous?.kind === "text") {
      const text = [previous.text.trimEnd(), block.text.trim()].filter(Boolean).join("\n\n");
      tidy[tidy.length - 1] = { ...previous, text };
    } else {
      tidy.push(block);
    }
  }
  return tidy.length > 0 ? tidy : [{ id: blockId(), kind: "text", text: "" }];
}
