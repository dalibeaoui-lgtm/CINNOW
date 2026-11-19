// Tests de l'API (outil de test intégré à Node.js, aucune dépendance à installer).
// Lancement : npm test (dans le dossier backend)
//
// Le serveur est démarré sur un port libre, avec un dossier de stockage temporaire :
// les réservations faites pendant les tests ne se mélangent pas aux vraies.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const PORT = 3998;
const API = `http://localhost:${PORT}/api`;
const stockage = mkdtempSync(join(tmpdir(), 'cinnow-tests-'));
let serveur;

const post = (chemin, corps) =>
  fetch(`${API}${chemin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });

before(async () => {
  serveur = spawn(process.execPath, ['serveur.js'], {
    cwd: join(import.meta.dirname, '..'),
    env: { ...process.env, PORT: String(PORT), CINNOW_STOCKAGE: stockage },
    stdio: 'ignore',
  });
  // On attend que le serveur réponde
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${API}/sante`)).ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('Le serveur ne démarre pas');
});

after(() => {
  serveur?.kill();
  rmSync(stockage, { recursive: true, force: true });
});

// Une séance future et une place libre, pour les tests de réservation
async function seanceLibre() {
  const seances = await (await fetch(`${API}/seances?filmId=1`)).json();
  const demain = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  return seances.find((s) => s.date >= demain);
}

describe('Catalogue', () => {
  it('GET /films renvoie les films avec leurs traductions anglaises', async () => {
    const films = await (await fetch(`${API}/films`)).json();
    assert.ok(films.length >= 9);
    assert.ok(films.every((f) => f.titre && f.traductions?.en?.synopsis));
  });

  it('GET /actualites renvoie les articles du plus récent au plus ancien, traduits', async () => {
    const articles = await (await fetch(`${API}/actualites`)).json();
    assert.ok(articles.length >= 3);
    assert.ok(articles.every((a) => a.titre && a.image && a.traductions?.en?.titre));
    const dates = articles.map((a) => a.date);
    assert.deepEqual(dates, [...dates].sort().reverse());
    assert.equal((await fetch(`${API}/actualites/999`)).status, 404);
  });

  it('GET /films/999 répond 404', async () => {
    assert.equal((await fetch(`${API}/films/999`)).status, 404);
  });

  it('GET /seances?filmId=1 ne renvoie que les séances de ce film', async () => {
    const seances = await (await fetch(`${API}/seances?filmId=1`)).json();
    assert.ok(seances.length > 0);
    assert.ok(seances.every((s) => s.filmId === 1));
  });
});

