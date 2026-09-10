import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/admin/icons";
import { readSession } from "@/lib/admin/session";
import { listAdminArticles, type AdminArticleSummary } from "@/lib/admin/store";
import { slugify } from "@/lib/markdown";
import styles from "@/components/admin/admin.module.css";

const PAGE_SIZE = 30;
const FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "en-ligne", label: "En ligne" },
  { key: "brouillons", label: "Brouillons" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];
type Query = { q?: string; statut?: string; annee?: string; page?: string; bienvenue?: string };

function formatStamp(stamp: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${stamp.replace(" ", "T")}Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...options });
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

/** Une teinte fixe par rubrique : la même couleur d’une page à l’autre aide à s’y retrouver. */
function hue(name: string): number {
  let value = 7;
  for (const char of name) value = (value * 31 + char.charCodeAt(0)) % 360;
  return value;
}

function inFilter(article: AdminArticleSummary, filter: Filter): boolean {
  if (filter === "en-ligne") return article.status === "publish";
  if (filter === "brouillons") return article.status === "draft";
  return true;
}

/**
 * Seuls 17 des 565 articles repris de WordPress ont une photo : une grille de
 * vignettes serait vide aux trois quarts. La liste s’organise donc autour de
 * la date — une pastille jour-mois par ligne, un intertitre par année — et
 * n’affiche la photo qu’en complément, quand il y en a une.
 */
