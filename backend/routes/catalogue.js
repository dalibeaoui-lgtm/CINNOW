// Lecture du catalogue : films, séances, produits de la boutique, plan de salle.

import { Router } from 'express';
import { toutesLesSeances, trouverSeance } from '../seances.js';
import { lireDonnees } from '../stockage.js';

const routeur = Router();

// GET /api/films
routeur.get('/films', (req, res) => {
  res.json(lireDonnees('films'));
});

// GET /api/films/3
routeur.get('/films/:id', (req, res) => {
  const film = lireDonnees('films').find((f) => f.id === Number(req.params.id));
  if (!film) return res.status(404).json({ message: 'Film introuvable.' });
  res.json(film);
});

// GET /api/seances          → toutes les séances
// GET /api/seances?filmId=3 → les séances d'un film
routeur.get('/seances', (req, res) => {
  const filmId = Number(req.query.filmId);
  const seances = toutesLesSeances();
  res.json(filmId ? seances.filter((s) => s.filmId === filmId) : seances);
});

// GET /api/seances/1202611131400 → une séance, avec ses places occupées à la seconde près
routeur.get('/seances/:id', (req, res) => {
  const seance = trouverSeance(Number(req.params.id));
  if (!seance) return res.status(404).json({ message: 'Séance introuvable.' });
  res.json(seance);
});

// GET /api/produits
routeur.get('/produits', (req, res) => {
  res.json(lireDonnees('produits'));
});

// GET /api/salle → rangées, places par rangée, allées, prix d'une place
routeur.get('/salle', (req, res) => {
  res.json(lireDonnees('salle'));
});

export default routeur;
