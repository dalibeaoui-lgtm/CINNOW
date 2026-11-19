import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

// Fine barre dorée en haut de l'écran pendant le passage d'une page à l'autre.
// Chaque page est chargée seulement quand on l'ouvre (loadComponent) et certaines attendent
// le serveur (ex. un article) : la barre montre que le clic a bien été pris en compte.
@Component({
  selector: 'app-barre-navigation',
  template: `<div class="barre" [class.barre--active]="active()" [class.barre--finie]="finie()"></div>`,
  styleUrl: './barre-navigation.scss',
  host: { 'aria-hidden': 'true' }, // purement visuel : le titre de l'onglet change à l'arrivée
})
export class BarreNavigation {
  protected readonly active = signal(false);
  protected readonly finie = signal(false);

  constructor() {
    let delai: ReturnType<typeof setTimeout> | undefined;
    const abonnement = inject(Router).events.subscribe((evenement) => {
      if (evenement instanceof NavigationStart) {
        // Petite attente : si la page est déjà prête (presque toujours), la barre ne clignote pas
        clearTimeout(delai);
        delai = setTimeout(() => {
          this.finie.set(false);
          this.active.set(true);
        }, 120);
      } else if (
        evenement instanceof NavigationEnd ||
        evenement instanceof NavigationCancel ||
        evenement instanceof NavigationError
      ) {
        clearTimeout(delai);
        if (this.active()) {
          // La barre se remplit jusqu'au bout puis s'efface
          this.finie.set(true);
          setTimeout(() => this.active.set(false), 350);
        }
      }
    });
    inject(DestroyRef).onDestroy(() => {
      abonnement.unsubscribe();
      clearTimeout(delai);
    });
  }
}
