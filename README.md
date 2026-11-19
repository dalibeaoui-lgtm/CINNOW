# CINNOW

Site de cinéma : découvrir les films à l'affiche, regarder leur bande-annonce, réserver sa place,
commander ses snacks à l'avance, puis noter le film et le service.

Projet Web — SUP'COM, Groupe 5 : Mouhamed Ali BEAOUI, Ghassen BENKAJI.

## Lancer le projet

Il faut [Node.js](https://nodejs.org) (version 20 ou plus).

```bash
npm install     # installe les dépendances du site ET du serveur (une seule fois)
npm run dev     # lance le serveur (port 3000) et le site (http://localhost:4200) ensemble
```

On peut aussi les lancer séparément, dans deux terminaux : `npm run api` puis `npm start`.
Pour créer la version de production : `npm run build` (le résultat va dans `dist/`).

```bash
npm run lint           # vérifie le code avec ESLint (erreurs, imports inutiles, accessibilité des templates)
npm run format:check   # vérifie la mise en forme avec Prettier
```

**Pour tester sans vraies données :** tapez `admin` dans les champs de paiement, et `admin` / `admin`
pour vous connecter dans « Mon compte ».

## Choix du framework

**Angular (TypeScript)**. Il nous apporte :

- des **composants** réutilisables (carte film, en-tête, pied de page) ;
- le **routage** entre les pages, avec chargement de chaque page seulement quand on y va ;
- les **signals** pour gérer l'état (places choisies, compte connecté…) ;
- les **formulaires** (connexion, profil, avis).

Tout est en SCSS, avec la palette de la charte graphique (rapport Objectif 2).

**Node.js + Express** pour le serveur : le même langage (JavaScript) que le site, et une seule
dépendance (`express`).

### Dépendances

| Outil | Version | Rôle |
|---|---|---|
| Angular (`@angular/*`) | 21 | Framework du site : composants, routage, formulaires, requêtes HTTP |
| TypeScript | 5.9 | Langage du site (JavaScript avec des types vérifiés) |
| RxJS | 7.8 | Utilisé par Angular pour les requêtes HTTP |
| Express | 5 | Serveur de l'API (`backend/`) |
| concurrently | 9 | Lance le site et le serveur avec une seule commande (`npm run dev`) |
| Vitest + jsdom | 4 / 28 | Tests du site |
| Prettier | 3 | Mise en forme automatique du code |
| ESLint + angular-eslint | 10 / 21 | Vérification du code TypeScript et des templates (dont les règles d'accessibilité) |

Aucune librairie de style ni d'animation : tout est écrit en SCSS et en TypeScript.

## Fonctionnalités

| Page | Adresse | Ce qu'on peut faire |
|---|---|---|
| Accueil | `/` | Films à la une en plein écran (parallaxe), films à l'affiche, prochaines sorties |
| Fiche film | `/film/:id` | Bande-annonce YouTube, séances des 7 prochains jours, synopsis, avis des spectateurs |
| Réservation | `/reservation/:seanceId` | Choix des places sur le plan de la salle, snacks en option, total en dinars |
| Paiement | `/paiement` | Carte bancaire, e-Dinar ou au comptoir ; vérification des champs ; récapitulatif |
| Confirmation | `/confirmation` | E-billet avec QR code, téléchargement en PDF, ajout au calendrier (.ics) |
| Boutique | `/boutique` | Filtres par catégorie, panier (gardé dans le navigateur), commande à retirer au comptoir |
| Mon compte | `/mon-compte` | Connexion / inscription, e-billets, **annulation d'une réservation** (jusqu'à 2 h avant), commandes, notation des films vus, **modification et suppression de ses avis**, profil |
| Actualités | `/actualites` | Article à la une, liste des articles, filtre par thème |
| Article | `/actualites/:id` | Texte complet, lien vers le film concerné, 3 autres articles à lire |
| À propos | `/a-propos` | Histoire du cinéma, salles et équipements, tarifs et abonnements, horaires |
| FAQ | `/faq` | Questions fréquentes rangées par thème, qui s'ouvrent au clic |
| Contact | `/contact` | Formulaire de contact (vérifié puis envoyé au serveur), coordonnées, plan d'accès |

Parcours complet : fiche film → séance → places et snacks → paiement → confirmation → « Mes billets ».

**Barre de recherche** (dans le menu, sur toutes les pages) : les films s'affichent pendant la frappe,
par titre, réalisateur ou genre, sans tenir compte des accents ; flèches ↑ ↓ et Entrée pour ouvrir
la fiche du film.

**Paiement simulé :** aucun argent n'est débité et les données de carte ne sont ni envoyées ni
enregistrées. Il sera remplacé par Stripe en mode test.

Le site s'adapte à l'ordinateur, à la tablette et au téléphone. Sur téléphone, les liens du menu sont
remplacés par un **bouton ☰** qui ouvre un panneau plein écran (toutes les pages + recherche de films) ;
il se ferme avec ✕, Échap ou en choisissant une page.

**États de chargement :** rien ne reste figé ou vide pendant que le site attend le serveur.

| Attente | Ce qui s'affiche |
|---|---|
| Démarrage du site (films et avis demandés au serveur) | Logo CINNOW traversé par un reflet doré |
| Passage d'une page à l'autre | Fine barre dorée en haut de l'écran (seulement si la page met plus de 0,12 s) |
| Liste des actualités | Squelettes : cartes grises à la forme des vrais articles |
| Plan de salle | « Vérification des places libres… » + spinner, plan estompé |
| Payer, envoyer un message, publier / modifier un avis, annuler | Spinner dans le bouton (et pas de double clic) |

Ces états sont annoncés aux lecteurs d'écran (`role="status"`, `aria-busy`).

**Deux langues, français et anglais :** le petit bouton rond « FR / EN » du menu change la langue de
tout le site (textes, dates, prix, titres et synopsis des films, produits). Les textes sont dans
`src/app/i18n/fr.ts` et `en.ts` ; dans le HTML, on écrit `{{ 'menu.films' | t }}`. Les traductions
des films et des produits sont envoyées par le serveur (champ `traductions` des fichiers JSON).

## Backend (Node.js + Express)

Le dossier `backend/` contient une petite **API REST**. Le site lui demande les films, les séances,
les produits, les avis et les actualités ; il lui envoie les réservations, les commandes et les avis,
et peut aussi **les modifier ou les supprimer** (affichage, création et mise à jour des données).

| Méthode | Adresse | Rôle |
|---|---|---|
| GET | `/api/films`, `/api/films/:id` | Films |
| GET | `/api/seances`, `/api/seances?filmId=3`, `/api/seances/:id` | Séances, avec les places occupées |
| GET | `/api/produits` | Snacks, boissons, posters |
| GET | `/api/salle` | Plan de la salle et prix d'une place |
| GET | `/api/avis`, `/api/avis?filmId=3` | Avis des spectateurs |
| GET | `/api/actualites`, `/api/actualites/:id` | Articles des Actualités |
| POST | `/api/reservations` | Réserver des places (refusé avec le code 409 si une place est déjà prise) |
| POST | `/api/commandes` | Commander à la boutique |
| POST | `/api/avis` | Publier un avis (notes de 1 à 5 vérifiées) |
| POST | `/api/messages` | Envoyer un message depuis la page Contact (champs vérifiés) |
| DELETE | `/api/reservations/:id` | Annuler une réservation : ses places redeviennent libres (refusé moins de 2 h avant la séance) |
| PUT | `/api/avis/:id` | Modifier ses notes et son commentaire |
| DELETE | `/api/avis/:id` | Supprimer son avis |

Pour modifier ou supprimer un avis, le site envoie le numéro du billet de la séance notée : seul son
propriétaire le connaît. Les avis d'exemple, sans billet, ne peuvent pas être modifiés.

Le serveur **vérifie tout** ce que le site lui envoie et **calcule lui-même les prix** : on ne peut ni
réserver une place déjà vendue, ni changer un prix en modifiant la page.

Les données de départ sont dans `backend/donnees/*.json`. Ce que les visiteurs créent est enregistré
dans `backend/stockage/*.json` (créé au premier lancement, non envoyé sur GitHub). Prochaine étape
prévue : remplacer ces fichiers par PostgreSQL, et la connexion simulée par JWT + bcrypt.

Le compte (profil, liste de billets) et le panier restent gardés dans le navigateur (`localStorage`).

## Tests

```bash
npm test            # tests du site (Angular + Vitest), relancés à chaque modification
npm run test:api    # tests du serveur (outil de test intégré à Node.js)
npm run test:tout   # les deux, une seule fois
```

- **Site (56 tests)** : fonctions de mise en forme (dates, prix, durées, photos), traductions FR / EN,
  panier, barre des étapes, QR code, barre de recherche, bouton de langue, menu du téléphone,
  barre de chargement, formulaire de contact, modification et suppression des avis.
  Les fichiers de test sont à côté du code qu'ils testent (`*.spec.ts`).
- **Serveur (16 tests)** : catalogue et actualités, réservations (prix recalculé, **une place ne peut
  pas être vendue deux fois**, annulation qui libère les places, refusée moins de 2 h avant),
  avis (modifiables seulement avec le bon billet) et messages de contact refusés quand ils sont invalides.
  Le serveur de test utilise un dossier temporaire : il ne touche pas aux vraies réservations.

## Accessibilité

Audit fait avec **axe-core** (règles WCAG 2.1 niveaux A et AA) sur **19 écrans : aucune erreur**.
Les 10 pages, plus les états qui n'apparaissent qu'après une action : réponses de la FAQ ouvertes,
squelettes de chargement, confirmation d'annulation, formulaire de notation, modification et
suppression d'un avis, et sur téléphone le menu ☰ ouvert et sa recherche. ESLint vérifie aussi
les règles d'accessibilité des templates à chaque `npm run lint`.

- Contrastes : textes d'aide en `--gris-doux` (5,4:1 sur blanc) ; bouton « Réserver » sur les photos
  de l'accueil avec un fond sombre flouté (au moins 8,6:1, mesuré sur les photos de tous les films).
- Balises sémantiques (`header`, `nav`, `main`, `section`, `article`…), textes pour lecteurs d'écran
  (`aria-label`, `visuellement-cache`), navigation au clavier (recherche, plan de salle, onglets).
- Les animations s'arrêtent si l'ordinateur est réglé sur « réduire les animations ».

## Performance et qualité du code

Scores **Lighthouse** de la version de production (`npm run build`), servie avec compression comme
chez un hébergeur :

| Page | Performance (ordinateur) | Performance (téléphone) | Accessibilité | Bonnes pratiques | SEO |
|---|---|---|---|---|---|
| Accueil | 96 | 80 | 100 | 100 | 100 |
| Fiche film | 94 | — | 100 | 100 | 100 |
| Actualités | 96 | 89 | 100 | 100 | 100 |
| Boutique | 100 | — | 100 | 100 | 100 |
| FAQ | 100 | 92 | 100 | 100 | 100 |
| Contact | 99 | — | 100 | 100 | 100 |

Le mode « téléphone » simule un téléphone moyen en 4G lente : l'accueil y est plus lent à cause de
sa grande photo plein écran.

Ce qui a été fait pour y arriver :

- **Images** en WebP (affiches converties depuis le JPEG, photos recompressées) : 3,9 Mo → 2,6 Mo.
  Chaque photo de film existe aussi en 800 px (`hero/800/`) : les cartes et les bandeaux la
  chargent à la place de la version 1920 px (`srcset`), 5 à 10 fois plus légère.
- **Chargement à la demande** : chaque page est un morceau de code séparé, téléchargé seulement
  quand on l'ouvre (`loadComponent`) ; les images hors de l'écran attendent d'être proches
  (`loading="lazy"`) ; la photo principale d'une page est chargée en priorité (`fetchpriority`).
- **Pas de décalage de mise en page** : toutes les images ont leurs dimensions, et la zone des pages
  fait au moins la hauteur de l'écran (sinon le pied de page sautait à l'arrivée de chaque page).
