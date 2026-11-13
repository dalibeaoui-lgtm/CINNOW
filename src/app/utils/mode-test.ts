// Mode test : taper « admin » dans un champ le fait accepter sans vérification
// (carte bancaire, e-mail, connexion…), pour essayer tout le parcours sans vraies données.
// ⚠ À retirer avant d'accepter de vrais paiements.

export const MOT_TEST = 'admin';

// Vrai si le texte est exactement « admin » (majuscules et espaces ignorés)
export function estModeTest(texte: string): boolean {
  return texte.trim().toLowerCase() === MOT_TEST;
}

// Vrai pendant qu'on tape « admin » (a, ad, adm…) : les champs qui n'acceptent
// que des chiffres laissent alors passer ces lettres
export function debutDuModeTest(texte: string): boolean {
  const t = texte.trim().toLowerCase();
  return t.length > 0 && MOT_TEST.startsWith(t);
}
