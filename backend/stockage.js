// Lecture et écriture des données dans des fichiers JSON.
//
// - donnees/  : données de départ (films, snacks, avis d'exemple, plan de salle), suivies par git.
// - stockage/ : ce que les visiteurs créent (réservations, commandes, avis), créé automatiquement
//               au premier lancement et ignoré par git.
//
// Plus tard, ces fichiers seront remplacés par la base PostgreSQL (rapport, partie 4).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dossier = dirname(fileURLToPath(import.meta.url));
const DONNEES = join(dossier, 'donnees');
// CINNOW_STOCKAGE : autre dossier possible (les tests en utilisent un temporaire, pour ne pas
// mélanger leurs réservations avec les vraies)
const STOCKAGE = process.env.CINNOW_STOCKAGE ?? join(dossier, 'stockage');

// Données de départ (lecture seule)
export function lireDonnees(nom) {
  return JSON.parse(readFileSync(join(DONNEES, `${nom}.json`), 'utf8'));
}

// Données créées par les visiteurs : une liste par fichier (tableau vide si le fichier n'existe pas encore)
export function lireListe(nom) {
  const fichier = join(STOCKAGE, `${nom}.json`);
  return existsSync(fichier) ? JSON.parse(readFileSync(fichier, 'utf8')) : [];
}

export function ecrireListe(nom, liste) {
  mkdirSync(STOCKAGE, { recursive: true });
  // Écriture « synchrone » : pendant l'écriture, aucune autre requête n'est traitée.
  // C'est ce qui empêche deux personnes de réserver la même place au même moment.
  writeFileSync(join(STOCKAGE, `${nom}.json`), JSON.stringify(liste, null, 2) + '\n');
}

// Ajoute un élément au début d'une liste et l'enregistre
export function ajouter(nom, element) {
  ecrireListe(nom, [element, ...lireListe(nom)]);
  return element;
}

// Remplace l'élément qui a ce numéro par sa nouvelle version (mise à jour)
export function remplacer(nom, element) {
  ecrireListe(
    nom,
    lireListe(nom).map((e) => (e.id === element.id ? element : e)),
  );
  return element;
}

// Retire l'élément qui a ce numéro
export function retirer(nom, id) {
  ecrireListe(
    nom,
    lireListe(nom).filter((e) => e.id !== id),
  );
}
