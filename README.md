# Cercle d'Échecs de Bischwiller

Refonte du site WordPress/Elementor du club avec Next.js, React et TypeScript.

## Démarrer

```bash
pnpm install
pnpm dev
```

Le site est ensuite accessible sur <http://localhost:3000>.

## Import WordPress

Les exports XML d'origine sont conservés dans `data/wordpress/` et exclus de Git. Les commandes suivantes permettent de reproduire la migration :

```bash
pnpm wordpress:audit    # analyse les exports et recense les médias
pnpm wordpress:media    # télécharge/reprend les médias WordPress
pnpm wordpress:content  # génère le JSON et les fichiers MDX
pnpm site:inventory     # met à jour l'inventaire des pages
pnpm wordpress:import   # exécute toute la chaîne
```

Résultats générés :

- `content/articles/` : un fichier MDX par article publié ;
- `data/generated/articles.json` : contenu complet pour Next.js ;
- `data/generated/article-index.json` : index léger pour les listes ;
- `data/generated/drafts.json` : brouillons conservés séparément ;
- `public/media/wordpress/` : copie locale des médias récupérables ;
- `docs/site-inventory.md` : inventaire et stratégie de migration des pages.

## Espace admin

Les articles se rédigent et se publient depuis `/admin`, sans passer par le dépôt. L'éditeur écrit un fichier Markdown par article et dépose les photos à côté : un article publié depuis le site est indiscernable d'un article écrit à la main. Les pages publiques concernées sont régénérées dans la foulée, sans redéploiement.

Où vont ces fichiers dépend de `SITE_DATA_DIR` (`lib/storage.ts`) :

| | En local (variable vide) | En production (`SITE_DATA_DIR=/chemin`) |
|---|---|---|
| Articles | `content/actualites/` | `/chemin/actualites/` |
| Contenu à la une | `content/a-la-une.json` | `/chemin/a-la-une.json` |
| Photos et PDF | `public/media/actualites/` | `/chemin/medias/` |
| Comptes et invitations | `data/admin/` | `/chemin/admin/` |

Les photos restent publiées sous `/media/actualites/…` dans les deux cas : celles que `public/` ne contient pas passent par `app/media/actualites/[file]/route.ts`, qui les lit dans le dossier de données.

### Mise en service

```bash
pnpm admin:secret                             # génère ADMIN_SESSION_SECRET
# reporter la valeur dans .env.local (voir .env.example),
# avec, sur le serveur, SITE_DATA_DIR=<dossier hors du site>
pnpm admin:user ajouter romain "Romain"       # demande le mot de passe, sans écho
```

Les comptes vivent dans `users.json` du dossier des comptes (tableau ci-dessus), hors du dépôt : seul le condensé scrypt du mot de passe y figure. Autres commandes : `pnpm admin:user lister`, `pnpm admin:user supprimer <identifiant>`. Relancer `ajouter` sur un identifiant existant change son mot de passe. Un compte créé ainsi est administrateur : les membres suivants s'invitent depuis la page « Comptes » du site, sans que personne ne leur transmette de mot de passe.

### Ce que l'espace admin permet

