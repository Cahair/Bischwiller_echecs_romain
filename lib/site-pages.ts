export type ContentSection = {
  title: string;
  text?: string[];
  bullets?: string[];
  links?: { label: string; href: string }[];
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
    image: "/media/wordpress/2025/07/Photo-de-groupe-4.jpg",
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
    image: "/media/wordpress/2025/06/Roland-Reeb-1-500x318-1.webp",
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
    image: "/media/wordpress/2025/06/top12titre.webp",
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
    image: "/media/wordpress/2025/09/club_formateur-removebg-preview.png",
    sections: [
      { title: "École d’échecs", text: ["Les cours sont organisés par groupes de niveau et permettent d’acquérir les fondamentaux, de progresser tactiquement et de préparer les compétitions."] },
      { title: "Partenariats scolaires", text: ["Le club accompagne les établissements et les équipes engagées dans les compétitions scolaires et universitaires."] },
      { title: "Rejoindre la formation", links: [{ label: "Inscription à l’école d’échecs", href: "/#inscriptions" }, { label: "Consulter les horaires", href: "/horraires" }] },
    ],
  },
  {
    slug: "partenaires",
    title: "Partenaires",
    kicker: "Ils nous soutiennent",
    intro: "Le développement du club et de ses actions est rendu possible par la confiance de ses partenaires publics, fédéraux et privés.",
    image: "/media/wordpress/2025/08/logo.png",
    sections: [
      { title: "Partenaires publics", bullets: ["Collectivité européenne d’Alsace", "Ville de Bischwiller", "OSCL", "Crédit Mutuel"] },
      { title: "Fédérations", bullets: ["Fédération française des échecs", "Ligue Échecs Grand Est", "Comité des Échecs du Bas-Rhin"] },
      { title: "Partenaires privés", bullets: ["Grenke", "ACCIL", "Simon & Cie"] },
    ],
  },
  {
    slug: "infos-pratiques",
    title: "Infos Pratiques",
    kicker: "Venir au club",
    intro: "Retrouvez l’adresse, les contacts et toutes les informations utiles pour participer aux activités du Cercle d’Échecs de Bischwiller.",
    image: "/media/wordpress/2025/06/A-minimalist-background-featuring-chess-pieces-king-queen-rook-bishop-knight-and-pawn-arrange-1.webp",
    sections: [
      { title: "Adresse", text: ["M.A.C. · 1 rue du Stade · 67240 Bischwiller"], links: [{ label: "Ouvrir dans Google Maps", href: "https://www.google.com/maps/search/?api=1&query=1+rue+du+Stade+67240+Bischwiller" }] },
      { title: "Contact", text: ["Pour toute question, écrivez-nous à bischwiller.echecs1981@gmail.com."], links: [{ label: "Envoyer un e-mail", href: "mailto:bischwiller.echecs1981@gmail.com" }] },
      { title: "Préparer votre venue", links: [{ label: "Voir les horaires", href: "/horraires" }, { label: "Consulter les documents", href: "/documents" }, { label: "S’inscrire", href: "/#inscriptions" }] },
    ],
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
    intro: "Informations relatives à l’éditeur et à l’utilisation du site du Cercle d’Échecs de Bischwiller.",
    sections: [
      { title: "Éditeur", text: ["Cercle d’Échecs de Bischwiller · Association sportive · 1 rue du Stade, 67240 Bischwiller.", "Contact : bischwiller.echecs1981@gmail.com"] },
      { title: "Données personnelles", text: ["Ce site ne collecte que les informations nécessaires à son fonctionnement. Les liens d’inscription renvoient vers les services sécurisés de HelloAsso."] },
      { title: "Crédits", text: ["Les textes, photographies et éléments graphiques sont la propriété du club ou de leurs auteurs respectifs."] },
    ],
  },
];

export function getSitePage(slug: string) {
  return sitePages.find((page) => page.slug === slug);
}
