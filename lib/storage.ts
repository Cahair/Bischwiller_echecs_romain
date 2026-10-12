import path from "node:path";

/**
 * Où vit tout ce que l’espace admin écrit : articles, photos, contenu à la une
 * et comptes.
 *
 * En production, `SITE_DATA_DIR` désigne un dossier hors du dépôt : un
 * `git pull`, un nouveau clone ou un nettoyage du projet ne peuvent pas y
 * toucher, et le chemin ne dépend plus du dossier d’où le serveur est lancé.
 * Sans elle — en local —, chaque chose garde sa place historique dans le
 * projet. `scripts/admin/data-dir.mjs` reprend ces chemins pour les scripts.
 */
const configured = process.env.SITE_DATA_DIR?.trim();
export const DATA_DIR = configured ? path.resolve(configured) : null;

// Données d’exécution, pas code : Turbopack n’a pas à les suivre dans le build
// (sans ces commentaires, le chemin variable lui fait embarquer tout le projet).
const inData = (name: string, ...legacy: string[]) =>
  DATA_DIR ? path.join(/*turbopackIgnore: true*/ DATA_DIR, name) : path.join(/*turbopackIgnore: true*/ process.cwd(), ...legacy);

/** Articles maison, un fichier Markdown chacun. */
export const LOCAL_ARTICLES_DIR = inData("actualites", "content", "actualites");
export const FEATURED_FILE = inData("a-la-une.json", "content", "a-la-une.json");
/** Photos et PDF envoyés depuis l’éditeur, servis sous `MEDIA_URL`. */
export const MEDIA_DIR = inData("medias", "public", "media", "actualites");
export const MEDIA_URL = "/media/actualites";
/** Comptes et invitations : condensés de mots de passe, jamais versionnés. */
export const ADMIN_DATA_DIR = inData("admin", "data", "admin");
