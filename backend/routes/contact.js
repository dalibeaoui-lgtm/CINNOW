// Messages envoyés depuis la page Contact.

import { Router } from 'express';
import { versAAAAMMJJ } from '../seances.js';
import { ajouter } from '../stockage.js';

const routeur = Router();

const SUJETS = ['reservation', 'paiement', 'boutique', 'evenement', 'autre'];

// POST /api/messages  { nom, email, sujet, message }
// Le message est gardé dans backend/stockage/messages.json (plus tard : base de données + e-mail à l'équipe)
routeur.post('/', (req, res) => {
  const { nom, email, sujet, message } = req.body ?? {};

  // Le serveur vérifie tout, même si la page a déjà vérifié
  if (typeof nom !== 'string' || nom.trim().length < 2 || nom.length > 80) {
    return res.status(400).json({ message: 'Le nom doit faire entre 2 et 80 caractères.' });
  }
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ message: 'Adresse e-mail invalide.' });
  }
  if (!SUJETS.includes(sujet)) {
    return res.status(400).json({ message: 'Sujet inconnu.' });
  }
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 1000) {
    return res.status(400).json({ message: 'Le message doit faire entre 10 et 1000 caractères.' });
  }

  const enregistre = ajouter('messages', {
    id: Date.now(),
    nom: nom.trim(),
    email: email.trim().toLowerCase(),
    sujet,
    message: message.trim(),
    date: versAAAAMMJJ(new Date()),
  });
  res.status(201).json({ id: enregistre.id });
});

export default routeur;
