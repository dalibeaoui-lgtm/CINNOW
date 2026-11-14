import { TestBed } from '@angular/core/testing';
import { Produit } from '../models/produit';
import { Panier } from './panier';

const popcorn: Produit = { id: 1, nom: 'Popcorn moyen', description: '', prix: 7.5, categorie: 'snack', image: '' };
const poster: Produit = { id: 7, nom: 'Poster The Batman', description: '', prix: 25, categorie: 'poster', image: '' };

// Panier de la boutique
describe('services/Panier', () => {
  let panier: Panier;

  beforeEach(() => {
    localStorage.clear(); // chaque test part d'un panier vide
    TestBed.configureTestingModule({});
    panier = TestBed.inject(Panier);
  });

  it('est vide au départ', () => {
    expect(panier.nombre()).toBe(0);
    expect(panier.total()).toBe(0);
  });

  it('additionne les quantités et les prix', () => {
    panier.ajouter(popcorn);
    panier.ajouter(popcorn);
    panier.ajouter(poster);
    expect(panier.quantite(popcorn.id)).toBe(2);
    expect(panier.nombre()).toBe(3);
    expect(panier.total()).toBe(2 * 7.5 + 25);
  });

  it('retire un produit quand sa quantité arrive à 0', () => {
    panier.ajouter(poster);
    panier.changerQuantite(poster, -1);
    expect(panier.lignes()).toEqual([]);
  });

  it('ne dépasse pas 10 exemplaires d’un produit', () => {
    for (let i = 0; i < 15; i++) panier.ajouter(popcorn);
    expect(panier.quantite(popcorn.id)).toBe(10);
  });

  it('se vide en un clic', () => {
    panier.ajouter(popcorn);
    panier.ajouter(poster);
    panier.vider();
    expect(panier.nombre()).toBe(0);
  });

  it('est gardé dans le navigateur (localStorage)', () => {
    panier.ajouter(poster);
    TestBed.tick(); // laisse l'effet d'enregistrement s'exécuter
    expect(localStorage.getItem('cinnow-panier')).toContain('Poster The Batman');
  });
});
