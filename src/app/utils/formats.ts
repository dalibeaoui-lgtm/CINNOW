// Petites fonctions de mise en forme utilisées sur plusieurs pages.
// Elles suivent la langue choisie (fr ou en) : comme elles lisent le signal de la langue,
// tout ce qui les utilise se met à jour tout seul quand on change de langue.
import { locale, t } from '../i18n/langue';

const deuxChiffres = (nombre: number) => String(nombre).padStart(2, '0');

// 172 minutes → « 2 h 52 » (français) ou « 2h 52 » (anglais)
export function formaterDuree(minutes: number): string {
  return t('format.duree', { h: Math.floor(minutes / 60), m: deuxChiffres(minutes % 60) });
}

// Date → « 2026-11-12 » (heure locale, pas UTC)
export function versAAAAMMJJ(date: Date): string {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

// « 2026-11-12 » → Date à minuit, heure locale
// (new Date('2026-11-12') lirait la date en UTC et pourrait afficher la veille)
export function lireDate(texte: string): Date {
  const [annee, mois, jour] = texte.split('-').map(Number);
  return new Date(annee, mois - 1, jour);
}

// Vrai si la séance a déjà commencé
export function seanceEstPassee(seance: { date: string; heure: string }): boolean {
  const maintenant = new Date();
  const limite = `${versAAAAMMJJ(maintenant)} ${maintenant.toTimeString().slice(0, 5)}`;
  return `${seance.date} ${seance.heure}` <= limite;
}

// Une date (« 2026-11-13 » ou un objet Date) écrite dans la langue choisie
export function formaterDate(date: string | Date, options: Intl.DateTimeFormatOptions): string {
  return (typeof date === 'string' ? lireDate(date) : date).toLocaleDateString(locale(), options);
}

// « 2026-11-13 » → « vendredi 13 novembre » / « Friday 13 November »
export function dateLongue(texte: string): string {
  return formaterDate(texte, { weekday: 'long', day: 'numeric', month: 'long' });
}

// Numéro de billet ou de commande, court et lisible : 1794572173278 → « 173278 »
export function numeroCourt(id: number): string {
  return String(id).slice(-6);
}

// 4.4 → « 4,4 » (français) ou « 4.4 » (anglais)
export function formaterNote(note: number): string {
  return note.toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// 9.5 → « 9,500 DT » / « 9.500 TND » (le dinar s'écrit avec 3 décimales)
export function formaterPrix(prix: number): string {
  const montant = prix.toLocaleString(locale(), {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  return `${montant} ${t('format.devise')}`;
}

// 4.4 → « ★★★★☆ »
export function etoiles(note: number): string {
  const pleines = Math.round(note);
  return '★'.repeat(pleines) + '☆'.repeat(5 - pleines);
}
