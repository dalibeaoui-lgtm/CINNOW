import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { infosLangue, langueActive } from '../../i18n/langue';
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

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Traduction],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: { '(window:scroll)': 'auDefilement()' },
})
export class Header {
  private readonly router = inject(Router);
  private readonly catalogue = inject(Catalogue);

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
