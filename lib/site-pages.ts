import { sponsorGroups, type Sponsor } from "./sponsors";

export type ContentSection = {
  title: string;
  text?: string[];
  bullets?: string[];
  links?: { label: string; href: string }[];
  table?: { headers: string[]; rows: string[][] };
  sponsors?: Sponsor[];
};

export type SitePage = {
  slug: string;
  title: string;
  kicker: string;
  intro: string;
  image?: string;
  sections: ContentSection[];
};

export const sitePages: SitePage[] = [
  {
    slug: "le-club",
    title: "Le Club",
    kicker: "Cercle d’Échecs de Bischwiller",
    intro: "Un club formateur, ambitieux et ouvert à toutes celles et ceux qui souhaitent découvrir les échecs, progresser ou vivre la compétition.",
    image: "/media/wordpress/2025/06/20231105_132554-002-scaled-1.webp",
    sections: [
      { title: "Une passion collective", text: ["Fondé en 1981, le Cercle d’Échecs de Bischwiller réunit des joueuses et joueurs de tous âges. Le club accompagne aussi bien la pratique de loisir que les compétitions nationales."] },
      { title: "Former et transmettre", text: ["L’école d’échecs constitue le cœur du projet du club. Les entraînements sont encadrés par des joueurs et formateurs expérimentés, avec des groupes adaptés aux niveaux et aux ambitions de chacun."] },
      { title: "Une équipe de bénévoles", text: ["Christelle Schmidt, Roland Reeb, Yannis Savignon, Danielle Pivarot, Claudia Fischer et Ayline Klein participent au fonctionnement et au développement du club."] },
    ],
  },
  {
    slug: "un-peu-dhistoire",
    title: "Un peu d’Histoire",
    kicker: "Depuis 1981",
    intro: "Quatre décennies de formation, de passion et de titres ont installé Bischwiller parmi les clubs qui comptent dans les échecs français.",
    image: "/media/wordpress/2025/06/roland-reeb-est-president-du-cercle-d-echecs-de-bischwiller-depuis-le-debut-photo-dna-herve-keller-768x576-1.webp",
    sections: [
      { title: "1981 · Naissance du club", text: ["Le club d’échecs de Bischwiller voit le jour le 20 novembre 1981 grâce à la passion et à l’initiative de Roland Reeb, son fondateur. Déclaré au tribunal de Haguenau, il s’inscrit rapidement dans la vie associative locale."] },
      { title: "2009 · L’ascension de jeunes talents", text: ["Le club franchit une étape décisive avec ses premiers titres nationaux majeurs. Bilel Bellahcene, formé au club, devient champion de France poussins à seulement onze ans."] },
      { title: "2015 · Le sommet national", text: ["Bischwiller décroche pour la première fois le titre de Champion de France des clubs en Top 12. Cette victoire récompense des années de travail et une équipe soudée de talents locaux et internationaux."] },
      { title: "Bien plus qu’un jeu", text: ["Tournois, formation, compétitions nationales et vie associative : les échecs sont à Bischwiller une culture et une tradition vivante."] },
    ],
  },
  {
    slug: "palmares",
    title: "Palmarès",
    kicker: "L’excellence en équipe",
    intro: "Les titres du club témoignent du travail de formation, de la fidélité des joueurs et d’une ambition sportive construite sur la durée.",
    image: "/media/wordpress/2025/06/2025-Trophee-Roza-Lallemand-1-1.webp",
    sections: [
      { title: "Coupe de la Parité", bullets: ["Champions : 2008, 2015 et 2021"] },
      { title: "Top 12 et Top 16", bullets: ["Champions : 2015, 2018, 2019, 2021 et 2022"] },
      { title: "Compétitions jeunes", bullets: ["Champions : 1990, 1991, 2014 et 2024"] },
      { title: "Une ambition intacte", text: ["Chaque saison, les équipes du club défendent les couleurs de Bischwiller dans les compétitions régionales et nationales."] },
    ],
  },
  {
    slug: "scolaire",
    title: "Scolaire",
    kicker: "Apprendre autrement",
    intro: "Le club intervient auprès des jeunes pour développer la concentration, la confiance, l’autonomie et le plaisir de réfléchir ensemble.",
    image: "/media/wordpress/2025/12/20251130_140717-1-scaled.jpg",
    sections: [
      {
        title: "Horaires des activités — écoles et collèges",
        table: {
          headers: ["Établissement", "Horaires", "Activité"],
          rows: [
            ["École Weitbruch", "15h45 – 17h00", "Le lundi, CP à CM2"],
            ["Collège Les Missions Africaines", "14h25 – 16h20", "CM1 et CM2"],
            ["Collège Les Missions Africaines", "16h25 – 17h20", "Club CM1 à 3ème"],
            ["Ecole ABCM – Haguenau", "16h30 – 17h30", "Vendredi soir"],
          ],
        },
      },
      { title: "École d’échecs", text: ["Les cours sont organisés par groupes de niveau et permettent d’acquérir les fondamentaux, de progresser tactiquement et de préparer les compétitions."] },
      { title: "Partenariats scolaires", text: ["Le club accompagne les établissements et les équipes engagées dans les compétitions scolaires et universitaires."] },
      { title: "Rejoindre la formation", links: [{ label: "Inscription à l’école d’échecs", href: "/#inscriptions" }, { label: "Consulter les horaires", href: "/horraires" }] },
    ],
  },
  {
    slug: "partenaires",
    title: "Partenaires",
    kicker: "Ils nous soutiennent",
    intro: "Le développement du club et de ses actions est rendu possible par la confiance de ses partenaires publics, fédéraux et privés. Cliquez sur un logo pour découvrir leur site.",
    sections: sponsorGroups.map(({ title, intro, sponsors }) => ({ title, text: [intro], sponsors })),
  },
  {
    slug: "horraires",
    title: "Horaires",
    kicker: "Activités hebdomadaires",
    intro: "Entraînements encadrés, cours en visio et jeu libre rythment la semaine au club.",
    sections: [
      { title: "Mardi", bullets: ["16h30–18h30 · Entraînement adultes"] },
      { title: "Mercredi", bullets: ["14h–16h · Jeunes avec Nathan Ronce et Roland Reeb", "19h15–20h30 · Cours en visio avec Nathan Ronce"] },
      { title: "Samedi", bullets: ["9h–12h · Entraînement jeunes avec le GM Philipp Schlosser, Nathan Ronce et Roland Reeb", "14h–17h · Jeu libre"] },
    ],
  },
  {
    slug: "administratif",
    title: "Administratif",
    kicker: "Documents du club",
    intro: "Les formulaires et documents essentiels pour préparer votre inscription et votre pratique au club.",
    sections: [
      { title: "Santé", links: [{ label: "Questionnaire de santé majeur", href: "/media/wordpress/2025/09/Questionnaire-de-sante-majeur.pdf" }, { label: "Questionnaire de santé mineur FFE", href: "/media/wordpress/2025/09/Questionnaire-de-sante-mineur-FFE.pdf" }] },
      { title: "Vie du club", links: [{ label: "Charte de l’échiquiste", href: "/media/wordpress/2025/09/Charte-de-lechiquiste-CE-Bischwiller.pdf" }] },
    ],
  },
  {
    slug: "documents",
    title: "Documents",
    kicker: "Ressources utiles",
    intro: "Téléchargez les documents administratifs et pédagogiques mis à disposition par le club.",
    sections: [
      { title: "Documents administratifs", links: [{ label: "Questionnaire de santé majeur", href: "/media/wordpress/2025/09/Questionnaire-de-sante-majeur.pdf" }, { label: "Questionnaire de santé mineur", href: "/media/wordpress/2025/09/Questionnaire-de-sante-mineur-FFE.pdf" }, { label: "Charte de l’échiquiste", href: "/media/wordpress/2025/09/Charte-de-lechiquiste-CE-Bischwiller.pdf" }] },
    ],
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    kicker: "Informations du site",
    intro: "Conformément aux dispositions des articles 6-III et 19 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), il est porté à la connaissance des utilisateurs du site les présentes mentions légales.",
    sections: [
      {
        title: "1. Éditeur du site",
        bullets: [
          "Nom : Romain Kantzer",
          "Statut juridique : Auto-entrepreneur",
          "Nom du site / projet : Site internet du Cercle d’Échecs de Bischwiller",
          "Adresse : 1 Rue du Stade, 67240 Bischwiller",
          "Adresse email : bischwiller.echecs1981@gmail.com",
          "Responsable de la publication : Romain Kantzer",
        ],
      },
      {
        title: "2. Hébergement",
        bullets: [
          "Hébergeur : Infomaniak",
          "Adresse de l’hébergeur : Rue Eugène-Marziano 25, 1227 Les Acacias (GE), Suisse",
        ],
        links: [{ label: "Site web de l’hébergeur", href: "https://www.infomaniak.com" }],
      },
      {
        title: "3. Propriété intellectuelle",
        text: [
          "L’ensemble des contenus du site, y compris les textes, images, graphismes, logo, icônes, sons, logiciels, etc., sont protégés par les lois en vigueur sur la propriété intellectuelle et sont la propriété exclusive de Romain Kantzer, sauf mention contraire.",
          "Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l’autorisation écrite préalable de Romain Kantzer.",
        ],
      },
      {
        title: "4. Données personnelles",
        text: [
          "Aucune donnée personnelle n’est collectée à l’insu de l’utilisateur. Les informations transmises via les formulaires de contact sont uniquement utilisées pour répondre aux demandes.",
          "Conformément au Règlement Général sur la Protection des Données (RGPD), vous pouvez exercer vos droits d’accès, de rectification, d’effacement, de limitation ou d’opposition en écrivant à : bischwiller.echecs1981@gmail.com",
        ],
      },
      {
        title: "5. Cookies",
        text: ["Le site peut utiliser des cookies pour améliorer l’expérience utilisateur. Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies."],
      },
      {
        title: "6. Responsabilité",
        text: ["Romain Kantzer ne saurait être tenu pour responsable des erreurs rencontrées sur le site, de problèmes techniques, d’interprétation des informations publiées, ni des conséquences de leur utilisation."],
      },
    ],
  },
];

export function getSitePage(slug: string) {
  return sitePages.find((page) => page.slug === slug);
}
