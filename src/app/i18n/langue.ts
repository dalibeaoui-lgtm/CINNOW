import { signal } from '@angular/core';
import { lireStockage } from '../utils/stockage';
import { en } from './en';
import { fr } from './fr';

// Les 2 langues du site. Le bouton rond du menu passe de l'une à l'autre : FR ⇄ EN.
export type CodeLangue = 'fr' | 'en';
export type CleTraduction = keyof typeof fr;

export const LANGUES: { code: CodeLangue; nom: string; locale: string }[] = [
  { code: 'fr', nom: 'Français', locale: 'fr-FR' },
  { code: 'en', nom: 'English', locale: 'en-GB' },
];

const DICTIONNAIRES: Record<CodeLangue, Record<CleTraduction, string>> = { fr, en };

export const CLE_STOCKAGE_LANGUE = 'cinnow-langue';

// La langue choisie (gardée dans le navigateur). C'est un signal : tout ce qui l'utilise
// (textes, dates, prix, titres des films…) se met à jour tout seul quand elle change.
const enregistree = lireStockage<string>(CLE_STOCKAGE_LANGUE, 'fr');
export const langueActive = signal<CodeLangue>(enregistree === 'en' ? 'en' : 'fr');

export function infosLangue(code = langueActive()) {
  return LANGUES.find((l) => l.code === code) ?? LANGUES[0];
}

// Format des dates et des nombres de la langue choisie (ex. « fr-FR »)
export function locale(): string {
  return infosLangue().locale;
}

// Texte traduit. Les {mots} entre accolades sont remplacés : t('menu.panier', { n: 2 }) → « Panier (2) »
export function t(cle: CleTraduction, parametres: Record<string, string | number> = {}): string {
  const texte = DICTIONNAIRES[langueActive()][cle] ?? fr[cle] ?? cle;
  return texte.replace(/\{(\w+)\}/g, (_, nom: string) => String(parametres[nom] ?? `{${nom}}`));
}

// Singulier ou pluriel : tn('bout.nbProduits', 3) utilise la clé « bout.nbProduits.plusieurs »
export function tn(
  base: string,
  n: number,
  parametres: Record<string, string | number> = {},
): string {
  return t(`${base}.${n > 1 ? 'plusieurs' : 'un'}` as CleTraduction, { n, ...parametres });
}
