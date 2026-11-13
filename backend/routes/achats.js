// Réservations de places et commandes de la boutique.
//
// Le navigateur envoie seulement CE QU'IL VEUT (séance, places, produits et quantités).
// Le serveur vérifie que c'est possible et calcule lui-même le prix : impossible de payer
// 1 DT en modifiant la page, ni de réserver une place déjà prise.

import { Router } from 'express';
import { estPassee, trouverSeance, versAAAAMMJJ } from '../seances.js';
import { ajouter, lireDonnees } from '../stockage.js';

const routeur = Router();

// [{ produitId: 2, quantite: 1 }] → [{ produit: {…}, quantite: 1 }], ou un message d'erreur
function lireArticles(articles, categoriesPermises) {
  if (!Array.isArray(articles)) return { erreur: 'La liste des articles est invalide.' };
  const produits = lireDonnees('produits');
  const lignes = [];

  for (const { produitId, quantite } of articles) {
    const produit = produits.find((p) => p.id === produitId);
    if (!produit || (categoriesPermises && !categoriesPermises.includes(produit.categorie))) {
      return { erreur: `Le produit n° ${produitId} n’est pas disponible.` };
    }
    if (!Number.isInteger(quantite) || quantite < 1 || quantite > 10) {
      return { erreur: `Quantité invalide pour « ${produit.nom} » (1 à 10).` };
    }
    lignes.push({ produit, quantite });
  }
  return { lignes };
}

const totalArticles = (lignes) => lignes.reduce((somme, l) => somme + l.produit.prix * l.quantite, 0);

// POST /api/reservations  { seanceId, places: ["F7", "F8"], snacks: [{ produitId, quantite }] }
routeur.post('/reservations', (req, res) => {
  const { seanceId, places, snacks = [] } = req.body ?? {};
  const salle = lireDonnees('salle');

  const seance = trouverSeance(seanceId);
  if (!seance) return res.status(404).json({ message: 'Séance introuvable.' });
  if (estPassee(seance)) return res.status(410).json({ message: 'Cette séance a déjà commencé.' });

  if (!Array.isArray(places) || places.length === 0 || places.length > salle.maxPlaces) {
    return res.status(400).json({ message: `Choisissez entre 1 et ${salle.maxPlaces} places.` });
  }
  if (new Set(places).size !== places.length) {
    return res.status(400).json({ message: 'Une même place est demandée deux fois.' });
  }

  // Chaque place doit exister dans la salle : une rangée connue (A…H) et un numéro (1…14)
  const existe = (place) =>
    typeof place === 'string' &&
    salle.rangees.includes(place[0]) &&
    Number(place.slice(1)) >= 1 &&
    Number(place.slice(1)) <= salle.placesParRangee &&
    String(Number(place.slice(1))) === place.slice(1);
  const inconnues = places.filter((p) => !existe(p));
  if (inconnues.length) return res.status(400).json({ message: `Places inconnues : ${inconnues.join(', ')}.` });

  // LA vérification importante : personne d'autre n'a pris ces places entre-temps
  const dejaPrises = places.filter((p) => seance.placesOccupees.includes(p));
  if (dejaPrises.length) {
    return res.status(409).json({
      message: `Désolé, ${dejaPrises.length > 1 ? 'les places' : 'la place'} ${dejaPrises.join(', ')} ${dejaPrises.length > 1 ? 'viennent' : 'vient'} d’être ${dejaPrises.length > 1 ? 'réservées' : 'réservée'} par quelqu’un d’autre.`,
      placesPrises: dejaPrises,
    });
  }

  const { lignes, erreur } = lireArticles(snacks, ['snack', 'boisson']);
  if (erreur) return res.status(400).json({ message: erreur });

  const reservation = ajouter('reservations', {
    id: Date.now(),
    seanceId,
    places,
    snacks: lignes,
    total: places.length * salle.prixPlace + totalArticles(lignes),
  });
  res.status(201).json(reservation);
});

// POST /api/commandes  { articles: [{ produitId, quantite }] }
routeur.post('/commandes', (req, res) => {
  const { lignes, erreur } = lireArticles(req.body?.articles);
  if (erreur) return res.status(400).json({ message: erreur });
  if (!lignes.length) return res.status(400).json({ message: 'Le panier est vide.' });

  const commande = ajouter('commandes', {
    id: Date.now(),
    articles: lignes,
    total: totalArticles(lignes),
    date: versAAAAMMJJ(new Date()),
  });
  res.status(201).json(commande);
});

export default routeur;
