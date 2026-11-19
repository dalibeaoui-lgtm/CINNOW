// Avis des spectateurs : lecture, publication, modification et suppression.

import { Router } from 'express';
import { versAAAAMMJJ } from '../seances.js';
import { ajouter, lireDonnees, lireListe, remplacer, retirer } from '../stockage.js';

const routeur = Router();

const tousLesAvis = () => [...lireListe('avis'), ...lireDonnees('avis')];
const estUneNote = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

// Vérifie les notes et le commentaire (publication et modification). Renvoie un message d'erreur ou null.
function erreurNotes({ noteFilm, noteService, commentaire }) {
  if (!estUneNote(noteFilm) || !estUneNote(noteService))
    return 'Les notes doivent être des nombres entiers de 1 à 5.';
  if (typeof commentaire !== 'string' || commentaire.length > 400)
    return 'Le commentaire fait 400 caractères maximum.';
  return null;
}

// Un avis publié sur le site, s'il appartient bien à celui qui le demande.
// Pas de vrais comptes sur le serveur pour l'instant : la « preuve » est le numéro du billet
// de la séance notée, que seul son propriétaire connaît (il est gardé dans son compte).
// Les avis d'exemple (donnees/avis.json) n'ont pas de billet : personne ne peut les modifier.
function avisDuProprietaire(req, res) {
  const avis = lireListe('avis').find((a) => a.id === Number(req.params.id));
  if (!avis) {
    res.status(404).json({ message: 'Avis introuvable.' });
    return null;
  }
  if (avis.billetId === undefined || avis.billetId !== req.body?.billetId) {
    res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres avis.' });
    return null;
  }
  return avis;
}

// GET /api/avis          → tous les avis (les plus récents d'abord)
// GET /api/avis?filmId=3 → les avis d'un film
routeur.get('/', (req, res) => {
  const filmId = Number(req.query.filmId);
  const avis = tousLesAvis();
  res.json(filmId ? avis.filter((a) => a.filmId === filmId) : avis);
});

// POST /api/avis  { filmId, billetId?, auteur, noteFilm, noteService, commentaire }
routeur.post('/', (req, res) => {
  const { filmId, billetId, auteur, noteFilm, noteService, commentaire = '' } = req.body ?? {};

  // Le serveur vérifie tout : on ne fait jamais confiance à ce qu'envoie le navigateur
  if (!lireDonnees('films').some((f) => f.id === filmId)) {
    return res.status(400).json({ message: 'Ce film n’existe pas.' });
  }
  const erreur = erreurNotes({ noteFilm, noteService, commentaire });
  if (erreur) return res.status(400).json({ message: erreur });
  if (typeof auteur !== 'string' || !auteur.trim() || auteur.length > 60) {
    return res
      .status(400)
      .json({ message: 'Le nom de l’auteur est obligatoire (60 caractères maximum).' });
  }
  if (billetId !== undefined && tousLesAvis().some((a) => a.billetId === billetId)) {
    return res.status(409).json({ message: 'Cette séance a déjà été notée.' });
  }

  const avis = ajouter('avis', {
    id: Date.now(),
    filmId,
    ...(billetId !== undefined && { billetId }),
    auteur: auteur.trim(),
    noteFilm,
    noteService,
    commentaire: commentaire.trim(),
    date: versAAAAMMJJ(new Date()),
  });
  res.status(201).json(avis);
});

// PUT /api/avis/1794572173278  { billetId, noteFilm, noteService, commentaire } → avis mis à jour
routeur.put('/:id', (req, res) => {
  const avis = avisDuProprietaire(req, res);
  if (!avis) return;
  const { noteFilm, noteService, commentaire = '' } = req.body;
  const erreur = erreurNotes({ noteFilm, noteService, commentaire });
  if (erreur) return res.status(400).json({ message: erreur });

  res.json(
    remplacer('avis', {
      ...avis,
      noteFilm,
      noteService,
      commentaire: commentaire.trim(),
      modifieLe: versAAAAMMJJ(new Date()),
    }),
  );
});

// DELETE /api/avis/1794572173278  { billetId }
routeur.delete('/:id', (req, res) => {
  const avis = avisDuProprietaire(req, res);
  if (!avis) return;
  retirer('avis', avis.id);
  res.status(204).end();
});

export default routeur;
