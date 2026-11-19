import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Actualite } from '../../models/actualite';
import { formaterDate } from '../../utils/formats';
import { srcsetPhoto } from '../../utils/images';

// Carte d'un article : photo, thème et date, titre, début du texte. Toute la carte est un lien.
// Utilisation : <app-carte-actualite [article]="article" />
@Component({
  selector: 'app-carte-actualite',
  imports: [RouterLink, Traduction],
  templateUrl: './carte-actualite.html',
  styleUrl: './carte-actualite.scss',
})
export class CarteActualite {
  readonly article = input.required<Actualite>();
  // Grande carte (article à la une) : photo à gauche, texte à droite
  readonly grande = input(false);

  protected readonly srcset = computed(() => srcsetPhoto(this.article().image));
  protected readonly categorie = computed(() => `actu.cat.${this.article().categorie}` as CleTraduction);
  // « 2026-11-13 » → « 13 novembre 2026 » / « 13 November 2026 »
  protected readonly date = computed(() => formaterDate(this.article().date, { day: 'numeric', month: 'long', year: 'numeric' }));
}
