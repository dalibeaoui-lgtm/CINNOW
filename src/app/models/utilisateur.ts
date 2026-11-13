// Un spectateur inscrit sur CINNOW
export interface Utilisateur {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  versionPreferee: 'VF' | 'VO' | 'peu-importe';
  newsletter: boolean; // recevoir les sorties de la semaine par e-mail
}
