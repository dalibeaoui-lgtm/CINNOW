import { LigneProduit } from './produit';

// Une réservation : une séance, des places et des snacks éventuels
export interface Reservation {
  id: number;
  seanceId: number;
  places: string[]; // ex. ["F7", "F8"]
  snacks: LigneProduit[];
  total: number; // en dinars
}