- **Code** : ESLint (`npm run lint`) ne signale plus aucune erreur ; Prettier est configuré
  (`npm run format:check`) ; code commenté en français.

## Organisation des dossiers

```
cinnow/
├── backend/               Serveur Node.js + Express (l'API)
│   ├── serveur.js         Point de départ : réglages et liste des routes
│   ├── routes/            Une route par sujet (catalogue, achats, avis, contact)
│   ├── seances.js         Calcul du programme et des places occupées
│   ├── stockage.js        Lecture / écriture des fichiers JSON
│   ├── tests/             Tests de l'API
│   ├── donnees/           Données de départ (films, produits, avis, actualités, salle)
│   └── stockage/          Réservations, commandes, avis et messages créés (non envoyé sur GitHub)
├── public/images/         Images du site
│   ├── affiches/          Affiches verticales des films
│   ├── hero/              Grandes photos horizontales (1920 px)
│   │   └── 800/           Les mêmes en 800 px, pour les cartes et les bandeaux
│   └── produits/          Snacks, boissons et posters de la boutique
├── src/
│   ├── index.html         Page HTML de départ (polices, titre)
│   ├── styles.scss        Styles communs : palette, textes, boutons
│   └── app/
│       ├── app.routes.ts  Liste des pages et de leurs adresses
│       ├── app.config.ts  Réglages d'Angular (routeur…)
│       ├── pages/         Une page = un dossier (12 pages : accueil, fiche-film, reservation, contact…)
│       ├── components/    Morceaux réutilisés sur plusieurs pages (header, footer, carte-film,
│       │                  carte-actualite, etapes, qr-code, fond-films, barre-navigation)
│       ├── directives/    Comportements ajoutés aux balises (apparition au défilement)
│       ├── services/      Appels à l'API (api, catalogue) et état partagé (compte, panier, avis…)
│       ├── models/        Forme des données (Film, Seance, Avis, Reservation…)
│       ├── data/          Billets de démonstration donnés aux nouveaux comptes
│       ├── i18n/          Traductions : fr.ts, en.ts, langue choisie et filtre « | t »
│       └── utils/         Petites fonctions (formats de date, prix, durée ; tailles des photos ;
│                          stockage ; mode test)
├── proxy.conf.json        En développement, envoie les requêtes /api vers le serveur (port 3000)
├── eslint.config.js, .prettierrc   Règles d'ESLint et de Prettier
├── angular.json, tsconfig*.json, package.json   Configuration (ne pas supprimer)
└── node_modules/          Dépendances installées par npm install (non envoyé sur GitHub)
```

Chaque page ou composant a 3 fichiers : `.ts` (logique), `.html` (structure), `.scss` (style).

**Conventions :** noms de fichiers en minuscules avec des tirets (`fiche-film`, `the-odyssey.webp`) ;
code, commentaires et noms de variables en français.
