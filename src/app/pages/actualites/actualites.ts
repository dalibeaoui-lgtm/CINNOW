import { Component, computed, inject, signal } from '@angular/core';
import { CarteActualite } from '../../components/carte-actualite/carte-actualite';
import { Apparition } from '../../directives/apparition';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Actualite } from '../../models/actualite';
import { ActualitesService } from '../../services/actualites';

type Categorie = Actualite['categorie'];

// Page Actualités (sitemap) : l'article à la une en grand, puis tous les autres,
// avec un filtre par thème. Les articles viennent du serveur (GET /api/actualites).
@Component({
  selector: 'app-actualites',
  imports: [CarteActualite, Apparition, Traduction],
  templateUrl: './actualites.html',
  styleUrl: './actualites.scss',
})
export class Actualites {
  private readonly service = inject(ActualitesService);
  protected readonly etat = this.service.etat;

  protected readonly categories: { id: Categorie; libelle: CleTraduction }[] = [
    { id: 'avant-premiere', libelle: 'actu.cat.avant-premiere' },
    { id: 'evenement', libelle: 'actu.cat.evenement' },
    { id: 'cinema', libelle: 'actu.cat.cinema' },
  ];

  protected readonly filtre = signal<Categorie | 'tous'>('tous');

  // L'article à la une (le plus récent marqué « aLaUne »), seulement quand aucun filtre n'est choisi
  protected readonly aLaUne = computed(() =>
    this.filtre() === 'tous' ? this.service.articles().find((a) => a.aLaUne) : undefined,
  );

  // Les autres articles, du plus récent au plus ancien (ordre envoyé par le serveur)
  protected readonly liste = computed(() =>
    this.service
      .articles()
      .filter((a) => a !== this.aLaUne() && (this.filtre() === 'tous' || a.categorie === this.filtre())),
  );

  constructor() {
    this.service.charger();
  }

  protected reessayer(): void {
    this.etat.set('chargement');
    this.service.charger();
  }
}
