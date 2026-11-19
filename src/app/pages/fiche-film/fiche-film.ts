import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CarteFilm } from '../../components/carte-film/carte-film';
import { Apparition } from '../../directives/apparition';
import { t } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { AvisService } from '../../services/avis';
import { Catalogue } from '../../services/catalogue';
import {
  etoiles,
  formaterDate,
  formaterDuree,
  formaterNote,
  seanceEstPassee,
  versAAAAMMJJ,
} from '../../utils/formats';

const entre0et1 = (valeur: number) => Math.min(Math.max(valeur, 0), 1);

@Component({
  selector: 'app-fiche-film',
  imports: [RouterLink, CarteFilm, Apparition, Traduction],
  templateUrl: './fiche-film.html',
  styleUrl: './fiche-film.scss',
})
export class FicheFilm {
  // Le « :id » de l'adresse /film/:id (grâce à withComponentInputBinding dans app.config.ts)
  readonly id = input.required<string>();

  // Films et séances envoyés par le serveur
  private readonly catalogue = inject(Catalogue);
  protected readonly film = computed(() => this.catalogue.film(Number(this.id())));
  // Le numéro du film seul : ne change pas quand on change de langue (contrairement à film())
  private readonly filmId = computed(() => this.film()?.id);

  protected readonly enSalle = computed(() => this.film()?.statut === 'a-l-affiche');
  protected readonly mots = computed(() => this.film()?.titre.split(' ') ?? []);
  protected readonly duree = computed(() => formaterDuree(this.film()?.duree ?? 0));
  protected readonly dateSortie = computed(() => {
    const film = this.film();
    return film
      ? formaterDate(film.dateSortie, { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
  });

  // ---------- Séances ----------
  // Séances à venir du film (celles déjà commencées sont retirées)
  private readonly seances = computed(() =>
    this.catalogue
      .seances()
      .filter((seance) => seance.filmId === this.film()?.id && !seanceEstPassee(seance)),
  );

  // Les 7 prochains jours, pour la barre des dates
  protected readonly jours = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const jour = new Date();
      jour.setDate(jour.getDate() + i);
      const date = versAAAAMMJJ(jour);
      return {
        date,
        libelle:
          i === 0
            ? t('fiche.aujourdhui')
            : i === 1
              ? t('fiche.demain')
              : formaterDate(jour, { weekday: 'short', day: 'numeric', month: 'short' }),
        nombre: this.seances().filter((seance) => seance.date === date).length,
      };
    }),
  );

  // Jour choisi : le premier jour qui a des séances, puis celui sur lequel on clique.
  // linkedSignal le remet à zéro quand on passe à un autre film.
  // (on passe par premierJour, une simple date : changer de langue ne remet pas le choix à zéro)
  private readonly premierJour = computed(
    () => this.jours().find((jour) => jour.nombre > 0)?.date ?? '',
  );
  protected readonly jourChoisi = linkedSignal(() => this.premierJour());
  protected readonly seancesDuJour = computed(() =>
    this.seances().filter((seance) => seance.date === this.jourChoisi()),
  );

  // ---------- Avis et autres films ----------
  // Avis d'exemple + avis publiés depuis « Mon compte »
  private readonly avisService = inject(AvisService);
  protected readonly avis = computed(() =>
    this.avisService.tous().filter((avis) => avis.filmId === this.film()?.id),
  );
  protected readonly autresFilms = computed(() => {
    const film = this.film();
    if (!film) return [];
    return this.catalogue
      .films()
      .filter((autre) => autre.id !== film.id && autre.statut === film.statut)
      .slice(0, 4);
  });

  // « Me prévenir » pour un film qui n'est pas encore sorti
  protected readonly prevenu = linkedSignal(() => (this.filmId(), false));

  // ---------- Bande-annonce ----------
  // On accepte un lien YouTube (watch?v=…, youtu.be/…, embed/…) dans « bandeAnnonce »
  private readonly sanitizer = inject(DomSanitizer);
  // Revient à la photo quand on change de film (mais pas quand on change de langue)
  protected readonly lecture = linkedSignal(() => (this.filmId(), false));
  protected readonly urlVideo = computed(() => {
    const lien = this.film()?.bandeAnnonce ?? '';
    const idVideo = lien.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
    if (!idVideo) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${idVideo}?autoplay=1&rel=0`,
    );
  });

  // Fonctions utilisées dans le HTML
  protected readonly etoiles = etoiles;
  protected readonly formaterNote = formaterNote;
  protected dateAvis(texte: string): string {
    return formaterDate(texte, { day: 'numeric', month: 'long' });
  }

  // ---------- Effet au défilement ----------
  private readonly cadre = viewChild<ElementRef<HTMLElement>>('cadre');

  // Vrai tant que le haut de la page (la bande-annonce) est encore à l'écran
  private readonly enHautDePage = signal(true);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Pendant la bande-annonce : le menu (logo CINNOW, Films, Boutique…) disparaît pour laisser
    // toute la place à la vidéo. Il revient dès qu'on descend plus bas dans la page.
    const suivreDefilement = () => this.enHautDePage.set(window.scrollY < window.innerHeight * 0.5);
    window.addEventListener('scroll', suivreDefilement, { passive: true });
    effect(() =>
      document.documentElement.classList.toggle(
        'video-en-cours',
        this.lecture() && this.enHautDePage(),
      ),
    );
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', suivreDefilement);
      document.documentElement.classList.remove('video-en-cours');
    });

    afterNextRender(() => {
      // Pas d'animation si l'utilisateur a demandé à les réduire
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let enAttente = false;
      const auDefilement = () => {
        if (enAttente) return;
        enAttente = true;
        requestAnimationFrame(() => {
          enAttente = false;
          this.animerMedia();
        });
      };

      window.addEventListener('scroll', auDefilement, { passive: true });
      window.addEventListener('resize', auDefilement);
      this.animerMedia();

      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', auDefilement);
        window.removeEventListener('resize', auDefilement);
      });
    });
  }

  // La bande-annonce se resserre (marges sur les côtés) quand on descend,
  // et l'image avance moins vite que la page (parallaxe).
  private animerMedia(): void {
    const cadre = this.cadre()?.nativeElement;
    if (!cadre) return;

    const y = window.scrollY;
    const progression = entre0et1(y / (window.innerHeight * 0.7));
    const cote = (progression * 3.3).toFixed(2);
    cadre.style.clipPath = `inset(0 ${cote}vw)`;

    const image = cadre.querySelector<HTMLElement>('.media__image');
    if (image) {
      image.style.transform = `translate3d(0, ${(y * 0.15).toFixed(1)}px, 0) scale(${(1 + progression * 0.05).toFixed(4)})`;
    }
  }
}
