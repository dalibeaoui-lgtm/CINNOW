// Lire et écrire dans le localStorage du navigateur.
// Le stockage peut être bloqué (navigation privée, cookies refusés) :
// dans ce cas on continue sans rien enregistrer, le site marche quand même.

export function lireStockage<T>(cle: string, valeurParDefaut: T): T {
  try {
    const texte = localStorage.getItem(cle);
    return texte ? (JSON.parse(texte) as T) : valeurParDefaut;
  } catch {
    return valeurParDefaut;
  }
}

export function ecrireStockage(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage indisponible : tant pis, rien n'est gardé après un rechargement
  }
}
