import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

// Fait apparaître un élément en fondu quand il entre à l'écran.
// Utilisation : <h2 appApparition>…</h2>
@Directive({
  selector: '[appApparition]',
  host: { class: 'apparition' },
})
export class Apparition {
  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observateur = new IntersectionObserver(
        ([entree]) => {
          if (entree.isIntersecting) {
            element.classList.add('visible');
            observateur.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observateur.observe(element);
      destroyRef.onDestroy(() => observateur.disconnect());
    });
  }
}
