import { Produit } from '../models/produit';
import { Reservation } from '../models/reservation';
import { Seance } from '../models/seance';
import { seanceEstPassee, versAAAAMMJJ } from '../utils/formats';

// Billets donnés à un nouveau compte, pour que « Mon compte » ne soit pas vide pendant la démo :
// 1 séance à venir et 2 séances déjà passées (à noter).
// Les séances et les produits viennent du serveur (service Catalogue).
export function billetsDeDemo(
  seances: Seance[],
  produits: Produit[],
  prixPlace: number,
): Reservation[] {
  const aujourdhui = versAAAAMMJJ(new Date());
  const aVenir = seances.filter((s) => !seanceEstPassee(s) && s.date > aujourdhui);
  const passees = seances.filter((s) => s.date < aujourdhui);

  const choix = [
    {
      seance: aVenir.find((s) => s.filmId === 1 && s.version === 'VO'),
      places: ['E7', 'E8'],
      snacks: [
        { id: 2, quantite: 1 },
        { id: 5, quantite: 2 },
      ],
    },
    { seance: passees.filter((s) => s.filmId === 3).at(-1), places: ['D5'], snacks: [] },
    {
      seance: passees.filter((s) => s.filmId === 2).at(-12),
      places: ['F9', 'F10'],
      snacks: [{ id: 6, quantite: 1 }],
    },
  ];

  const billets: Reservation[] = [];
  choix.forEach(({ seance, places, snacks }, i) => {
    if (!seance) return;
    const lignes = snacks.flatMap(({ id, quantite }) => {
      const produit = produits.find((p) => p.id === id);
      return produit ? [{ produit, quantite }] : [];
    });
    billets.push({
      id: Date.now() + i, // numéro unique
      seanceId: seance.id,
      places,
      snacks: lignes,
      total:
        places.length * prixPlace +
        lignes.reduce((somme, l) => somme + l.produit.prix * l.quantite, 0),
    });
  });
  return billets;
}
