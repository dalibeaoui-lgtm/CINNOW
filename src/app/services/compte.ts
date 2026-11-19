import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { billetsDeDemo } from '../data/billets-exemple';
import { Catalogue } from './catalogue';
import { Commande } from '../models/commande';
import { Reservation } from '../models/reservation';
import { Utilisateur } from '../models/utilisateur';
import { ecrireStockage, lireStockage } from '../utils/stockage';

// Ce qui est gardé dans le navigateur
interface DonneesCompte {
  utilisateur: Utilisateur;
  billets: Reservation[];
  commandes?: Commande[]; // « ? » : les comptes créés avant la boutique n'en ont pas
  connecte: boolean;
}

// « v2 » : depuis le serveur, les numéros de séance ont changé ; les anciens comptes sont ignorés
const CLE = 'cinnow-compte-v2';

// Compte du spectateur : connexion, profil et billets.
// ⚠ Connexion simulée : aucun mot de passe n'est vérifié ni enregistré.
// Elle sera remplacée par le backend (JWT + bcrypt, voir le rapport, partie 4).
@Injectable({ providedIn: 'root' })
export class Compte {
  private readonly catalogue = inject(Catalogue);
  private readonly donnees = signal<DonneesCompte | null>(lireStockage<DonneesCompte | null>(CLE, null));

  readonly utilisateur = computed(() => {
    const donnees = this.donnees();
    return donnees?.connecte ? donnees.utilisateur : null;
  });

  readonly billets = computed(() => (this.utilisateur() ? this.donnees()!.billets : []));
  readonly commandes = computed(() => (this.utilisateur() ? (this.donnees()!.commandes ?? []) : []));

  constructor() {
    // À chaque changement, on enregistre le compte dans le navigateur
    effect(() => ecrireStockage(CLE, this.donnees()));
  }

  connexion(email: string): void {
    const donnees = this.donnees();
    if (donnees && donnees.utilisateur.email === email) {
      this.donnees.set({ ...donnees, connecte: true });
    } else {
      // Compte inconnu : on en crée un, avec un prénom tiré de l'e-mail (« sarra.m@… » → « Sarra »)
      const prenom = email.split(/[@._-]/)[0];
      this.creer({ prenom: prenom.charAt(0).toUpperCase() + prenom.slice(1), nom: '', email });
    }
  }

  inscription(prenom: string, nom: string, email: string): void {
    this.creer({ prenom, nom, email });
  }

  deconnexion(): void {
    this.donnees.update((donnees) => (donnees ? { ...donnees, connecte: false } : null));
  }

  modifierProfil(utilisateur: Utilisateur): void {
    this.donnees.update((donnees) => (donnees ? { ...donnees, utilisateur } : null));
  }

  // Après le paiement : range le billet dans « Mes billets » (seulement si quelqu'un est connecté)
  ajouterBillet(billet: Reservation): void {
    if (!this.utilisateur()) return;
    this.donnees.update((donnees) => (donnees ? { ...donnees, billets: [billet, ...donnees.billets] } : null));
  }

  // Réservation annulée : le billet disparaît de « Mes billets »
  retirerBillet(id: number): void {
    this.donnees.update((donnees) => (donnees ? { ...donnees, billets: donnees.billets.filter((b) => b.id !== id) } : null));
  }

  // Après le paiement d'une commande de la boutique : la range dans « Mes commandes »
  ajouterCommande(commande: Commande): void {
    if (!this.utilisateur()) return;
    this.donnees.update((donnees) =>
      donnees ? { ...donnees, commandes: [commande, ...(donnees.commandes ?? [])] } : null,
    );
  }

  private creer(infos: Pick<Utilisateur, 'prenom' | 'nom' | 'email'>): void {
    this.donnees.set({
      utilisateur: { ...infos, telephone: '', versionPreferee: 'peu-importe', newsletter: false },
      billets: billetsDeDemo(this.catalogue.seances(), this.catalogue.produits(), this.catalogue.salle().prixPlace),
      commandes: [],
      connecte: true,
    });
  }
}
