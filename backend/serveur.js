// Serveur de l'API CINNOW (Node.js + Express).
// Lancement : npm start (dans ce dossier), puis http://localhost:3000/api/films

import express from 'express';
import routesAchats from './routes/achats.js';
import routesAvis from './routes/avis.js';
import routesCatalogue from './routes/catalogue.js';

const PORT = process.env.PORT ?? 3000;
const app = express();

// Lit le corps des requêtes envoyées en JSON (POST)
app.use(express.json({ limit: '20kb' }));

// Affiche chaque requête dans le terminal : « POST /api/reservations → 201 (12 ms) »
app.use((req, res, next) => {
  const debut = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - debut} ms)`));
  next();
});

// Pour vérifier que le serveur tourne
app.get('/api/sante', (req, res) => res.json({ ok: true }));

app.use('/api', routesCatalogue); // /api/films, /api/seances, /api/produits, /api/salle
app.use('/api', routesAchats); //    /api/reservations, /api/commandes
app.use('/api/avis', routesAvis); // /api/avis

// Adresse inconnue
app.use((req, res) => res.status(404).json({ message: `Aucune route ${req.method} ${req.path}.` }));

// Erreur imprévue (ou JSON mal formé) : on répond proprement au lieu de planter
app.use((erreur, req, res, next) => {
  if (erreur.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON invalide.' });
  console.error(erreur);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

app.listen(PORT, () => {
  console.log(`API CINNOW prête sur http://localhost:${PORT}/api`);
});
