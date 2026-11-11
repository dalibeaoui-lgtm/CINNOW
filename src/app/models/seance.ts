// Une séance : un film, à une date et une heure, dans une salle
export interface Seance {
  id: number;
  filmId: number;
  date: string; // format AAAA-MM-JJ
  heure: string; // format HH:MM
  salle: number;
  version: 'VF' | 'VO';
  placesOccupees: string[]; // ex. ["A1", "F7"]
}
