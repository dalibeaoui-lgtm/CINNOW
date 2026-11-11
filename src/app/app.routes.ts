import { Routes } from '@angular/router';

// Une route par page du sitemap.
// loadComponent charge chaque page seulement quand on y va (site plus rapide).
export const routes: Routes = [
  { path: '', title: 'CINNOW', loadComponent: () => import('./pages/accueil/accueil').then(m => m.Accueil) },
  { path: 'film/:id', title: 'Fiche film — CINNOW', loadComponent: () => import('./pages/fiche-film/fiche-film').then(m => m.FicheFilm) },
  { path: 'reservation/:seanceId', title: 'Réservation — CINNOW', loadComponent: () => import('./pages/reservation/reservation').then(m => m.Reservation) },
  { path: 'paiement', title: 'Paiement — CINNOW', loadComponent: () => import('./pages/paiement/paiement').then(m => m.Paiement) },
  { path: 'confirmation', title: 'Confirmation — CINNOW', loadComponent: () => import('./pages/confirmation/confirmation').then(m => m.Confirmation) },
  { path: 'boutique', title: 'Boutique — CINNOW', loadComponent: () => import('./pages/boutique/boutique').then(m => m.Boutique) },
  { path: 'mon-compte', title: 'Mon compte — CINNOW', loadComponent: () => import('./pages/mon-compte/mon-compte').then(m => m.MonCompte) },
  { path: '**', redirectTo: '' }, // adresse inconnue : retour à l'accueil
];
