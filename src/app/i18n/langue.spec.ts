import { en } from './en';
import { fr } from './fr';
import { langueActive, t, tn } from './langue';

// Traductions français / anglais
describe('i18n/langue', () => {
  beforeEach(() => langueActive.set('fr'));

  it('donne le texte dans la langue choisie', () => {
    expect(t('menu.boutique')).toBe('Boutique');
    langueActive.set('en');
    expect(t('menu.boutique')).toBe('Shop');
  });

  it('remplace les {mots} par les valeurs données', () => {
    expect(t('menu.panier', { n: 3 })).toBe('Panier (3)');
    expect(t('compte.bonjour', { prenom: 'Sarra' })).toBe('Bonjour, Sarra');
  });

  it('choisit le singulier ou le pluriel', () => {
    expect(tn('bout.nbProduits', 1)).toBe('1 produit');
    expect(tn('bout.nbProduits', 7)).toBe('7 produits');
    langueActive.set('en');
    expect(tn('bout.nbProduits', 7)).toBe('7 products');
  });

  it('a exactement les mêmes clés en français et en anglais', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  it('n’a aucun texte vide', () => {
    const vides = [...Object.entries(fr), ...Object.entries(en)].filter(([, texte]) => !texte.trim());
    expect(vides).toEqual([]);
  });
});
