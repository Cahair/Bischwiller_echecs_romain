import Image from "next/image";
import Link from "next/link";
import styles from "./site-footer.module.css";

const pages = [["Le club", "/le-club"], ["Notre histoire", "/un-peu-dhistoire"], ["Palmarès", "/palmares"], ["Scolaire", "/scolaire"], ["Partenaires", "/partenaires"]];
const useful = [["Actualités", "/actualites"], ["Horaires", "/horraires"], ["Documents", "/documents"], ["Infos pratiques", "/infos-pratiques"], ["Mentions légales", "/mentions-legales"]];

export function SiteFooter() {
  return <footer className={styles.footer}>
    <div className={styles.top}>
      <div className={styles.identity}><Image src="/media/wordpress/2025/06/images.webp" alt="" width={64} height={64} /><p>Cercle d’Échecs<br />de Bischwiller</p><span>Penser. Jouer. Transmettre.</span></div>
      <div className={styles.column}><strong>Découvrir</strong>{pages.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>
      <div className={styles.column}><strong>Informations</strong>{useful.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</div>
      <div className={styles.contact}><strong>Nous retrouver</strong><address>M.A.C.<br />1 rue du Stade<br />67240 Bischwiller</address><a href="mailto:bischwiller.echecs1981@gmail.com">Nous écrire ↗</a><a href="https://www.facebook.com/BischwillerEchecs" target="_blank" rel="noreferrer">Facebook ↗</a></div>
    </div>
    <div className={styles.bottom}><span>© {new Date().getFullYear()} C.E. Bischwiller</span><span>Club fondé en 1981</span><Link href="/mentions-legales">Mentions légales</Link></div>
  </footer>;
}
