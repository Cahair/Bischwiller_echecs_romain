import Image from "next/image";
import Link from "next/link";
import articleIndex from "@/data/generated/article-index.json";
import styles from "./home-sections.module.css";

type Article = (typeof articleIndex)[number];

const helloAsso = {
  adults: "https://www.helloasso.com/associations/cercle-d-echecs-de-bischwiller/adhesions/adultes-adhesion-saison-2025-2026",
  school: "https://www.helloasso.com/associations/cercle-d-echecs-de-bischwiller/adhesions/inscription-siason-2025-2026",
};

const teams = [
  ["01", "Nationale II", "L’équipe fanion du club", "https://echecs.asso.fr/EquipesCalendrier.aspx?Ref=878&Saison=3000"],
  ["02", "Nationale IV", "La force du collectif", "https://www.echecs.asso.fr/"],
  ["03", "Top Jeunes", "Former les champions de demain", "https://www.echecs.asso.fr/"],
  ["04", "Nationale I Jeunes", "L’excellence en formation", "https://www.echecs.asso.fr/"],
];

const partners = [
  ["Collectivité européenne d’Alsace", "/media/wordpress/2025/08/logo.png"],
  ["Ville de Bischwiller", "/media/wordpress/2025/08/images-e1754464884418.jpg"],
  ["Fédération française des échecs", "/media/wordpress/2025/08/Logo_ffe_2023.jpg"],
  ["Ligue Échecs Grand Est", "/media/wordpress/2025/08/images.png"],
  ["Crédit Mutuel", "/media/wordpress/2025/09/CM.jpg"],
  ["Grenke", "/media/wordpress/2025/08/GRENKE_Logo_Blackpng-1.png"],
  ["ACCIL", "/media/wordpress/2025/08/logo-ACCIL-couleur.png"],
  ["Simon", "/media/wordpress/2025/08/Logo-Simon-simplifie-vecto.jpg"],
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${date.replace(" ", "T")}Z`));
}

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <article className={featured ? styles.newsFeatured : styles.newsCard}>
      <Link className={styles.newsImage} href={`/actualites/${article.slug}`}>
        {article.featuredImage ? <Image src={article.featuredImage} alt="" fill sizes={featured ? "(max-width: 900px) 100vw, 66vw" : "(max-width: 900px) 100vw, 34vw"} /> : <span className={styles.imageFallback}>C.E.B.</span>}
      </Link>
      <div className={styles.newsCopy}>
        <div className={styles.newsMeta}><span>{article.categories[0] || "Actualités"}</span><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></div>
        <h3><Link href={`/actualites/${article.slug}`}>{article.title}</Link></h3>
        {featured ? <p>{article.excerpt || "Découvrez les dernières nouvelles, résultats et temps forts du club."}</p> : null}
        <Link className={styles.textLink} href={`/actualites/${article.slug}`}>Lire l’article <Arrow /></Link>
      </div>
    </article>
  );
}

function SectionTitle({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <div className={styles.sectionTitle}><span>{eyebrow}</span><h2>{title}</h2>{intro ? <p>{intro}</p> : null}</div>;
}

export function ClubIntro() {
  return (
    <section className={styles.intro} aria-labelledby="intro-title" data-reveal>
      <div className={styles.introGrid}>
        <div className={styles.introTitle}><span className={styles.index}>01 / LE CLUB</span><h2 id="intro-title">Ici, chaque coup<br />construit l’avenir.</h2></div>
        <div className={styles.introCopy}><p className={styles.lead}>Un club de formation, de compétition et de transmission ouvert à toutes les générations.</p><p>Depuis 1981, Bischwiller réunit celles et ceux qui aiment chercher, progresser et partager. Des premiers déplacements de pièces aux plus grandes compétitions nationales, nous avançons avec la même exigence : jouer ensemble.</p><Link className={styles.outlineButton} href="/le-club">Découvrir notre histoire <Arrow /></Link></div>
      </div>
      <div className={styles.stats}>
        <div><strong>1981</strong><span>Année de création</span></div>
        <div><strong>5×</strong><span>Champion de France</span></div>
        <div><strong>4</strong><span>Équipes nationales</span></div>
        <div><strong>7–77</strong><span>Pour tous les âges</span></div>
      </div>
    </section>
  );
}

export function LatestNews() {
  const [featured, ...secondary] = articleIndex.slice(0, 3);
  return (
    <section className={styles.news} aria-labelledby="latest-title" data-reveal>
      <div className={styles.sectionBar}><SectionTitle eyebrow="02 / EN CE MOMENT" title="Dernières nouvelles" /><Link href="/actualites">Toutes les actualités <Arrow /></Link></div>
      <div className={styles.newsGrid}><NewsCard article={featured} featured /><div className={styles.newsSide}>{secondary.map((article) => <NewsCard article={article} key={article.id} />)}</div></div>
    </section>
  );
}

export function Registrations() {
  return (
    <section id="inscriptions" className={styles.programs} aria-labelledby="programs-title" data-reveal>
      <div className={styles.programIntro}><SectionTitle eyebrow="03 / REJOINDRE LE CLUB" title="À chacun son jeu." intro="Que vous cherchiez le plaisir d’une partie, la progression ou la compétition, une place vous attend autour de l’échiquier." /><Link className={styles.lightButton} href="/horraires">Voir les horaires <Arrow /></Link></div>
      <div className={styles.programCards}>
        <a href={helloAsso.adults} target="_blank" rel="noreferrer"><span className={styles.programNumber}>01</span><div><p>Loisir & compétition</p><h3>Adultes</h3></div><strong>S’inscrire sur HelloAsso <Arrow /></strong></a>
        <a href={helloAsso.school} target="_blank" rel="noreferrer"><span className={styles.programNumber}>02</span><div><p>Apprendre & progresser</p><h3>École d’échecs</h3></div><strong>S’inscrire sur HelloAsso <Arrow /></strong></a>
      </div>
    </section>
  );
}

export function Formation() {
  return (
    <section className={styles.formation} data-reveal>
      <div className={styles.formationImage}><Image src="/media/wordpress/2025/07/Photo-de-groupe-4.jpg" alt="Les jeunes joueurs du Cercle d’Échecs de Bischwiller" fill sizes="(max-width: 850px) 100vw, 58vw" /></div>
      <div className={styles.formationCopy}><span className={styles.index}>04 / TRANSMETTRE</span><h2>Le talent se travaille en équipe.</h2><p>Notre école accompagne chaque jeune à son rythme, avec des formateurs expérimentés et un parcours pensé pour durer.</p><div className={styles.labels}><Image src="/media/wordpress/2025/09/club_formateur-removebg-preview.png" alt="Label Club Formateur" width={120} height={145} /><Image src="/media/wordpress/2025/09/club_feminin-removebg-preview.png" alt="Label Club Féminin" width={105} height={145} /></div><Link className={styles.outlineButton} href="/scolaire">Découvrir la formation <Arrow /></Link></div>
    </section>
  );
}

export function Teams() {
  return (
    <section className={styles.teams} aria-labelledby="teams-title" data-reveal>
      <SectionTitle eyebrow="05 / COMPÉTITION" title="Nos équipes" intro="De la relève à l’équipe fanion, un même maillot et la même ambition." />
      <div className={styles.teamList}>{teams.map(([number, name, detail, href]) => <a href={href} target="_blank" rel="noreferrer" key={name}><span>{number}</span><h3>{name}</h3><p>{detail}</p><Arrow /></a>)}</div>
    </section>
  );
}

export function Palmares() {
  return (
    <section className={styles.palmares} aria-labelledby="palmares-title" data-reveal>
      <Image src="/media/wordpress/2025/06/top12titre.webp" alt="L’équipe de Bischwiller célèbre un titre" fill sizes="100vw" />
      <div className={styles.palmaresShade} />
      <div className={styles.palmaresCopy}><span>UNE HISTOIRE D’EXCELLENCE</span><h2 id="palmares-title">Des titres.<br />Des souvenirs.<br />Une équipe.</h2><p>Cinq titres de champion de France des clubs et une ambition toujours intacte.</p><Link className={styles.lightButton} href="/palmares">Voir le palmarès <Arrow /></Link></div>
    </section>
  );
}

export function Committee() {
  return (
    <section className={styles.committee} aria-labelledby="committee-title" data-reveal>
      <div className={styles.committeeCopy}><span className={styles.index}>06 / LE COLLECTIF</span><h2 id="committee-title">Le club vit grâce à eux.</h2><p>Christelle Schmidt, Roland Reeb, Yannis Savignon, Danielle Pivarot, Claudia Fischer et Ayline Klein œuvrent toute l’année au développement du club.</p><Link className={styles.outlineButton} href="/le-club">Rencontrer le club <Arrow /></Link></div>
      <div className={styles.committeeImage}><Image src="/media/wordpress/2025/09/4U4A9864-scaled.jpg" alt="Le comité du Cercle d’Échecs de Bischwiller" fill sizes="(max-width: 850px) 100vw, 58vw" /><small>Photo Alain Hulot</small></div>
    </section>
  );
}

export function Partners() {
  return (
    <section className={styles.partners} aria-labelledby="partners-title" data-reveal><SectionTitle eyebrow="07 / NOS SOUTIENS" title="Ils avancent avec nous." /><div className={styles.partnerGrid}>{partners.map(([name, src]) => <div key={name}><Image src={src} alt={name} width={160} height={80} /></div>)}</div></section>
  );
}

export function Visit() {
  return (
    <section className={styles.visit} data-reveal><div><span>VENEZ JOUER</span><h2>Votre prochaine partie commence ici.</h2></div><div className={styles.visitInfo}><p><strong>M.A.C.</strong><br />1 rue du Stade<br />67240 Bischwiller</p><Link className={styles.lightButton} href="/infos-pratiques">Préparer ma visite <Arrow /></Link></div></section>
  );
}

export function HomeSections() {
  return <><ClubIntro /><LatestNews /><Registrations /><Formation /><Teams /><Palmares /><Committee /><Partners /><Visit /></>;
}
