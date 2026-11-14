import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { CleTraduction, t } from './i18n/langue';
import { ActualitesService } from './services/actualites';
import { Catalogue } from './services/catalogue';

// Titre de l'onglet du navigateur, dans la langue choisie (calculé à chaque changement de page)
const titre = (cle: CleTraduction): ResolveFn<string> => () => t(cle);

// Titre de l'onglet de la fiche film : le nom du film (ex. « Whiplash — CINNOW »)
const titreFilm: ResolveFn<string> = (route) => {
  const film = inject(Catalogue).film(Number(route.paramMap.get('id')));
  return film ? t('titre.film', { titre: film.titre }) : t('titre.filmIntrouvable');
};

// Titre de l'onglet de la réservation : « Réservation · Whiplash — CINNOW »
const titreReservation: ResolveFn<string> = (route) => {
  const catalogue = inject(Catalogue);
  const film = catalogue.film(catalogue.seance(Number(route.paramMap.get('seanceId')))?.filmId);
  return film ? t('titre.reservation', { titre: film.titre }) : t('titre.seanceIntrouvable');
};

// Titre de l'onglet d'un article : son titre. On attend les articles (demandés au serveur
// la première fois), ce qui garantit aussi que la page s'affiche avec son contenu.
const titreArticle: ResolveFn<string> = async (route) => {
  const actualites = inject(ActualitesService);
  await actualites.charger();
  const article = actualites.article(Number(route.paramMap.get('id')));
  return article ? t('titre.article', { titre: article.titre }) : t('titre.articleIntrouvable');
};

// Une route par page du sitemap.
// loadComponent charge chaque page seulement quand on y va (site plus rapide).
export const routes: Routes = [
  { path: '', title: titre('titre.accueil'), loadComponent: () => import('./pages/accueil/accueil').then(m => m.Accueil) },
  { path: 'film/:id', title: titreFilm, loadComponent: () => import('./pages/fiche-film/fiche-film').then(m => m.FicheFilm) },
  { path: 'reservation/:seanceId', title: titreReservation, loadComponent: () => import('./pages/reservation/reservation').then(m => m.Reservation) },
  { path: 'paiement', title: titre('titre.paiement'), loadComponent: () => import('./pages/paiement/paiement').then(m => m.Paiement) },
  { path: 'confirmation', title: titre('titre.confirmation'), loadComponent: () => import('./pages/confirmation/confirmation').then(m => m.Confirmation) },
  { path: 'boutique', title: titre('titre.boutique'), loadComponent: () => import('./pages/boutique/boutique').then(m => m.Boutique) },
  { path: 'a-propos', title: titre('titre.aPropos'), loadComponent: () => import('./pages/a-propos/a-propos').then(m => m.APropos) },
  { path: 'actualites', title: titre('titre.actualites'), loadComponent: () => import('./pages/actualites/actualites').then(m => m.Actualites) },
  { path: 'actualites/:id', title: titreArticle, loadComponent: () => import('./pages/article/article').then(m => m.Article) },
  { path: 'faq', title: titre('titre.faq'), loadComponent: () => import('./pages/faq/faq').then(m => m.Faq) },
  { path: 'contact', title: titre('titre.contact'), loadComponent: () => import('./pages/contact/contact').then(m => m.Contact) },
  { path: 'mon-compte', title: titre('titre.monCompte'), loadComponent: () => import('./pages/mon-compte/mon-compte').then(m => m.MonCompte) },
  { path: '**', redirectTo: '' }, // adresse inconnue : retour à l'accueil
];
