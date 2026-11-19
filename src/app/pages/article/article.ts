import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarteActualite } from '../../components/carte-actualite/carte-actualite';
import { Apparition } from '../../directives/apparition';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { ActualitesService } from '../../services/actualites';
import { Catalogue } from '../../services/catalogue';
import { formaterDate } from '../../utils/formats';
import { srcsetPhoto } from '../../utils/images';

// Un article des Actualités (/actualites/:id) : titre, photo, texte, lien vers le film
// dont il parle, et 3 autres articles à lire.
@Component({
  selector: 'app-article',
  imports: [RouterLink, CarteActualite, Apparition, Traduction],
  templateUrl: './article.html',
  styleUrl: './article.scss',
})
export class Article {
  // Le « :id » de l'adresse (grâce à withComponentInputBinding dans app.config.ts)
  readonly id = input.required<string>();

  private readonly service = inject(ActualitesService);
  private readonly catalogue = inject(Catalogue);
  protected readonly etat = this.service.etat;

  protected readonly article = computed(() => this.service.article(Number(this.id())));
  protected readonly srcset = computed(() => srcsetPhoto(this.article()?.image ?? ''));
  protected readonly film = computed(() => this.catalogue.film(this.article()?.filmId));
  protected readonly categorie = computed(
    () => `actu.cat.${this.article()?.categorie}` as CleTraduction,
  );
  protected readonly date = computed(() => {
    const a = this.article();
    return a
      ? formaterDate(a.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '';
  });

  // 3 autres articles : ceux du même thème d'abord, puis les plus récents
  protected readonly autres = computed(() => {
    const a = this.article();
    if (!a) return [];
    const reste = this.service.articles().filter((x) => x.id !== a.id);
    return [
      ...reste.filter((x) => x.categorie === a.categorie),
      ...reste.filter((x) => x.categorie !== a.categorie),
    ].slice(0, 3);
  });

  constructor() {
    this.service.charger();
  }

  protected reessayer(): void {
    this.etat.set('chargement');
    this.service.charger();
  }
}
