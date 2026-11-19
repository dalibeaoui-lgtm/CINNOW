import { TestBed } from '@angular/core/testing';
import { langueActive } from '../../i18n/langue';
import { Api } from '../../services/api';
import { Compte } from '../../services/compte';
import { Contact } from './contact';

// Page Contact : vérification du formulaire et envoi au serveur (simulé)
describe('pages/Contact', () => {
  // Faux serveur : on note ce qui lui est envoyé
  const envoyes: unknown[] = [];
  const fausseApi = {
    envoyerMessage: async (message: unknown) => (envoyes.push(message), { id: 1 }),
  };
  const fauxCompte = { utilisateur: () => null };

  let page: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<Contact>>;

  const remplir = (selecteur: string, valeur: string) => {
    const champ = page.querySelector<HTMLInputElement | HTMLTextAreaElement>(selecteur)!;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  };
  const envoyer = async () => {
    page.querySelector<HTMLButtonElement>('.formulaire__bouton')!.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    langueActive.set('fr');
    envoyes.length = 0;
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [
        { provide: Api, useValue: fausseApi },
        { provide: Compte, useValue: fauxCompte },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Contact);
    page = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('affiche les coordonnées et la carte du Palm Lake Mall', () => {
    expect(page.textContent).toContain('Palm Lake Mall, 5000 Monastir');
    expect(page.querySelector('.plan iframe')?.getAttribute('src')).toContain('35.76019');
  });

  it('refuse un formulaire vide et affiche une erreur par champ', async () => {
    await envoyer();
    expect(page.querySelectorAll('.erreur').length).toBe(4);
    expect(envoyes).toEqual([]); // rien n'est envoyé au serveur
  });

  it('envoie un formulaire correct et affiche le remerciement', async () => {
    remplir('input[name=nom]', 'Sarra Ben Ali');
    remplir('input[name=email]', 'sarra@exemple.com');
    page.querySelectorAll<HTMLInputElement>('.sujet input')[3].click(); // « Événement ou séance privée »
    remplir('textarea[name=message]', 'Bonjour, je voudrais organiser une séance privée.');
    await fixture.whenStable();

    await envoyer();

    expect(envoyes).toEqual([
      {
        nom: 'Sarra Ben Ali',
        email: 'sarra@exemple.com',
        sujet: 'evenement',
        message: 'Bonjour, je voudrais organiser une séance privée.',
      },
    ]);
    expect(page.querySelector('.merci')?.textContent).toContain('Merci Sarra');
  });
});
