import { Injectable, computed, inject, signal } from '@angular/core';
import { langueActive } from '../i18n/langue';
import { Actualite } from '../models/actualite';
import { Api } from './api';

// Articles de la page Actualités, demandés au serveur la première fois qu'on en a besoin
// (pas au démarrage du site : la plupart des visiteurs n'ouvrent pas cette page).
@Injectable({ providedIn: 'root' })
export class ActualitesService {
  private readonly api = inject(Api);

  private readonly bruts = signal<Actualite[]>([]);
  readonly etat = signal<'chargement' | 'pret' | 'erreur'>('chargement');
  private enCours?: Promise<void>;

  // Articles dans la langue choisie (en anglais : titre, chapô et texte traduits)
  readonly articles = computed(() => {
    const anglais = langueActive() === 'en';
    return this.bruts().map((a) => (anglais ? { ...a, ...a.traductions?.en } : a));
  });

  // Une seule requête, même si plusieurs pages appellent charger() en même temps.
  // En cas d'erreur, l'appel suivant réessaie.
  charger(): Promise<void> {
    this.enCours ??= this.api
      .actualites()
      .then((articles) => {
        this.bruts.set(articles);
        this.etat.set('pret');
      })
      .catch(() => {
        this.etat.set('erreur');
        this.enCours = undefined;
      });
    return this.enCours;
  }

  article(id: number): Actualite | undefined {
    return this.articles().find((a) => a.id === id);
  }
}
