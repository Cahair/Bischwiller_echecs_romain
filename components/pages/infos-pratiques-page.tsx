import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import styles from "./infos-pratiques-page.module.css";

const mapsUrl = "https://www.google.com/maps/search/?api=1&query=1+rue+du+Stade+67240+Bischwiller";
const email = "bischwiller.echecs1981@gmail.com";

const schedule = [
  { day: "Mardi", slots: [["16h30 – 18h30", "Entraînement adultes"]] },
  { day: "Mercredi", slots: [["14h – 16h", "Entraînement jeunes"], ["19h15 – 20h30", "Cours en visio"]] },
  { day: "Samedi", slots: [["9h – 12h", "Entraînement jeunes"], ["14h – 17h", "Jeu libre"]] },
];

const actions = [
  { label: "S’inscrire au club", detail: "Adhésions adultes et école d’échecs", href: "/#inscriptions" },
  { label: "Horaires détaillés", detail: "Le programme complet de la semaine", href: "/horraires" },
  { label: "Documents utiles", detail: "Formulaires et charte du club", href: "/documents" },
];

export function InfosPratiquesPage() {
  return <main className={styles.page}>
    <header className={styles.hero}>
      <Link href="/">Accueil</Link>
      <span className={styles.kicker}>Venir au club</span>
      <h1>Infos pratiques</h1>
      <p>L’essentiel pour nous rejoindre : où nous trouver, quand jouer et comment nous contacter.</p>
    </header>
    <section className={styles.essentials} aria-label="Informations essentielles">
      <article className={styles.card}>
        <span>Adresse</span>
        <h2>M.A.C.</h2>
        <p>1 rue du Stade<br />67240 Bischwiller</p>
        <div className={styles.cardActions}><a href={mapsUrl} target="_blank" rel="noreferrer"><span>Ouvrir dans Google Maps</span><b>↗</b></a></div>
      </article>
      <article className={styles.card}>
        <span>Horaires</span>
        <h2>La semaine du club</h2>
        <ul className={styles.schedule}>{schedule.map(({ day, slots }) => <li key={day}>
          <strong>{day}</strong>
          <div>{slots.map(([time, label]) => <p key={time}><b>{time}</b><span>{label}</span></p>)}</div>
        </li>)}</ul>
        <div className={styles.cardActions}><Link href="/horraires"><span>Voir le détail</span><b>→</b></Link></div>
      </article>
      <article className={styles.card}>
        <span>Contact</span>
        <h2>Écrivez-nous</h2>
        <p className={styles.email}>{email}</p>
        <div className={styles.cardActions}>
          <a href={`mailto:${email}`}><span>Envoyer un e-mail</span><b>↗</b></a>
          <a href="https://www.facebook.com/Cercle.Echecs.Bischwiller/?locale=fr_FR" target="_blank" rel="noreferrer"><span>Facebook</span><b>↗</b></a>
        </div>
      </article>
    </section>
    <section className={styles.actions} aria-label="Préparer votre venue" data-reveal>
      {actions.map((action) => <Link href={action.href} key={action.href}><div><strong>{action.label}</strong><span>{action.detail}</span></div><b>→</b></Link>)}
    </section>
    <SiteFooter />
  </main>;
}
