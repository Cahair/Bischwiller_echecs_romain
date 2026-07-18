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

## Structure du site

- `app/` : routes Next.js, actualités et pages internes ;
- `components/home/` : hero et sections de la page d'accueil ;
- `components/layout/` : navigation et pied de page ;
- `components/pages/` : rendu des pages éditoriales ;
- `scripts/wordpress/` : pipeline d'import reproductible ;
- `assets/video/` : vidéo source originale ;
- `public/videos/` : version web optimisée et poster.

## Vérifications

```bash
pnpm lint
pnpm build
```
