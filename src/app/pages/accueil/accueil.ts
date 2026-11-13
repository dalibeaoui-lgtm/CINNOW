import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarteFilm } from '../../components/carte-film/carte-film';
import { Apparition } from '../../directives/apparition';
import { Traduction } from '../../i18n/traduire.pipe';
import { Catalogue } from '../../services/catalogue';

const entre0et1 = (valeur: number) => Math.min(Math.max(valeur, 0), 1);

// Mélange une liste au hasard (mélange de Fisher-Yates : chaque ordre a la même chance de sortir)
function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, CarteFilm, Apparition, Traduction],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil {
  // Films envoyés par le serveur (déjà chargés au démarrage), dans la langue choisie
  private readonly films = inject(Catalogue).films;

  // Les 3 films à la une, tirés au hasard parmi ceux qui ont une photo horizontale.
  // Le tirage est fait une seule fois, à l'ouverture de la page : chaque rechargement donne
  // 3 autres films, mais changer de langue ne relance pas le tirage.
  private readonly idsALaUne = melanger(this.films().filter((film) => film.photo).map((film) => film.id)).slice(0, 3);
  protected readonly slides = computed(() =>
    this.idsALaUne.map((id) => this.films().find((film) => film.id === id)!).filter(Boolean),
  );
  protected readonly aLAffiche = computed(() => this.films().filter((film) => film.statut === 'a-l-affiche'));
  protected readonly prochainement = computed(() => this.films().filter((film) => film.statut === 'prochainement'));
  // Bande qui défile en bas de page : tous les films qui ont une photo horizontale
  protected readonly filmsDefile = computed(() => this.films().filter((film) => film.photo));

  private readonly slidesHtml = viewChildren<ElementRef<HTMLElement>>('slide');

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Sur l'accueil seulement, le grand logo du pied de page prend un dégradé de couleurs animé :
    // on pose la classe « page-accueil » sur <html> (le pied de page s'en sert, voir footer.scss).
    document.documentElement.classList.add('page-accueil');
    destroyRef.onDestroy(() => document.documentElement.classList.remove('page-accueil'));

    afterNextRender(() => {
      // Pas d'animation si l'utilisateur a demandé à les réduire
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let enAttente = false;
      const auDefilement = () => {
        if (enAttente) return;
        enAttente = true;
        requestAnimationFrame(() => {
          enAttente = false;
          this.animerSlides();
        });
      };

      window.addEventListener('scroll', auDefilement, { passive: true });
      window.addEventListener('resize', auDefilement);
      this.animerSlides();

      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', auDefilement);
        window.removeEventListener('resize', auDefilement);
      });
    });
  }

  // Effets du haut de page, inspirés d'A24 :
  // 1. parallaxe : l'image avance moins vite que la slide ;
  // 2. la slide recouverte par la suivante s'assombrit et recule.
  private animerSlides(): void {
    const hauteur = window.innerHeight;
    const slides = this.slidesHtml().map((ref) => ref.nativeElement);

    slides.forEach((slide, i) => {
      const haut = slide.getBoundingClientRect().top;
      const image = slide.querySelector<HTMLElement>('.slide__image');
      const ombre = slide.querySelector<HTMLElement>('.slide__ombre');
      if (!image || !ombre) return;

      let transformation = `translate3d(0, ${(-haut * 0.25).toFixed(1)}px, 0)`;
      const suivante = slides[i + 1];

      if (suivante) {
        const recouvrement = 1 - entre0et1(suivante.getBoundingClientRect().top / hauteur);
        ombre.style.opacity = (recouvrement * 0.65).toFixed(3);
        transformation += ` scale(${(1 + recouvrement * 0.06).toFixed(4)})`;
      }

      image.style.transform = transformation;
    });
  }
}
