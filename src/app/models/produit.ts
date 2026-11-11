// Un produit de la boutique : snack, boisson, poster ou goodie
export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number; // en dinars
  categorie: 'snack' | 'boisson' | 'poster' | 'goodie';
  image: string;
}
