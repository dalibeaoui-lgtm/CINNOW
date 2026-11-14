import { Component, computed, inject } from '@angular/core';
import { Catalogue } from '../../services/catalogue';

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

  // Tous les films qui ont une photo horizontale
  protected readonly films = computed(() => this.catalogue.films().filter((film) => film.photo));
}
