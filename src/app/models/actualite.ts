// Un article de la page Actualités
export interface Actualite {
  id: number;
  categorie: 'avant-premiere' | 'evenement' | 'cinema';
  date: string; // date de publication, format AAAA-MM-JJ
  aLaUne?: boolean; // true : l'article est mis en grand en haut de la page
  titre: string;
  chapo: string; // court résumé, affiché sous le titre
  paragraphes: string[];
  image: string; // photo horizontale, ex. "images/hero/midsommar.webp"
  filmId?: number; // film dont parle l'article (lien vers sa fiche)
  // Textes en anglais (envoyés par le serveur), utilisés quand la langue est l'anglais
  traductions?: { en?: Partial<Pick<Actualite, 'titre' | 'chapo' | 'paragraphes'>> };
}
