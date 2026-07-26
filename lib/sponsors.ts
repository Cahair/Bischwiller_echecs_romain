export type Sponsor = {
  name: string;
  logo: string;
  /** Site officiel du partenaire. Absent = logo affiché sans lien. */
  href?: string;
  /** Ajuste le poids optique du logo dans sa carte (1 = taille par défaut). */
  scale?: number;
};

export type SponsorGroup = {
  title: string;
  intro: string;
  sponsors: Sponsor[];
};

export const sponsorGroups: SponsorGroup[] = [
  {
    title: "Institutions et collectivités",
    intro: "Les collectivités et les organismes publics qui soutiennent la vie associative et sportive à Bischwiller.",
    sponsors: [
      { name: "Collectivité européenne d’Alsace", logo: "/media/sponsors/alsace-cea.png", href: "https://www.alsace.eu/" },
      { name: "Région Grand Est", logo: "/media/sponsors/images-1.jpg", href: "https://www.grandest.fr/" },
      { name: "Ville de Bischwiller", logo: "/media/sponsors/images-e1754464884418.jpg", href: "https://www.ville-bischwiller.fr/", scale: 0.95 },
      { name: "Agence nationale du Sport", logo: "/media/sponsors/unnamed.png", href: "https://www.agencedusport.fr/", scale: 0.62 },
      { name: "O.S.C.L. Bischwiller", logo: "/media/sponsors/oscl.png", scale: 0.95 },
    ],
  },
  {
    title: "Fédérations et instances échiquéennes",
    intro: "Le club joue sous les couleurs de la fédération, de la ligue et du comité départemental.",
    sponsors: [
      { name: "Fédération française des échecs", logo: "/media/sponsors/Logo_ffe_2023.jpg", href: "https://www.echecs.asso.fr/" },
      { name: "Ligue Échecs Grand Est", logo: "/media/sponsors/images.png", href: "https://ligueechecsgrandest.fr/" },
      { name: "Comité des Échecs du Bas-Rhin", logo: "/media/sponsors/images-2.jpg", href: "https://www.echecs.asso.fr/FicheComite.aspx?Ref=67", scale: 1.05 },
    ],
  },
  {
    title: "Partenaires privés",
    intro: "Des entreprises fidèles qui rendent possibles la formation des jeunes et les déplacements en compétition.",
    sponsors: [
      { name: "Crédit Mutuel", logo: "/media/sponsors/CM.jpg", href: "https://www.creditmutuel.fr/fr/particuliers.html", scale: 1.15 },
      { name: "Grenke", logo: "/media/sponsors/GRENKE_Logo_Blackpng-1.png", href: "https://partner.grenkeonline.com/fr-FR", scale: 0.55 },
      { name: "ACCIL", logo: "/media/sponsors/logo-ACCIL-couleur.png", scale: 1.3 },
      { name: "Simon S.A.S.", logo: "/media/sponsors/Logo-Simon-simplifie-vecto.jpg", href: "https://www.simon-et-cie.com/", scale: 0.9 },
    ],
  },
];

export const sponsors: Sponsor[] = sponsorGroups.flatMap((group) => group.sponsors);
