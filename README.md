# CINNOW

Site de cinéma : découvrir les films à l'affiche, regarder leur bande-annonce, réserver sa place,
commander ses snacks à l'avance, puis noter le film et le service.

Projet Web — SUP'COM, Groupe 5 : Mouhamed Ali BEAOUI, Ghassen BENKAJI.
Encadrante : Dr. Maroua Nouioua.

## Lancer le projet

Il faut [Node.js](https://nodejs.org) (version 20 ou plus).

```bash
npm install     # installe les dépendances du site ET du serveur (une seule fois)
npm run dev     # lance le serveur (port 3000) et le site (http://localhost:4200) ensemble
```

On peut aussi les lancer séparément, dans deux terminaux : `npm run api` puis `npm start`.
Pour créer la version de production : `npm run build` (le résultat va dans `dist/`).

**Pour tester sans vraies données :** tapez `admin` dans les champs de paiement, et `admin` / `admin`
pour vous connecter dans « Mon compte ».

## Choix du framework

**Angular (TypeScript)**, imposé pour le projet. Il nous apporte :

- des **composants** réutilisables (carte film, en-tête, pied de page) ;
- le **routage** entre les pages, avec chargement de chaque page seulement quand on y va ;
- les **signals** pour gérer l'état (places choisies, compte connecté…) ;
- les **formulaires** (connexion, profil, avis).

Pas de librairie de style : tout est en SCSS, avec la palette de la charte graphique (rapport Objectif 2).

**Node.js + Express** pour le serveur : le même langage (JavaScript) que le site, et une seule
dépendance (`express`).

## Fonctionnalités

| Page | Adresse | Ce qu'on peut faire |
|---|---|---|
| Accueil | `/` | Films à la une en plein écran (parallaxe), films à l'affiche, prochaines sorties |
| Fiche film | `/film/:id` | Bande-annonce YouTube, séances des 7 prochains jours, synopsis, avis des spectateurs |
| Réservation | `/reservation/:seanceId` | Choix des places sur le plan de la salle, snacks en option, total en dinars |
| Paiement | `/paiement` | Carte bancaire, e-Dinar ou au comptoir ; vérification des champs ; récapitulatif |
| Confirmation | `/confirmation` | E-billet avec QR code, téléchargement en PDF, ajout au calendrier (.ics) |
| Boutique | `/boutique` | Filtres par catégorie, panier (gardé dans le navigateur), commande à retirer au comptoir |
| Mon compte | `/mon-compte` | Connexion / inscription, e-billets, commandes, notation des films vus, profil |

Parcours complet : fiche film → séance → places et snacks → paiement → confirmation → « Mes billets ».

**Paiement simulé :** aucun argent n'est débité et les données de carte ne sont ni envoyées ni
enregistrées. Il sera remplacé par Stripe en mode test.

Le site s'adapte à l'ordinateur, à la tablette et au téléphone.

**Deux langues, français et anglais :** le petit bouton rond « FR / EN » du menu change la langue de
tout le site (textes, dates, prix, titres et synopsis des films, produits). Les textes sont dans
`src/app/i18n/fr.ts` et `en.ts` ; dans le HTML, on écrit `{{ 'menu.films' | t }}`. Les traductions
des films et des produits sont envoyées par le serveur (champ `traductions` des fichiers JSON).

## Backend (Node.js + Express)

Le dossier `backend/` contient une petite **API REST**. Le site lui demande les films, les séances,
les produits et les avis, et lui envoie les réservations, les commandes et les nouveaux avis.

| Méthode | Adresse | Rôle |
|---|---|---|
| GET | `/api/films`, `/api/films/:id` | Films |
| GET | `/api/seances`, `/api/seances?filmId=3`, `/api/seances/:id` | Séances, avec les places occupées |
| GET | `/api/produits` | Snacks, boissons, posters |
| GET | `/api/salle` | Plan de la salle et prix d'une place |
| GET | `/api/avis`, `/api/avis?filmId=3` | Avis des spectateurs |
| POST | `/api/reservations` | Réserver des places (refusé avec le code 409 si une place est déjà prise) |
| POST | `/api/commandes` | Commander à la boutique |
| POST | `/api/avis` | Publier un avis (notes de 1 à 5 vérifiées) |

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

- **Site (44 tests)** : fonctions de mise en forme (dates, prix, durées), traductions FR / EN,
  panier, barre des étapes, QR code, barre de recherche, bouton de langue, formulaire de contact.
  Les fichiers de test sont à côté du code qu'ils testent (`*.spec.ts`).
- **Serveur (12 tests)** : catalogue, réservations (prix recalculé, **une place ne peut pas être
  vendue deux fois**), avis et messages de contact refusés quand ils sont invalides.
  Le serveur de test utilise un dossier temporaire : il ne touche pas aux vraies réservations.

## Organisation des dossiers

```
cinnow/
├── backend/               Serveur Node.js + Express (l'API)
│   ├── serveur.js         Point de départ : réglages et liste des routes
│   ├── routes/            Une route par sujet (catalogue, achats, avis)
│   ├── seances.js         Calcul du programme et des places occupées
│   ├── stockage.js        Lecture / écriture des fichiers JSON
│   ├── donnees/           Données de départ (films, produits, avis, salle)
│   └── stockage/          Réservations, commandes et avis créés (non envoyé sur GitHub)
├── public/images/         Images du site
│   ├── affiches/          Affiches verticales des films
│   └── hero/              Grandes photos horizontales
├── src/
│   ├── index.html         Page HTML de départ (polices, titre)
│   ├── styles.scss        Styles communs : palette, textes, boutons
│   └── app/
│       ├── app.routes.ts  Liste des pages et de leurs adresses
│       ├── app.config.ts  Réglages d'Angular (routeur…)
│       ├── pages/         Une page = un dossier (accueil, fiche-film, reservation, mon-compte…)
│       ├── components/    Morceaux réutilisés sur plusieurs pages (header, footer, carte-film, etapes, qr-code)
│       ├── directives/    Comportements ajoutés aux balises (apparition au défilement)
│       ├── services/      Appels à l'API (api, catalogue) et état partagé (compte, panier, avis…)
│       ├── models/        Forme des données (Film, Seance, Avis, Reservation…)
│       ├── data/          Billets de démonstration donnés aux nouveaux comptes
│       ├── i18n/          Traductions : fr.ts, en.ts, langue choisie et filtre « | t »
│       └── utils/         Petites fonctions (formats de date, prix, durée ; stockage ; mode test)
├── proxy.conf.json        En développement, envoie les requêtes /api vers le serveur (port 3000)
├── angular.json, tsconfig*.json, package.json   Configuration (ne pas supprimer)
└── node_modules/          Dépendances installées par npm install (non envoyé sur GitHub)
```

Chaque page ou composant a 3 fichiers : `.ts` (logique), `.html` (structure), `.scss` (style).

**Conventions :** noms de fichiers en minuscules avec des tirets (`fiche-film`, `the-odyssey.jpeg`) ;
code, commentaires et noms de variables en français.
