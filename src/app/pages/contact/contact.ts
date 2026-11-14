import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apparition } from '../../directives/apparition';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Api, messageErreur } from '../../services/api';
import { Compte } from '../../services/compte';

type Champ = 'nom' | 'email' | 'sujet' | 'message';
const MAX_MESSAGE = 1000;

// Page Contact (sitemap) : formulaire de contact, coordonnées et horaires, plan d'accès.
// Le message est envoyé au serveur (POST /api/messages), qui le vérifie et l'enregistre.
@Component({
  selector: 'app-contact',
  imports: [FormsModule, Apparition, Traduction],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly api = inject(Api);
  private readonly utilisateur = inject(Compte).utilisateur;

  // « libelle » : clé du texte, traduite dans le HTML
  protected readonly sujets: { id: string; libelle: CleTraduction }[] = [
    { id: 'reservation', libelle: 'contact.sujet.reservation' },
    { id: 'paiement', libelle: 'contact.sujet.paiement' },
    { id: 'boutique', libelle: 'contact.sujet.boutique' },
    { id: 'evenement', libelle: 'contact.sujet.evenement' },
    { id: 'autre', libelle: 'contact.sujet.autre' },
  ];

  // Champs du formulaire (nom et e-mail déjà remplis si quelqu'un est connecté)
  protected readonly nom = linkedSignal(() => {
    const u = this.utilisateur();
    return u ? `${u.prenom} ${u.nom}`.trim() : '';
  });
  protected readonly email = linkedSignal(() => this.utilisateur()?.email ?? '');
  protected readonly sujet = signal('');
  protected readonly message = signal('');
  protected readonly maxMessage = MAX_MESSAGE;

  protected readonly erreurs = signal<Partial<Record<Champ, CleTraduction>>>({});
  protected readonly erreurServeur = signal('');
  protected readonly envoiEnCours = signal(false);

  // Après l'envoi : le formulaire est remplacé par un message de remerciement
  protected readonly envoye = signal<{ nom: string; email: string } | null>(null);

  protected readonly presquePlein = computed(() => this.message().length > MAX_MESSAGE * 0.9);

  private verifier(): Partial<Record<Champ, CleTraduction>> {
    const erreurs: Partial<Record<Champ, CleTraduction>> = {};
    if (this.nom().trim().length < 2) erreurs.nom = 'contact.err.nom';
    if (!/^\S+@\S+\.\S+$/.test(this.email().trim())) erreurs.email = 'err.email';
    if (!this.sujet()) erreurs.sujet = 'contact.err.sujet';
    if (this.message().trim().length < 10) erreurs.message = 'contact.err.message';
    return erreurs;
  }

  protected async envoyer(): Promise<void> {
    if (this.envoiEnCours()) return;
    const erreurs = this.verifier();
    this.erreurs.set(erreurs);
    this.erreurServeur.set('');
    if (Object.keys(erreurs).length) return;

    this.envoiEnCours.set(true);
    try {
      await this.api.envoyerMessage({
        nom: this.nom().trim(),
        email: this.email().trim(),
        sujet: this.sujet(),
        message: this.message().trim(),
      });
      this.envoye.set({ nom: this.nom().trim().split(' ')[0], email: this.email().trim() });
      this.sujet.set('');
      this.message.set('');
    } catch (erreur) {
      this.erreurServeur.set(messageErreur(erreur));
    } finally {
      this.envoiEnCours.set(false);
    }
  }

  protected nouveauMessage(): void {
    this.envoye.set(null);
    this.erreurs.set({});
  }
}
