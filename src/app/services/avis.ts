import { Injectable, inject, signal } from '@angular/core';
import { Avis } from '../models/avis';
import { Api } from './api';

// Tous les avis du site, chargés depuis le serveur au démarrage.
// Un avis publié est envoyé au serveur, qui le garde (backend/stockage/avis.json) :
// il est donc visible par tous les visiteurs, pas seulement dans ce navigateur.
@Injectable({ providedIn: 'root' })
export class AvisService {
  private readonly api = inject(Api);

  readonly tous = signal<Avis[]>([]);

  async charger(): Promise<void> {
    try {
      this.tous.set(await this.api.avis());
    } catch {
      // serveur arrêté : pas d'avis (le bandeau d'erreur est déjà affiché par le catalogue)
    }
  }

  // Lance une erreur si le serveur refuse l'avis (note invalide, séance déjà notée…)
  async publier(avis: Omit<Avis, 'id' | 'date'>): Promise<void> {
    const publie = await this.api.publierAvis(avis);
    this.tous.update((liste) => [publie, ...liste]);
  }

  // Nouvelles notes et nouveau commentaire : la fiche du film affiche aussitôt la nouvelle version
  async modifier(
    avis: Avis,
    modifications: Pick<Avis, 'noteFilm' | 'noteService' | 'commentaire'>,
  ): Promise<void> {
    const aJour = await this.api.modifierAvis(avis.id, {
      ...modifications,
      billetId: avis.billetId!,
    });
    this.tous.update((liste) => liste.map((a) => (a.id === aJour.id ? aJour : a)));
  }

  async supprimer(avis: Avis): Promise<void> {
    await this.api.supprimerAvis(avis.id, avis.billetId!);
    this.tous.update((liste) => liste.filter((a) => a.id !== avis.id));
  }
}
