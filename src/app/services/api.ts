import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { langueActive, t } from '../i18n/langue';
import { Actualite } from '../models/actualite';
import { Avis } from '../models/avis';
import { Commande } from '../models/commande';
import { Film } from '../models/film';
import { Produit } from '../models/produit';
import { Reservation } from '../models/reservation';
import { Salle } from '../models/salle';
import { Seance } from '../models/seance';

// Adresse de l'API. En développement, « ng serve » redirige /api vers http://localhost:3000
// (voir proxy.conf.json), donc le site et l'API semblent être au même endroit.
const API = '/api';

// Toutes les requêtes vers le serveur CINNOW (dossier backend/).
// Chaque méthode renvoie une Promise : on peut l'utiliser avec « await ».
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  // ---------- Lecture ----------
  films() {
    return firstValueFrom(this.http.get<Film[]>(`${API}/films`));
  }

  seances() {
    return firstValueFrom(this.http.get<Seance[]>(`${API}/seances`));
  }

  seance(id: number) {
    return firstValueFrom(this.http.get<Seance>(`${API}/seances/${id}`));
  }

  produits() {
    return firstValueFrom(this.http.get<Produit[]>(`${API}/produits`));
  }

  salle() {
    return firstValueFrom(this.http.get<Salle>(`${API}/salle`));
  }

  actualites() {
    return firstValueFrom(this.http.get<Actualite[]>(`${API}/actualites`));
  }

  avis() {
    return firstValueFrom(this.http.get<Avis[]>(`${API}/avis`));
  }

  // ---------- Écriture ----------
  // On envoie seulement les numéros (séance, produits) : le serveur vérifie tout et calcule le prix.
  creerReservation(demande: {
    seanceId: number;
    places: string[];
    snacks: { produitId: number; quantite: number }[];
  }) {
    return firstValueFrom(this.http.post<Reservation>(`${API}/reservations`, demande));
  }

  creerCommande(articles: { produitId: number; quantite: number }[]) {
    return firstValueFrom(this.http.post<Commande>(`${API}/commandes`, { articles }));
  }

  publierAvis(avis: Omit<Avis, 'id' | 'date'>) {
    return firstValueFrom(this.http.post<Avis>(`${API}/avis`, avis));
  }

  // ---------- Mise à jour et suppression ----------
  // Le serveur libère les places et renvoie le montant remboursé (refuse moins de 2 h avant la séance)
  annulerReservation(id: number) {
    return firstValueFrom(
      this.http.delete<{ annulee: number; rembourse: number }>(`${API}/reservations/${id}`),
    );
  }

  // billetId : prouve que l'avis est bien le sien (voir backend/routes/avis.js)
  modifierAvis(
    id: number,
    modifications: Pick<Avis, 'noteFilm' | 'noteService' | 'commentaire'> & { billetId: number },
  ) {
    return firstValueFrom(this.http.put<Avis>(`${API}/avis/${id}`, modifications));
  }

  supprimerAvis(id: number, billetId: number) {
    return firstValueFrom(this.http.delete<void>(`${API}/avis/${id}`, { body: { billetId } }));
  }

  // Formulaire de la page Contact
  envoyerMessage(message: { nom: string; email: string; sujet: string; message: string }) {
    return firstValueFrom(this.http.post<{ id: number }>(`${API}/messages`, message));
  }
}

// Message lisible (dans la langue choisie) à partir d'une erreur de requête.
// Les messages du serveur sont en français : on traduit ici les cas les plus courants.
export function messageErreur(erreur: unknown): string {
  if (erreur instanceof HttpErrorResponse) {
    if (erreur.status === 0 || erreur.status >= 502) return t('err.serveur');
    if (erreur.status === 409 && Array.isArray(erreur.error?.placesPrises)) {
      return t('err.placesPrises', { places: erreur.error.placesPrises.join(', ') });
    }
    if (erreur.error?.message && langueActive() === 'fr') return erreur.error.message;
  }
  return t('err.generique');
}
