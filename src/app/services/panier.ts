import { Injectable, computed, effect, signal } from '@angular/core';
import { LigneProduit, Produit } from '../models/produit';
import { ecrireStockage, lireStockage } from '../utils/stockage';

const CLE = 'cinnow-panier';
const MAX_PAR_PRODUIT = 10;

// Panier de la boutique (snacks, boissons, posters), gardé dans le navigateur.
@Injectable({ providedIn: 'root' })
export class Panier {
  private readonly lignesModifiables = signal<LigneProduit[]>(lireStockage<LigneProduit[]>(CLE, []));

  readonly lignes = this.lignesModifiables.asReadonly();
  readonly nombre = computed(() => this.lignes().reduce((somme, l) => somme + l.quantite, 0));
  readonly total = computed(() => this.lignes().reduce((somme, l) => somme + l.produit.prix * l.quantite, 0));

  constructor() {
    effect(() => ecrireStockage(CLE, this.lignes()));
  }

  quantite(idProduit: number): number {
    return this.lignes().find((l) => l.produit.id === idProduit)?.quantite ?? 0;
  }

  ajouter(produit: Produit): void {
    this.changerQuantite(produit, 1);
  }

  // ajout = +1 ou -1 ; à 0, le produit sort du panier
  changerQuantite(produit: Produit, ajout: number): void {
    const nouvelle = Math.min(Math.max(this.quantite(produit.id) + ajout, 0), MAX_PAR_PRODUIT);
    this.lignesModifiables.update((lignes) => {
      const autres = lignes.filter((l) => l.produit.id !== produit.id);
      if (nouvelle === 0) return autres;
      const existe = lignes.some((l) => l.produit.id === produit.id);
      return existe
        ? lignes.map((l) => (l.produit.id === produit.id ? { ...l, quantite: nouvelle } : l))
        : [...lignes, { produit, quantite: nouvelle }];
    });
  }

  vider(): void {
    this.lignesModifiables.set([]);
  }
}
