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

Les articles se rédigent et se publient depuis `/admin`, sans passer par le dépôt. L'éditeur écrit un fichier Markdown dans `content/actualites/` et dépose les photos dans `public/media/actualites/` : un article publié depuis le site est indiscernable d'un article écrit à la main. Les pages publiques concernées sont régénérées dans la foulée, sans redéploiement. En production, Next ne sert depuis `public/` que les fichiers présents au démarrage : les photos envoyées ensuite passent par `app/media/actualites/[file]/route.ts`, qui les lit sur le disque.

### Mise en service

```bash
pnpm admin:secret                             # génère ADMIN_SESSION_SECRET
# reporter la valeur dans .env.local (voir .env.example)
pnpm admin:user ajouter romain "Romain"       # demande le mot de passe, sans écho
```

Les comptes vivent dans `data/admin/users.json`, hors du dépôt : seul le condensé scrypt du mot de passe y figure. Autres commandes : `pnpm admin:user lister`, `pnpm admin:user supprimer <identifiant>`. Relancer `ajouter` sur un identifiant existant change son mot de passe. Un compte créé ainsi est administrateur : les membres suivants s'invitent depuis la page « Comptes » du site, sans que personne ne leur transmette de mot de passe.

### Ce que l'espace admin permet

- rédiger sans voir une ligne de Markdown : le texte se tape comme un e-mail, photos, intertitres et PDF s'insèrent à l'endroit du curseur, les rubriques se choisissent d'un clic, et un aperçu plein écran montre l'article tel qu'il sera publié ;
- ne rien oublier : seuls le titre et le texte sont obligatoires, et signalés comme tels. « Publier » sans eux ne publie rien : l'étape à compléter s'encadre de rouge et le curseur s'y place. Les articles sont signés « Yannis » par défaut, quel que soit le compte connecté (`DEFAULT_AUTHOR` dans `lib/admin/store.ts`) ; le champ « Auteur », sous « Plus d'options », permet de signer autrement ;
- passer à l'éditeur Markdown avancé, avec aperçu en direct. Il s'ouvre d'office pour les articles dont la mise en forme (liens, images, tableaux) ne passerait pas sans perte dans l'éditeur simple — la conversion est dans `components/admin/blocks.ts` ;
- envoyer photos et PDF (15 Mo maximum, contenu vérifié à l'octet près). Les photos de téléphone sont réduites à 2 400 px dans le navigateur avant l'envoi ;
- garder un article en brouillon : il reste listé dans l'admin, invisible sur le site ;
- modifier ou supprimer un article maison ;
- **inviter des membres sans leur écrire de mot de passe** (page « Comptes », réservée aux administrateurs) : chaque invitation produit un lien à usage unique, valable 7 jours, où le membre choisit lui-même son mot de passe. Seule l'empreinte SHA-256 du lien est conservée, dans `data/admin/invitations.json`. Le même mécanisme sert aux mots de passe oubliés, et « Retirer l'accès » ferme aussitôt les sessions ouvertes — chaque requête revérifie le compte (`lib/admin/accounts.ts`, `lib/admin/session.ts`) ;
- limiter les essais de connexion : 5 échecs en 15 minutes bloquent l'identifiant, 20 bloquent l'adresse IP (`lib/admin/throttle.ts`, en mémoire) ;
- **corriger un article repris de WordPress** : l'enregistrement écrit une copie dans `content/actualites/`, qui masque l'original partout sur le site. `content/articles/` n'est jamais modifié, donc une réimportation ne peut rien écraser, et le bouton « Rétablir la version d'origine » efface simplement la copie.

### Contraintes d'hébergement

L'espace admin écrit sur le disque : il lui faut un serveur Node persistant (`pnpm build && pnpm start`), pas une plateforme au système de fichiers en lecture seule. **Les sauvegardes doivent couvrir `content/actualites/`, `public/media/actualites/` et `data/admin/`** : c'est là que vit tout ce qui est publié depuis le site, et ces fichiers n'existent que sur le serveur tant qu'ils ne sont pas rapatriés dans Git.

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
