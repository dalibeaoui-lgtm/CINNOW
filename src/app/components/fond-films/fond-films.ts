import { Component, computed, inject } from '@angular/core';
import { Catalogue } from '../../services/catalogue';
import { photoMoyenne } from '../../utils/images';

// Fond animé (décoratif) : les photos horizontales des films défilent lentement de gauche à droite,
// sous un voile sombre pour que le texte posé dessus reste lisible.
// À placer dans un bloc en « position: relative; overflow: hidden », avec le contenu au-dessus (z-index 1 ou plus).
// Utilisé par le bandeau « Avis » de l'accueil et l'encadré de fin de la FAQ.
@Component({
  selector: 'app-fond-films',
  templateUrl: './fond-films.html',
  styleUrl: './fond-films.scss',
  host: { 'aria-hidden': 'true' },
})
export class FondFilms {
  private readonly catalogue = inject(Catalogue);

  // Photos de tous les films qui en ont une, en version 800 px : le bandeau est bas,
  // la grande version (1920 px) serait 5 à 10 fois plus lourde pour rien
  protected readonly photos = computed(() =>
    this.catalogue
      .films()
      .filter((film) => film.photo)
      .map((film) => ({ id: film.id, src: photoMoyenne(film.photo!) })),
  );
}
