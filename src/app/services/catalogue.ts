import { Injectable, computed, inject, signal } from '@angular/core';
import { langueActive } from '../i18n/langue';
import { Film } from '../models/film';
import { Produit } from '../models/produit';
import { Salle } from '../models/salle';
import { Seance } from '../models/seance';
import { Api } from './api';

// Films, séances, produits et plan de salle, chargés depuis le serveur au démarrage du site
// (voir provideAppInitializer dans app.config.ts). Les pages les lisent ici, sans attendre.
@Injectable({ providedIn: 'root' })
export class Catalogue {
  private readonly api = inject(Api);

  // Données telles qu'envoyées par le serveur (textes en français + traductions anglaises)
  private readonly filmsBruts = signal<Film[]>([]);
  private readonly produitsBruts = signal<Produit[]>([]);

  // Films et produits dans la langue choisie : en anglais, on remplace titre, genre, synopsis,
  // nom et description par leur traduction (s'il y en a une). Change tout seul avec la langue.
  readonly films = computed(() => {
    const anglais = langueActive() === 'en';
    return this.filmsBruts().map((film) => (anglais ? { ...film, ...film.traductions?.en } : film));
  });
  readonly produits = computed(() => {
    const anglais = langueActive() === 'en';
    return this.produitsBruts().map((produit) => (anglais ? { ...produit, ...produit.traductions?.en } : produit));
  });

  readonly seances = signal<Seance[]>([]);
  readonly salle = signal<Salle>({ rangees: [], placesParRangee: 0, alleesApres: [], prixPlace: 0, maxPlaces: 0 });

  // 'erreur' : le serveur ne répond pas (le site affiche alors un bandeau)
  readonly etat = signal<'chargement' | 'pret' | 'erreur'>('chargement');

  async charger(): Promise<void> {
    try {
      const [films, seances, produits, salle] = await Promise.all([
        this.api.films(),
        this.api.seances(),
        this.api.produits(),
        this.api.salle(),
      ]);
      this.filmsBruts.set(films);
      this.seances.set(seances);
      this.produitsBruts.set(produits);
      this.salle.set(salle);
      this.etat.set('pret');
    } catch {
      this.etat.set('erreur');
    }
  }

  film(id: number | undefined): Film | undefined {
    return this.films().find((f) => f.id === id);
  }

  seance(id: number | undefined): Seance | undefined {
    return this.seances().find((s) => s.id === id);
  }

  // Nom d'un produit dans la langue choisie. Utile pour les produits gardés dans le panier
  // ou dans un billet : ils ont été enregistrés avec le nom de l'époque (souvent en français).
  nomProduit(produit: Produit): string {
    return this.produits().find((p) => p.id === produit.id)?.nom ?? produit.nom;
  }

  // Redemande une séance au serveur, pour avoir les places prises par les autres spectateurs
  // depuis le chargement du site (appelé en ouvrant la page Réservation)
  async actualiserSeance(id: number): Promise<void> {
    try {
      const aJour = await this.api.seance(id);
      this.seances.update((seances) => seances.map((s) => (s.id === id ? aJour : s)));
    } catch {
      // séance inconnue ou serveur arrêté : on garde ce qu'on avait
    }
  }
}
