/**
 * Traitements Markdown sans accès disque : partagés par le rendu serveur des
 * articles et par l’aperçu en direct de l’espace admin, qui tourne côté
 * navigateur et ne peut donc rien importer de `node:fs`.
 */

/** Titre → slug d’URL, sans accent ni ponctuation. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/, "");
}

const HARD_BREAK = /(?: {2,}|\\)$/;
const ENDS_SENTENCE = /[.!?:;»)\]]$/;
const BLOCK_LINE = /^\s*(?:[-*+>#|]|\d+[.)])/;

/**
 * Beaucoup d’articles ont été collés dans WordPress depuis un traitement de
 * texte : ils arrivent coupés tous les cent caractères, en plein milieu des
 * phrases. Ces retours forcés empêchent toute justification — une ligne suivie
 * d’un `<br>` est une fin de paragraphe, que le navigateur laisse au fer à
 * gauche — et hachent la lecture sur mobile. On ne recolle que les lignes
 * manifestement tronquées (longues et sans ponctuation finale) : listes de
 * résultats, notations de parties et tableaux gardent leurs retours.
 */
export function flowingText(markdown: string): string {
  const flowed: string[] = [];
  let inCodeFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(?:```|~~~)/.test(line)) inCodeFence = !inCodeFence;
    const previous = flowed.at(-1);
    const text = previous === undefined ? "" : previous.replace(/\s+$/, "");
    const joinable =
      !inCodeFence &&
      previous !== undefined &&
      HARD_BREAK.test(previous) &&
      text.length >= 60 &&
      !ENDS_SENTENCE.test(text) &&
      !BLOCK_LINE.test(text) &&
      line.trim() !== "" &&
      !BLOCK_LINE.test(line);
    if (joinable) flowed[flowed.length - 1] = `${text} ${line.trimStart()}`;
    else flowed.push(line);
  }
  return flowed.join("\n");
}
