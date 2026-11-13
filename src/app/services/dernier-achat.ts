import { Injectable, effect, signal } from '@angular/core';
import { Commande } from '../models/commande';
import { Reservation } from '../models/reservation';
import { ecrireStockage, lireStockage } from '../utils/stockage';

export type MoyenPaiement = 'carte' | 'e-dinar' | 'comptoir';

// Ce que la page Confirmation affiche : une réservation de séance OU une commande de la boutique
export type Achat = { email: string; moyen: MoyenPaiement } & (
  | { type: 'reservation'; reservation: Reservation }
  | { type: 'commande'; commande: Commande }
);

const CLE = 'cinnow-dernier-achat-v2';

// Garde le dernier achat payé, pour la page Confirmation (même après un rechargement).
@Injectable({ providedIn: 'root' })
export class DernierAchat {
  readonly achat = signal<Achat | null>(lireStockage<Achat | null>(CLE, null));

  constructor() {
    effect(() => ecrireStockage(CLE, this.achat()));
  }

  enregistrer(achat: Achat): void {
    this.achat.set(achat);
  }
}
