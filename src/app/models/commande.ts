import { LigneProduit } from './produit';

// Une commande de la boutique, à retirer au comptoir
export interface Commande {
  id: number;
  articles: LigneProduit[];
  total: number; // en dinars
  date: string; // format AAAA-MM-JJ
}
