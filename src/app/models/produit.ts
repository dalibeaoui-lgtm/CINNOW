// Un produit de la boutique : snack, boisson ou poster
export interface Produit {
  id: number;
  nom: string;
  description: string;
  prix: number; // en dinars
  categorie: 'snack' | 'boisson' | 'poster';
  image: string; // vide = pas encore de photo (la boutique affiche une vignette de couleur)
  // Textes en anglais (envoyés par le serveur), utilisés quand la langue est l'anglais
  traductions?: { en?: Partial<Pick<Produit, 'nom' | 'description'>> };
}

// Un produit et sa quantité (panier, snacks d'une réservation, commande)
export interface LigneProduit {
  produit: Produit;
  quantite: number;
}
