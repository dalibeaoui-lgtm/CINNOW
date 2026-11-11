import { Produit } from './produit';

// Une réservation : une séance, des places et des snacks éventuels
export interface Reservation {
  id: number;
  seanceId: number;
  places: string[]; // ex. ["F7", "F8"]
  snacks: { produit: Produit; quantite: number }[];
  total: number; // en dinars
}
