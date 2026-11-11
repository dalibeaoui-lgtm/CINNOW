// Un film programmé au cinéma
export interface Film {
  id: number;
  titre: string;
  realisateur: string;
  duree: number; // en minutes
  genre: string;
  synopsis: string;
  affiche: string; // chemin de l'image, ex. "images/affiches/neons.jpg"
  bandeAnnonce: string; // lien de la vidéo
  note: number; // note moyenne sur 5
  statut: 'a-l-affiche' | 'prochainement';
  dateSortie: string; // format AAAA-MM-JJ
}
