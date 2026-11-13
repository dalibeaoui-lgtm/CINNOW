// Avis des spectateurs : lecture et publication.

import { Router } from 'express';
import { versAAAAMMJJ } from '../seances.js';
import { ajouter, lireDonnees, lireListe } from '../stockage.js';

const routeur = Router();

const tousLesAvis = () => [...lireListe('avis'), ...lireDonnees('avis')];
const estUneNote = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

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
  if (!estUneNote(noteFilm) || !estUneNote(noteService)) {
    return res.status(400).json({ message: 'Les notes doivent être des nombres entiers de 1 à 5.' });
  }
  if (typeof auteur !== 'string' || !auteur.trim() || auteur.length > 60) {
    return res.status(400).json({ message: 'Le nom de l’auteur est obligatoire (60 caractères maximum).' });
  }
  if (typeof commentaire !== 'string' || commentaire.length > 400) {
    return res.status(400).json({ message: 'Le commentaire fait 400 caractères maximum.' });
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

export default routeur;
