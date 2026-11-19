// Programme des séances, calculé à partir de la date du jour.
//
// Chaque film à l'affiche passe 3 fois par jour, dans sa propre salle, des 30 derniers jours
// aux 7 prochains. Toutes les places sont libres au départ : les seules places occupées sont
// celles réservées sur le site (stockage/reservations.json).

import { lireDonnees, lireListe } from './stockage.js';

const PROGRAMMES = [
  [
    { heure: '14:00', version: 'VF' },
    { heure: '17:30', version: 'VO' },
    { heure: '21:00', version: 'VO' },
  ],
  [
    { heure: '13:30', version: 'VF' },
    { heure: '16:45', version: 'VF' },
    { heure: '20:15', version: 'VO' },
  ],
  [
    { heure: '15:00', version: 'VO' },
    { heure: '18:30', version: 'VF' },
    { heure: '22:00', version: 'VO' },
  ],
];

const deuxChiffres = (n) => String(n).padStart(2, '0');

// Date → « 2026-11-13 » (heure locale du serveur)
export function versAAAAMMJJ(date) {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

// Vrai si la séance a déjà commencé
export function estPassee(seance) {
  const maintenant = new Date();
  return (
    `${seance.date} ${seance.heure}` <=
    `${versAAAAMMJJ(maintenant)} ${maintenant.toTimeString().slice(0, 5)}`
  );
}

// Numéro de séance stable d'un jour à l'autre : film 1, le 13/11/2026 à 14:00 → 1202611131400
function numeroSeance(filmId, date, heure) {
  return Number(`${filmId}${date.replaceAll('-', '')}${heure.replace(':', '')}`);
}

// Toutes les séances, avec leurs places occupées à jour
export function toutesLesSeances() {
  const films = lireDonnees('films');
  const reservations = lireListe('reservations');
  const seances = [];

  for (const film of films.filter((f) => f.statut === 'a-l-affiche')) {
    for (let jour = -30; jour < 7; jour++) {
      const date = new Date();
      date.setDate(date.getDate() + jour);
      const aaaammjj = versAAAAMMJJ(date);

      for (const { heure, version } of PROGRAMMES[(film.id + jour + 60) % PROGRAMMES.length]) {
        const id = numeroSeance(film.id, aaaammjj, heure);
        seances.push({
          id,
          filmId: film.id,
          date: aaaammjj,
          heure,
          version,
          salle: film.id,
          // Places prises = celles des réservations faites sur le site pour cette séance
          placesOccupees: reservations.filter((r) => r.seanceId === id).flatMap((r) => r.places),
        });
      }
    }
  }
  return seances;
}

export function trouverSeance(id) {
  return toutesLesSeances().find((s) => s.id === id);
}
