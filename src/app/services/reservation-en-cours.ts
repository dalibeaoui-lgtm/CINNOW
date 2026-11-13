import { Injectable, effect, signal } from '@angular/core';
import { Reservation } from '../models/reservation';
import { ecrireStockage, lireStockage } from '../utils/stockage';

const CLE = 'cinnow-reservation-en-cours-v2';

// Garde la réservation en cours entre les pages Réservation → Paiement.
// Un seul exemplaire de ce service existe dans tout le site (providedIn: 'root').
// Elle est aussi gardée dans le navigateur, pour survivre à un rechargement de la page Paiement.
@Injectable({ providedIn: 'root' })
export class ReservationEnCours {
  readonly reservation = signal<Reservation | null>(lireStockage<Reservation | null>(CLE, null));

  constructor() {
    effect(() => ecrireStockage(CLE, this.reservation()));
  }

  enregistrer(reservation: Reservation): void {
    this.reservation.set(reservation);
  }

  vider(): void {
    this.reservation.set(null);
  }
}
