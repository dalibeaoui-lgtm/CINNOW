import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CleTraduction, infosLangue, langueActive } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Catalogue } from '../../services/catalogue';
import { Panier } from '../../services/panier';

// « Pâte » → « pate » : on compare sans majuscules ni accents
const simplifier = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const MAX_RESULTATS = 6;

// Les pages du menu (ordinateur et téléphone)
const LIENS: { route: string; cle: CleTraduction }[] = [
  { route: '/', cle: 'menu.films' },
  { route: '/boutique', cle: 'menu.boutique' },
  { route: '/actualites', cle: 'menu.actualites' },
  { route: '/a-propos', cle: 'menu.aPropos' },
  { route: '/faq', cle: 'menu.faq' },
  { route: '/contact', cle: 'menu.contact' },
];

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Traduction],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: { '(window:scroll)': 'auDefilement()', '(document:keydown.escape)': 'fermerMenu(true)' },
})
export class Header {
  private readonly router = inject(Router);
  private readonly catalogue = inject(Catalogue);

  protected readonly liens = LIENS;

  // ---------- Menu du téléphone (bouton ☰) ----------
  // Sur petit écran, les liens sont remplacés par un bouton qui ouvre un panneau plein écran
  protected readonly menuOuvert = signal(false);
  private readonly bouton = viewChild<ElementRef<HTMLButtonElement>>('bouton');
  private readonly panneau = viewChild<ElementRef<HTMLElement>>('panneau');

  constructor() {
    // Menu ouvert : la page derrière ne défile plus (voir styles.scss) et ne reçoit plus
    // le focus du clavier (inert) : la touche Tab reste dans le menu
    effect(() => {
      const ouvert = this.menuOuvert();
      document.documentElement.classList.toggle('menu-mobile-ouvert', ouvert);
      document.querySelectorAll('main, app-footer').forEach((e) => e.toggleAttribute('inert', ouvert));
    });
    // L'écran s'élargit (téléphone tourné, fenêtre agrandie) : le bouton ☰ disparaît, on ferme le menu
    window.matchMedia?.('(min-width: 761px)').addEventListener('change', (e) => e.matches && this.fermerMenu());
  }

  protected basculerMenu(): void {
    if (this.menuOuvert()) {
      this.fermerMenu();
      return;
    }
    this.menuOuvert.set(true);
    this.cache.set(false);
    // Le focus va sur le premier lien du panneau, une fois celui-ci affiché
    // (pas sur la recherche : sur un téléphone, le clavier s'ouvrirait tout de suite)
    setTimeout(() => this.panneau()?.nativeElement.querySelector<HTMLElement>('.menu-mobile__liens a')?.focus(), 60);
  }

  // rendreFocus : après Échap, le focus revient sur le bouton ☰ (on ne perd pas sa place au clavier)
  fermerMenu(rendreFocus = false): void {
    if (!this.menuOuvert()) return;
    this.menuOuvert.set(false);
    this.recherche.set('');
    if (rendreFocus) this.bouton()?.nativeElement.focus();
  }

  // Nombre d'articles dans le panier de la boutique (lien « Panier (2) »)
  protected readonly panier = inject(Panier);

  // ---------- Langue ----------
  protected readonly langue = langueActive;
  protected readonly nomLangue = computed(() => infosLangue().nom);

  // FR ⇄ EN : tout le site change de langue d'un coup (textes, dates, prix, films)
  protected changerLangue(): void {
    langueActive.set(langueActive() === 'fr' ? 'en' : 'fr');
  }

  // ---------- Recherche ----------
  protected readonly recherche = signal(''); // ce qui est tapé
  protected readonly ouverte = signal(false); // le champ a le focus
  protected readonly indexActif = signal(0); // résultat surligné (flèches ↑ ↓)

  // Films dont le titre, le réalisateur ou le genre contient tous les mots tapés.
  // On cherche aussi dans le titre de l'autre langue (« Dune : Deuxième partie » / « Dune: Part Two »).
  protected readonly resultats = computed(() => {
    const mots = simplifier(this.recherche()).split(/\s+/).filter(Boolean);
    if (!mots.length) return [];
    return this.catalogue
      .films()
      .filter((film) => {
        const texte = simplifier(
          [film.titre, film.realisateur, film.genre, film.traductions?.en?.titre ?? ''].join(' '),
        );
        return mots.every((mot) => texte.includes(mot));
      })
      .slice(0, MAX_RESULTATS);
  });

  // La liste s'affiche quand le champ a le focus et qu'on a tapé quelque chose
  protected readonly listeOuverte = computed(() => this.ouverte() && this.recherche().trim().length > 0);

  protected taper(valeur: string): void {
    this.recherche.set(valeur);
    this.indexActif.set(0);
    this.ouverte.set(true);
  }

  // Flèches ↑ ↓ : on passe d'un résultat à l'autre (et on revient au début après le dernier)
  protected deplacer(pas: number, evenement: Event): void {
    const nombre = this.resultats().length;
    if (!nombre) return;
    evenement.preventDefault(); // sinon le curseur saute au début ou à la fin du texte
    this.indexActif.update((i) => (i + pas + nombre) % nombre);
  }

  // Entrée ou clic : on ouvre la fiche du film choisi et on vide la recherche
  protected ouvrirResultat(index: number): void {
    const film = this.resultats()[index];
    if (!film) return;
    this.router.navigate(['/film', film.id]);
    this.recherche.set('');
    this.fermer();
    this.fermerMenu();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  protected fermer(): void {
    this.ouverte.set(false);
  }

  // ---------- Menu qui se cache ----------
  // Le menu se cache quand on descend et revient quand on remonte
  protected readonly cache = signal(false);
  private dernierY = 0;

  protected auDefilement(): void {
    const y = window.scrollY;
    this.cache.set(y > this.dernierY && y > 120);
    this.dernierY = y;
    // Prévient les autres pages (ex. la barre des dates de la fiche film, qui remonte)
    document.documentElement.classList.toggle('menu-cache', this.cache());
  }
}
