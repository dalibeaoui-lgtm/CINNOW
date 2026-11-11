// Un avis laissé après une séance : sur le film et sur le service
export interface Avis {
  id: number;
  filmId: number;
  auteur: string;
  noteFilm: number; // sur 5
  noteService: number; // sur 5
  commentaire: string;
  date: string; // format AAAA-MM-JJ
}
