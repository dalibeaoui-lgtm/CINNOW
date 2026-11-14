import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { CleTraduction, t } from './i18n/langue';
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

// Une route par page du sitemap.
// loadComponent charge chaque page seulement quand on y va (site plus rapide).
export const routes: Routes = [
  { path: '', title: titre('titre.accueil'), loadComponent: () => import('./pages/accueil/accueil').then(m => m.Accueil) },
  { path: 'film/:id', title: titreFilm, loadComponent: () => import('./pages/fiche-film/fiche-film').then(m => m.FicheFilm) },
  { path: 'reservation/:seanceId', title: titreReservation, loadComponent: () => import('./pages/reservation/reservation').then(m => m.Reservation) },
  { path: 'paiement', title: titre('titre.paiement'), loadComponent: () => import('./pages/paiement/paiement').then(m => m.Paiement) },
  { path: 'confirmation', title: titre('titre.confirmation'), loadComponent: () => import('./pages/confirmation/confirmation').then(m => m.Confirmation) },
  { path: 'boutique', title: titre('titre.boutique'), loadComponent: () => import('./pages/boutique/boutique').then(m => m.Boutique) },
  { path: 'contact', title: titre('titre.contact'), loadComponent: () => import('./pages/contact/contact').then(m => m.Contact) },
  { path: 'mon-compte', title: titre('titre.monCompte'), loadComponent: () => import('./pages/mon-compte/mon-compte').then(m => m.MonCompte) },
  { path: '**', redirectTo: '' }, // adresse inconnue : retour à l'accueil
];
