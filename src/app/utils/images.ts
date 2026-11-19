// Photos horizontales des films : chacune existe en 2 tailles.
//   images/hero/whiplash.webp      → 1920 px de large (haut des pages, plein écran)
//   images/hero/800/whiplash.webp  → 800 px de large (cartes, bandeaux) : 5 à 10 fois plus légère

// « images/hero/whiplash.webp » → « images/hero/800/whiplash.webp »
export function photoMoyenne(chemin: string): string {
  return chemin.replace('images/hero/', 'images/hero/800/');
}

// Valeur de l'attribut srcset : le navigateur choisit la taille qu'il lui faut selon l'écran
export function srcsetPhoto(chemin: string): string {
  return `${photoMoyenne(chemin)} 800w, ${chemin} 1920w`;
}
