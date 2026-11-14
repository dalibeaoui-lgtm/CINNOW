import { langueActive } from '../i18n/langue';
import {
  etoiles,
  formaterDuree,
  formaterNote,
  formaterPrix,
  lireDate,
  numeroCourt,
  seanceEstPassee,
  versAAAAMMJJ,
} from './formats';

// Petites fonctions de mise en forme (dates, prix, durées, notes)
describe('utils/formats', () => {
  beforeEach(() => langueActive.set('fr'));

  describe('formaterDuree', () => {
    it('écrit les minutes en heures + minutes, en français', () => {
      expect(formaterDuree(172)).toBe('2 h 52');
      expect(formaterDuree(92)).toBe('1 h 32');
    });

    it('ajoute un zéro devant les minutes à un seul chiffre', () => {
      expect(formaterDuree(125)).toBe('2 h 05');
    });

    it('suit la langue choisie', () => {
      langueActive.set('en');
      expect(formaterDuree(166)).toBe('2h 46');
    });
  });

  describe('dates', () => {
    it('versAAAAMMJJ écrit une date au format AAAA-MM-JJ', () => {
      expect(versAAAAMMJJ(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('lireDate lit la date en heure locale (pas de décalage d’un jour)', () => {
      const date = lireDate('2026-11-13');
      expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 13]);
    });

    it('lireDate et versAAAAMMJJ font l’aller-retour', () => {
      expect(versAAAAMMJJ(lireDate('2027-02-28'))).toBe('2027-02-28');
    });
  });

  describe('seanceEstPassee', () => {
    it('vrai pour une séance d’hier, faux pour une séance de demain', () => {
      const hier = new Date();
      hier.setDate(hier.getDate() - 1);
      const demain = new Date();
      demain.setDate(demain.getDate() + 1);
      expect(seanceEstPassee({ date: versAAAAMMJJ(hier), heure: '20:00' })).toBe(true);
      expect(seanceEstPassee({ date: versAAAAMMJJ(demain), heure: '20:00' })).toBe(false);
    });
  });

  describe('formaterPrix', () => {
    it('écrit les dinars avec 3 décimales (DT en français)', () => {
      // toLocaleString peut utiliser une espace spéciale : on la remplace pour comparer
      expect(formaterPrix(9.5).replace(/\s/g, ' ')).toBe('9,500 DT');
    });

    it('écrit TND et un point en anglais', () => {
      langueActive.set('en');
      expect(formaterPrix(22)).toBe('22.000 TND');
    });
  });

  it('formaterNote garde une décimale', () => {
    expect(formaterNote(4)).toBe('4,0');
    langueActive.set('en');
    expect(formaterNote(4.55)).toMatch(/^4\.[56]$/);
  });

  it('etoiles arrondit la note sur 5 étoiles', () => {
    expect(etoiles(4.4)).toBe('★★★★☆');
    expect(etoiles(5)).toBe('★★★★★');
    expect(etoiles(1)).toBe('★☆☆☆☆');
  });

  it('numeroCourt garde les 6 derniers chiffres', () => {
    expect(numeroCourt(1794572173278)).toBe('173278');
  });
});
