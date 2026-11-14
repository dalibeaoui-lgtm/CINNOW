import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { langueActive } from '../../i18n/langue';
import { Film } from '../../models/film';
import { Catalogue } from '../../services/catalogue';
import { Header } from './header';

const film = (id: number, titre: string, realisateur: string, genre: string, titreEn?: string): Film => ({
  id,
  titre,
  realisateur,
  genre,
  duree: 120,
  synopsis: '',
  affiche: '',
  bandeAnnonce: '',
  note: 4,
  statut: 'a-l-affiche',
  dateSortie: '2026-01-01',
  ...(titreEn && { traductions: { en: { titre: titreEn } } }),
});

// Menu : barre de recherche et bouton de langue
describe('components/Header', () => {
  let page: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<Header>>;
  let router: Router;

  const taper = async (texte: string) => {
    const champ = page.querySelector<HTMLInputElement>('#recherche-film')!;
    champ.dispatchEvent(new Event('focus'));
    champ.value = texte;
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const titres = () => [...page.querySelectorAll('.resultat__titre')].map((e) => e.textContent?.trim());

  beforeEach(async () => {
    langueActive.set('fr');
    const fauxCatalogue = {
      films: signal([
        film(1, 'The Odyssey', 'Christopher Nolan', 'Aventure'),
        film(10, 'Dune : Deuxième partie', 'Denis Villeneuve', 'Science-fiction', 'Dune: Part Two'),
        film(11, 'Oppenheimer', 'Christopher Nolan', 'Drame historique'),
        film(14, 'Midsommar', 'Ari Aster', 'Horreur'),
      ]),
    };
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: Catalogue, useValue: fauxCatalogue }],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    page = fixture.nativeElement;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('trouve les films par réalisateur', async () => {
    await taper('nolan');
    expect(titres()).toEqual(['The Odyssey', 'Oppenheimer']);
  });

  it('ignore les accents et les majuscules', async () => {
    await taper('DEUXIEME');
    expect(titres()).toEqual(['Dune : Deuxième partie']);
  });

  it('cherche aussi dans le titre anglais', async () => {
    await taper('part two');
    expect(titres()).toEqual(['Dune : Deuxième partie']);
  });

  it('prévient quand aucun film ne correspond', async () => {
    await taper('zzz');
    expect(page.querySelector('.resultats__vide')?.textContent).toContain('Aucun film trouvé');
  });

  it('ouvre la fiche du film choisi avec ↓ puis Entrée', async () => {
    const naviguer = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await taper('nolan');
    const champ = page.querySelector<HTMLInputElement>('#recherche-film')!;
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();
    expect(naviguer).toHaveBeenCalledWith(['/film', 11]); // Oppenheimer, le 2e résultat
  });

  it('passe du français à l’anglais avec le bouton de langue', async () => {
    const bouton = page.querySelector<HTMLButtonElement>('.langue')!;
    expect(bouton.textContent?.trim()).toBe('FR');
    bouton.click();
    await fixture.whenStable();
    expect(langueActive()).toBe('en');
    expect(bouton.textContent?.trim()).toBe('EN');
    expect(page.querySelector('.header__liens')?.textContent).toContain('Shop');
  });
});