describe('Réservations', () => {
  it('accepte une réservation et calcule le prix lui-même', async () => {
    const seance = await seanceLibre();
    const reponse = await post('/reservations', {
      seanceId: seance.id,
      places: ['A1', 'A2'],
      snacks: [{ produitId: 1, quantite: 1 }], // popcorn moyen à 7,5 DT
      total: 1, // valeur trichée : le serveur doit l'ignorer
    });
    assert.equal(reponse.status, 201);
    const reservation = await reponse.json();
    assert.equal(reservation.total, 2 * 12 + 7.5);
  });

  it('refuse de vendre deux fois la même place (409)', async () => {
    const seance = await seanceLibre();
    await post('/reservations', { seanceId: seance.id, places: ['C5'] });
    const deuxieme = await post('/reservations', { seanceId: seance.id, places: ['C5'] });
    assert.equal(deuxieme.status, 409);
    assert.deepEqual((await deuxieme.json()).placesPrises, ['C5']);
  });

  it('marque les places réservées comme occupées', async () => {
    const seance = await seanceLibre();
    await post('/reservations', { seanceId: seance.id, places: ['H14'] });
    const aJour = await (await fetch(`${API}/seances/${seance.id}`)).json();
    assert.ok(aJour.placesOccupees.includes('H14'));
  });

  it('refuse une place qui n’existe pas', async () => {
    const seance = await seanceLibre();
    assert.equal(
      (await post('/reservations', { seanceId: seance.id, places: ['Z99'] })).status,
      400,
    );
  });

  it('refuse un poster dans les snacks d’une réservation', async () => {
    const seance = await seanceLibre();
    const reponse = await post('/reservations', {
      seanceId: seance.id,
      places: ['B1'],
      snacks: [{ produitId: 7, quantite: 1 }],
    });
    assert.equal(reponse.status, 400);
  });

  it('annule une réservation et libère ses places', async () => {
    const seance = await seanceLibre();
    const reservation = await (
      await post('/reservations', { seanceId: seance.id, places: ['G3', 'G4'] })
    ).json();

    const reponse = await fetch(`${API}/reservations/${reservation.id}`, { method: 'DELETE' });
    assert.equal(reponse.status, 200);
    assert.equal((await reponse.json()).rembourse, 24);

    const aJour = await (await fetch(`${API}/seances/${seance.id}`)).json();
    assert.ok(!aJour.placesOccupees.includes('G3') && !aJour.placesOccupees.includes('G4'));
    assert.equal(
      (await fetch(`${API}/reservations/${reservation.id}`, { method: 'DELETE' })).status,
      404,
    );
  });

  it('refuse d’annuler moins de 2 h avant la séance (409)', async () => {
    // Réservation écrite directement dans le stockage, pour une séance d'hier (impossible à créer par l'API)
    const seances = await (await fetch(`${API}/seances?filmId=1`)).json();
    const hier = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const passee = seances.find((s) => s.date === hier);
    writeFileSync(
      join(stockage, 'reservations.json'),
      JSON.stringify([{ id: 42, seanceId: passee.id, places: ['A9'], snacks: [], total: 12 }]),
    );
    assert.equal((await fetch(`${API}/reservations/42`, { method: 'DELETE' })).status, 409);
  });
});

describe('Avis et contact', () => {
  it('modifie puis supprime un avis, seulement avec le bon billet', async () => {
    const envoyer = (methode, chemin, corps) =>
      fetch(`${API}${chemin}`, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps),
      });
    const avis = await (
      await post('/avis', { filmId: 1, billetId: 777, auteur: 'Test', noteFilm: 2, noteService: 3 })
    ).json();

    // Mauvais billet : refusé
    assert.equal(
      (await envoyer('PUT', `/avis/${avis.id}`, { billetId: 1, noteFilm: 5, noteService: 5 }))
        .status,
      403,
    );

    const modifie = await envoyer('PUT', `/avis/${avis.id}`, {
      billetId: 777,
      noteFilm: 5,
      noteService: 4,
      commentaire: ' Revu, excellent ! ',
    });
    assert.equal(modifie.status, 200);
    const corps = await modifie.json();
    assert.deepEqual(
      [corps.noteFilm, corps.noteService, corps.commentaire],
      [5, 4, 'Revu, excellent !'],
    );

    assert.equal(
      (await envoyer('PUT', `/avis/${avis.id}`, { billetId: 777, noteFilm: 0, noteService: 4 }))
        .status,
      400,
    );
    assert.equal((await envoyer('DELETE', `/avis/${avis.id}`, { billetId: 777 })).status, 204);
    const restants = await (await fetch(`${API}/avis`)).json();
    assert.ok(!restants.some((a) => a.id === avis.id));
  });

  it('refuse une note en dehors de 1 à 5', async () => {
    const reponse = await post('/avis', { filmId: 1, auteur: 'Test', noteFilm: 9, noteService: 3 });
    assert.equal(reponse.status, 400);
  });

  it('enregistre un message de contact correct', async () => {
    const reponse = await post('/messages', {
      nom: 'Sarra',
      email: 'sarra@exemple.com',
      sujet: 'autre',
      message: 'Bonjour, ceci est un message de test.',
    });
    assert.equal(reponse.status, 201);
  });

  it('refuse un message de contact avec un sujet inconnu', async () => {
    const reponse = await post('/messages', {
      nom: 'Sarra',
      email: 'sarra@exemple.com',
      sujet: 'pirate',
      message: 'Bonjour, ceci est un message de test.',
    });
    assert.equal(reponse.status, 400);
  });

  it('répond proprement à un JSON mal formé', async () => {
    const reponse = await fetch(`${API}/avis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{oups',
    });
    assert.equal(reponse.status, 400);
  });
});