- rédiger sans voir une ligne de Markdown : le texte se tape comme un e-mail, photos, intertitres et PDF s'insèrent à l'endroit du curseur, les rubriques se choisissent d'un clic, et un aperçu plein écran montre l'article tel qu'il sera publié ;
- ne rien oublier : seuls le titre et le texte sont obligatoires, et signalés comme tels. « Publier » sans eux ne publie rien : l'étape à compléter s'encadre de rouge et le curseur s'y place. Les articles sont signés « Yannis » par défaut, quel que soit le compte connecté (`DEFAULT_AUTHOR` dans `lib/admin/store.ts`) ; le champ « Auteur », sous « Plus d'options », permet de signer autrement ;
- passer à l'éditeur Markdown avancé, avec aperçu en direct. Il s'ouvre d'office pour les articles dont la mise en forme (liens, images, tableaux) ne passerait pas sans perte dans l'éditeur simple — la conversion est dans `components/admin/blocks.ts` ;
- envoyer photos et PDF (15 Mo maximum, contenu vérifié à l'octet près). Les photos de téléphone sont réduites à 2 400 px dans le navigateur avant l'envoi ;
- garder un article en brouillon : il reste listé dans l'admin, invisible sur le site ;
- modifier ou supprimer un article maison ;
- **mettre un contenu à la une** (page « À la une », ouverte à tous les comptes) : un titre, un texte, une photo, et un interrupteur. Allumé, le bloc s'affiche en haut de la page d'accueil, juste sous la vidéo ; éteint, il disparaît du site sans rien effacer. Le tout vit dans `a-la-une.json`, avec les articles (`lib/featured.ts`) ;
- **inviter des membres sans leur écrire de mot de passe** (page « Comptes », réservée aux administrateurs) : chaque invitation produit un lien à usage unique, valable 7 jours, où le membre choisit lui-même son mot de passe. Seule l'empreinte SHA-256 du lien est conservée, dans `invitations.json`, à côté des comptes. Le même mécanisme sert aux mots de passe oubliés, et « Retirer l'accès » ferme aussitôt les sessions ouvertes — chaque requête revérifie le compte (`lib/admin/accounts.ts`, `lib/admin/session.ts`) ;
- limiter les essais de connexion : 5 échecs en 15 minutes bloquent l'identifiant, 20 bloquent l'adresse IP (`lib/admin/throttle.ts`, en mémoire) ;
- **corriger un article repris de WordPress** : l'enregistrement écrit une copie parmi les articles maison, qui masque l'original partout sur le site. `content/articles/` n'est jamais modifié, donc une réimportation ne peut rien écraser, et le bouton « Rétablir la version d'origine » efface simplement la copie.

### Contraintes d'hébergement

L'espace admin écrit sur le disque : il lui faut un serveur Node persistant (`pnpm build && pnpm start`), pas une plateforme au système de fichiers en lecture seule.

**En production, `SITE_DATA_DIR` est obligatoire** et doit désigner un chemin absolu **hors du dossier du site**. Tant que les données vivent dans le dossier du site, elles sont à la merci du déploiement : un nouveau clone, un `git reset` ou un `git clean` les efface. Le dossier de données n'appartient qu'au serveur, et aucun déploiement n'y touche.

À chaque `npm run build`, `scripts/admin/init-data.mjs` passe avant `next build`. Il refuse un dossier placé dans le site ou inaccessible en écriture : le build échoue alors, et le site en ligne reste intact. Au premier passage, il recopie dans le dossier de données ce que le projet contenait (articles, une, photos, comptes), sans rien écraser ni rien effacer. Un fichier témoin, `.reprise-faite`, empêche les copies suivantes.

**Les sauvegardes doivent couvrir le dossier `SITE_DATA_DIR`** : c'est là que vit tout ce qui est publié depuis le site, et il n'existe que sur le serveur.

## Mesure d'audience (Umami)

La fréquentation est mesurée avec [Umami](https://umami.is) : pas de cookie, pas de bandeau de consentement à afficher. Le traceur est chargé par `components/layout/umami-analytics.tsx`, depuis le layout racine.

### Mise en service

1. Créer un compte sur [Umami Cloud](https://cloud.umami.is) (gratuit jusqu'à 100 000 événements par mois) ou utiliser une instance auto-hébergée, puis y ajouter le site avec le domaine `bischwiller-echecs.com`.
2. Copier l'identifiant du site (Paramètres → Sites web → Modifier) dans le `.env.local` du serveur :

   ```bash
   NEXT_PUBLIC_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   # instance auto-hébergée seulement :
   NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://stats.exemple.fr/script.js
   ```

3. Relancer `pnpm build && pnpm start` : ces variables sont lues au build, un simple redémarrage ne suffit pas.

### Ce qui est compté, et ce qui ne l'est pas

- seules les visites sur `bischwiller-echecs.com` (et `www.`) sont comptées : un serveur lancé en local ne fausse pas les chiffres ;
- l'espace `/admin` n'est jamais compté ;
- les visiteurs dont le navigateur envoie « Ne pas me pister » (Do Not Track) sont ignorés, comme l'annoncent les mentions légales ;
- pour que les visites des membres qui rédigent ne gonflent pas les statistiques, chacun peut exclure son navigateur une fois pour toutes : sur le site, ouvrir la console du navigateur (F12) et taper `localStorage.setItem("umami.disabled", 1)`.

## Structure du site

- `app/` : routes Next.js, actualités et pages internes ;
- `components/home/` : hero et sections de la page d'accueil ;
- `components/layout/` : navigation et pied de page ;
- `components/pages/` : rendu des pages éditoriales ;
- `app/admin/` : espace de rédaction, protégé par session ;
- `components/admin/` : éditeur Markdown et son aperçu ;
- `lib/admin/` : comptes, sessions, écriture des articles et des médias ;
- `scripts/wordpress/` : pipeline d'import reproductible ;
- `assets/video/` : vidéo source originale ;
- `public/videos/` : version web optimisée et poster.

## Vérifications

```bash
pnpm lint
pnpm build
```
