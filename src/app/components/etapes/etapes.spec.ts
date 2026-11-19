import { TestBed } from '@angular/core/testing';
import { langueActive } from '../../i18n/langue';
import { Etapes } from './etapes';

// Barre des étapes : Séance → Places → Snacks → Paiement
describe('components/Etapes', () => {
  const afficher = async (courantes: number[]) => {
    const fixture = TestBed.createComponent(Etapes);
    fixture.componentRef.setInput('courantes', courantes);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('li')];
  };

  beforeEach(() => langueActive.set('fr'));

  it('affiche les 4 étapes dans l’ordre', async () => {
    const etapes = await afficher([2, 3]);
    // Le nom seul : sans le numéro dans le rond ni le texte caché « (terminée) »
    const nom = (e: HTMLElement) =>
      [...e.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim();
    expect(etapes.map(nom)).toEqual(['Séance', 'Places', 'Snacks', 'Paiement']);
  });

  it('coche les étapes faites, numérote les étapes en cours, laisse les suivantes sans rond', async () => {
    const [seance, places, snacks, paiement] = await afficher([2, 3]);
    expect(seance.classList).toContain('etape--faite');
    expect(seance.querySelector('svg')).not.toBeNull(); // la coche
    expect(places.classList).toContain('etape--active');
    expect(places.querySelector('.etape__numero')?.textContent?.trim()).toBe('2');
    expect(snacks.getAttribute('aria-current')).toBe('step');
    expect(paiement.classList).toContain('etape--a-venir');
    expect(paiement.querySelector('.etape__numero')).toBeNull();
  });

  it('coche tout quand la réservation est terminée', async () => {
    const etapes = await afficher([]);
    expect(etapes.every((e) => e.classList.contains('etape--faite'))).toBe(true);
  });
});
