// Un film programmé au cinéma
export interface Film {
  id: number;
  titre: string;
  realisateur: string;
  duree: number; // en minutes
  genre: string;
  synopsis: string;
  affiche: string; // affiche verticale, ex. "images/affiches/whiplash.webp"
  photo?: string; // grande photo horizontale (haut de la fiche film, slides de l'accueil)
  aLaUne?: boolean; // true : le film a une slide plein écran en haut de l'accueil (il lui faut une photo)
  bandeAnnonce: string; // lien de la vidéo
  note: number; // note moyenne sur 5
  statut: 'a-l-affiche' | 'prochainement';
  dateSortie: string; // format AAAA-MM-JJ
  // Textes en anglais (envoyés par le serveur). Le site les utilise quand la langue est l'anglais.
  traductions?: { en?: Partial<Pick<Film, 'titre' | 'genre' | 'synopsis'>> };
}