export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const session = await readSession();
  const articles = listAdminArticles();

  const search = (query.q ?? "").trim();
  const filter: Filter = FILTERS.find(({ key }) => key === query.statut)?.key ?? "tous";
  const year = /^\d{4}$/.test(query.annee ?? "") ? String(query.annee) : "";
  const years = [...new Set(articles.map((article) => article.publishedAt.slice(0, 4)))].sort().reverse();

  // Recherche insensible aux accents et à la casse : « selestat » trouve « Sélestat ».
  const needle = slugify(search);
  const scoped = articles.filter(
    (article) =>
      (!year || article.publishedAt.startsWith(year)) &&
      (!needle || slugify(article.title).includes(needle) || article.slug.includes(needle)),
  );
  const found = scoped.filter((article) => inFilter(article, filter));
  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(query.page) || 1));
  const visible = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const drafts = articles.filter((article) => article.status === "draft");
  const filtering = Boolean(search || year || filter !== "tous");

  // Tout changement de filtre ramène en première page.
  const href = (changes: Query) => {
    const merged: Query = { q: search, statut: filter === "tous" ? "" : filter, annee: year, page: "", ...changes };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/admin?${text}` : "/admin";
  };

  const groups: { year: string; articles: AdminArticleSummary[] }[] = [];
  for (const article of visible) {
    const articleYear = article.publishedAt.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last?.year === articleYear) last.articles.push(article);
    else groups.push({ year: articleYear, articles: [article] });
  }

  const firstName = session?.name.split(" ")[0] ?? "";

  return (
    <>
      {/* Arrivée par un lien d’invitation : on dit tout de suite comment revenir. */}
      {query.bienvenue && session ? (
        <div className={styles.success} role="status">
          <span className={styles.successIcon}>
            <Icon name="check" size="1.6em" />
          </span>
          <div className={styles.successBody}>
            <strong>C’est fait, votre accès est prêt.</strong>
            <p>
              Pour revenir plus tard, allez sur <b>bischwiller-echecs.com/admin</b>, puis entrez votre identifiant <b>{session.login}</b> et
              votre mot de passe. Votre navigateur peut aussi les retenir pour vous.
            </p>
          </div>
        </div>
      ) : null}

      <section className={styles.welcome}>
        <div>
          <p className={styles.welcomeHello}>Bonjour{firstName ? ` ${firstName}` : ""},</p>
          <h1 className={styles.welcomeTitle}>Que souhaitez-vous faire&nbsp;?</h1>
        </div>
        <Link className={`${styles.button} ${styles.buttonLarge}`} href="/admin/articles/nouveau">
          <Icon name="pen" /> Écrire un nouvel article
        </Link>
      </section>

      {!filtering && page === 1 && drafts.length > 0 ? (
        <section className={styles.section} aria-labelledby="brouillons">
          <h2 className={styles.sectionTitle} id="brouillons">
            Brouillons à terminer
          </h2>
          <p className={styles.sectionHint}>Ils ne sont pas encore visibles sur le site.</p>
          <div className={styles.draftGrid}>
            {drafts.slice(0, 6).map((article) => (
              <Link className={styles.draftCard} href={`/admin/articles/${article.slug}`} key={article.slug}>
                <span className={styles.draftTitle}>{article.title}</span>
                <span className={styles.draftMeta}>
                  Modifié le {formatStamp(article.modifiedAt || article.publishedAt, { day: "numeric", month: "long" })} · {article.author}
                </span>
                <span className={styles.draftCta}>
                  Reprendre <Icon name="forward" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="tous-les-articles">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle} id="tous-les-articles">
            Tous les articles
          </h2>
          <form className={styles.search} action="/admin" role="search">
            <label className={styles.searchField}>
              <Icon name="search" />
              <input
                className={styles.input}
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Rechercher un titre…"
                aria-label="Rechercher un article par son titre"
              />
            </label>
            {filter !== "tous" ? <input type="hidden" name="statut" value={filter} /> : null}
            {year ? <input type="hidden" name="annee" value={year} /> : null}
            <button className={styles.buttonGhost} type="submit">
              Rechercher
            </button>
          </form>
        </div>

        <nav className={styles.tabs} aria-label="Filtrer par état">
          {FILTERS.map(({ key, label }) => (
            <Link
              key={key}
              className={`${styles.tab} ${filter === key ? styles.tabActive : ""}`}
              aria-current={filter === key ? "page" : undefined}
              href={href({ statut: key === "tous" ? "" : key })}
            >
              {label}
              <span className={styles.tabCount}>{scoped.filter((article) => inFilter(article, key)).length}</span>
            </Link>
          ))}
        </nav>

        <nav className={styles.years} aria-label="Filtrer par année">
          <Link className={`${styles.year} ${year ? "" : styles.yearActive}`} aria-current={year ? undefined : "page"} href={href({ annee: "" })}>
            Toutes les années
          </Link>
          {years.map((value) => (
            <Link
              key={value}
              className={`${styles.year} ${year === value ? styles.yearActive : ""}`}
              aria-current={year === value ? "page" : undefined}
              href={href({ annee: value })}
            >
              {value}
            </Link>
          ))}
        </nav>

        {filtering ? (
          <p className={styles.resultLine}>
            <span>
              {found.length === 0 ? "Aucun article trouvé" : `${plural(found.length, "article")} trouvé${found.length > 1 ? "s" : ""}`}
              {search ? ` pour « ${search} »` : ""}
            </span>
            <Link className={styles.clearLink} href="/admin">
              Effacer les filtres
            </Link>
          </p>
        ) : null}

        {found.length === 0 ? (
          <p className={styles.empty}>
            {search ? "Essayez avec un autre mot du titre, ou effacez les filtres." : "Aucun article dans cette sélection."}
          </p>
        ) : (
          groups.map((group) => (
            <div className={styles.group} key={group.year}>
              <h3 className={styles.groupHead}>
                {group.year}
                <span className={styles.groupCount}>
                  {plural(found.filter((article) => article.publishedAt.startsWith(group.year)).length, "article")}
                </span>
              </h3>
              <ul className={styles.list}>
                {group.articles.map((article) => (
                  <li className={styles.row} key={article.slug}>
                    <span className={styles.dateTile} aria-hidden="true">
                      <span className={styles.dateDay}>{formatStamp(article.publishedAt, { day: "numeric" })}</span>
                      <span className={styles.dateMonth}>{formatStamp(article.publishedAt, { month: "short" })}</span>
                    </span>
                    <div className={styles.rowBody}>
                      <Link className={styles.rowTitle} href={`/admin/articles/${article.slug}`}>
                        {article.title}
                      </Link>
                      <p className={styles.rowMeta}>
                        <span>{formatStamp(article.publishedAt, { day: "numeric", month: "long", year: "numeric" })}</span>
                        {article.categories.slice(0, 2).map((name) => (
                          <span className={styles.catPill} key={name} style={{ "--hue": hue(name) } as CSSProperties}>
                            {name}
                          </span>
                        ))}
                        {article.status === "draft" ? <span className={styles.pillDraft}>Brouillon</span> : null}
                      </p>
                    </div>
                    {article.featuredImage?.startsWith("/") ? (
                      <span className={styles.thumb}>
                        <Image src={article.featuredImage} alt="" fill sizes="80px" />
                      </span>
                    ) : null}
                    {article.status === "publish" ? (
                      <a
                        className={styles.rowView}
                        href={`/actualites/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Voir « ${article.title} » sur le site`}
                      >
                        Voir <Icon name="external" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {pages > 1 ? (
          <nav className={styles.pagination} aria-label="Pages">
            {page > 1 ? (
              <Link className={styles.buttonGhost} href={href({ page: String(page - 1) })}>
                <Icon name="back" /> Plus récents
              </Link>
            ) : (
              <span />
            )}
            <span className={styles.paginationInfo}>
              Page {page} sur {pages}
            </span>
            {page < pages ? (
              <Link className={styles.buttonGhost} href={href({ page: String(page + 1) })}>
                Plus anciens <Icon name="forward" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
