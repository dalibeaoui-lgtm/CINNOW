// Plan d'une salle et prix d'une place (envoyés par le serveur : GET /api/salle)
export interface Salle {
  rangees: string[]; // ex. ["A", "B", …, "H"]
  placesParRangee: number;
  alleesApres: number[]; // une allée après ces numéros de place
  prixPlace: number; // en dinars
  maxPlaces: number; // par réservation
}
