import { TestBed } from '@angular/core/testing';
import { Avis } from '../models/avis';
import { Api } from './api';
import { AvisService } from './avis';

const avis = (id: number, noteFilm: number): Avis => ({
  id,
  filmId: 3,
  billetId: id * 10,
  auteur: 'Sarra M.',
  noteFilm,
  noteService: 4,
  commentaire: '',
  date: '2026-11-19',
});

// Avis : la liste affichée sur le site suit les modifications et suppressions faites sur le serveur
describe('services/AvisService', () => {
  let service: AvisService;
  const fausseApi = {
    modifierAvis: vi.fn(async (id: number, m: Partial<Avis>) => ({
      ...avis(id, 0),
      ...m,
      modifieLe: '2026-11-20',
    })),
    supprimerAvis: vi.fn(async () => undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: Api, useValue: fausseApi }] });
    service = TestBed.inject(AvisService);
    service.tous.set([avis(1, 2), avis(2, 5)]);
  });

  it('modifie un avis et envoie le numéro du billet comme preuve', async () => {
    await service.modifier(service.tous()[0], {
      noteFilm: 5,
      noteService: 5,
      commentaire: 'Revu : génial',
    });
    expect(fausseApi.modifierAvis).toHaveBeenCalledWith(1, {
      noteFilm: 5,
      noteService: 5,
      commentaire: 'Revu : génial',
      billetId: 10,
    });
    expect(service.tous()[0]).toMatchObject({
      id: 1,
      noteFilm: 5,
      commentaire: 'Revu : génial',
      modifieLe: '2026-11-20',
    });
    expect(service.tous()[1].noteFilm).toBe(5); // l'autre avis ne change pas
  });

  it('retire un avis supprimé de la liste', async () => {
    await service.supprimer(service.tous()[1]);
    expect(fausseApi.supprimerAvis).toHaveBeenCalledWith(2, 20);
    expect(service.tous().map((a) => a.id)).toEqual([1]);
  });

  it('garde la liste intacte si le serveur refuse', async () => {
    fausseApi.supprimerAvis.mockRejectedValueOnce(new Error('403'));
    await expect(service.supprimer(service.tous()[0])).rejects.toThrow();
    expect(service.tous()).toHaveLength(2);
  });
});
