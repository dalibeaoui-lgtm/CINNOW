// Un avis laissé après une séance : sur le film et sur le service
export interface Avis {
  id: number;
  filmId: number;
  auteur: string;
  noteFilm: number; // sur 5
  noteService: number; // sur 5
  commentaire: string;
  date: string; // format AAAA-MM-JJ
  billetId?: number; // le billet de la séance notée (avis laissés depuis « Mon compte »)
  modifieLe?: string; // date de la dernière modification (AAAA-MM-JJ), s'il a été modifié
}
