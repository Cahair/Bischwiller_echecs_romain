import Image from "next/image";
import Link from "next/link";
import type { SitePage } from "@/lib/site-pages";
import { SiteFooter } from "@/components/layout/site-footer";
import { SponsorBand } from "@/components/layout/sponsor-band";
import { SponsorGrid } from "@/components/sponsors/sponsor-grid";
import styles from "./content-page.module.css";

export function ContentPage({ page }: { page: SitePage }) {
  return <main className={styles.page}>
    <header className={`${styles.hero} ${page.image ? "" : styles.heroNoImage}`}>
      <div className={styles.heroCopy}><Link href="/">Accueil</Link><span className={styles.kicker}>{page.kicker}</span><h1>{page.title}</h1><p>{page.intro}</p><div className={styles.heroMeta}><span>{String(page.sections.length).padStart(2, "0")} chapitres</span><span>C.E.B. / 1981—2026</span></div></div>
      <div className={styles.heroVisual}>{page.image ? <Image src={page.image} alt="" fill priority quality={90} sizes="(max-width: 800px) 100vw, 50vw" /> : <div className={styles.chessPattern} aria-hidden="true" />}</div>
    </header>
    <div className={styles.content}>
      <aside><span>Sur cette page</span><nav>{page.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.title}><b>{String(index + 1).padStart(2, "0")}</b>{section.title}</a>)}</nav></aside>
      <div className={styles.sections}>{page.sections.map((section, index) => <section id={`section-${index + 1}`} className={styles.section} key={section.title} data-reveal>
        <div className={styles.sectionHeading}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2></div>
        <div className={styles.sectionBody}>
          {section.text?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.sponsors ? <div className={styles.sponsors}><SponsorGrid sponsors={section.sponsors} /></div> : null}
          {section.table ? <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr>{section.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>{section.table.rows.map((row) => <tr key={row.join("|")}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
          </table></div> : null}
          {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
          {section.links ? <div className={styles.links}>{section.links.map((link) => {
            const external = /^(https?:|mailto:)/.test(link.href);
            const isDocument = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|zip)([?#]|$)/i.test(link.href);
            return external || isDocument ? <a href={link.href} key={link.href} target={link.href.startsWith("http") || isDocument ? "_blank" : undefined} rel="noreferrer"><span>{link.label}</span><b>↗</b></a> : <Link href={link.href} key={link.href}><span>{link.label}</span><b>→</b></Link>;
          })}</div> : null}
        </div>
      </section>)}</div>
    </div>
    {page.slug === "partenaires" ? null : <SponsorBand />}
    <SiteFooter />
  </main>;
}
