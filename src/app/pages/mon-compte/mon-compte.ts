import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QrCode } from '../../components/qr-code/qr-code';
import { LigneProduit } from '../../models/produit';
import { Utilisateur } from '../../models/utilisateur';
import { messageErreur } from '../../services/api';
import { AvisService } from '../../services/avis';
import { Catalogue } from '../../services/catalogue';
import { Compte } from '../../services/compte';
import { CleTraduction, t } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { dateLongue, etoiles, formaterPrix, numeroCourt, seanceEstPassee, versAAAAMMJJ } from '../../utils/formats';
import { estModeTest } from '../../utils/mode-test';

type Onglet = 'billets' | 'commandes' | 'avis' | 'profil';
const ONGLETS: Onglet[] = ['billets', 'commandes', 'avis', 'profil'];

@Component({
  selector: 'app-mon-compte',
  imports: [FormsModule, RouterLink, QrCode, Traduction],
  templateUrl: './mon-compte.html',
  styleUrl: './mon-compte.scss',
})
export class MonCompte {
  // ?onglet=avis dans l'adresse ouvre directement l'onglet des avis (lien « Noter ce film »)
  readonly onglet = input<string>();

  private readonly compte = inject(Compte);
  private readonly avisService = inject(AvisService);
  private readonly catalogue = inject(Catalogue);

  protected readonly utilisateur = this.compte.utilisateur;

  // ---------- Connexion / inscription ----------
  protected readonly mode = signal<'connexion' | 'inscription'>('connexion');
  protected readonly prenom = signal('');
  protected readonly nom = signal('');
  protected readonly email = signal('');
  protected readonly motDePasse = signal('');
  protected readonly erreur = signal('');

  protected changerMode(mode: 'connexion' | 'inscription'): void {
    this.mode.set(mode);
    this.erreur.set('');
  }

  protected valider(): void {
    // Mode test : « admin » comme e-mail ouvre le compte admin@cinnow.tn (voir utils/mode-test.ts)
    const email = estModeTest(this.email()) ? 'admin@cinnow.tn' : this.email().trim().toLowerCase();
    if (this.mode() === 'inscription' && !this.prenom().trim()) {
      return this.erreur.set(t('compte.err.prenom'));
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return this.erreur.set(t('err.email'));
    }
    if (!estModeTest(this.motDePasse()) && this.motDePasse().length < 6) {
      return this.erreur.set(t('compte.err.mdp'));
    }

    if (this.mode() === 'inscription') {
      this.compte.inscription(this.prenom().trim(), this.nom().trim(), email);
    } else {
      this.compte.connexion(email);
    }
    this.motDePasse.set('');
    this.erreur.set('');
  }

  // ---------- Onglets ----------
  // « libelle » : clé du texte, traduite dans le HTML
  protected readonly onglets: { id: Onglet; libelle: CleTraduction }[] = [
    { id: 'billets', libelle: 'compte.onglet.billets' },
    { id: 'commandes', libelle: 'compte.onglet.commandes' },
    { id: 'avis', libelle: 'compte.onglet.avis' },
    { id: 'profil', libelle: 'compte.onglet.profil' },
  ];

  protected readonly ongletActif = linkedSignal<Onglet>(() => {
    const demande = this.onglet() as Onglet;
    return ONGLETS.includes(demande) ? demande : 'billets';
  });

  // ---------- Billets ----------
  // Chaque billet avec sa séance et son film
  private readonly billets = computed(() =>
    this.compte.billets().flatMap((billet) => {
      const seance = this.catalogue.seance(billet.seanceId);
      const film = this.catalogue.film(seance?.filmId);
      return seance && film ? [{ billet, seance, film, passe: seanceEstPassee(seance) }] : [];
    }),
  );

  protected readonly aVenir = computed(() =>
    this.billets()
      .filter((b) => !b.passe)
      .sort((a, b) => `${a.seance.date}${a.seance.heure}`.localeCompare(`${b.seance.date}${b.seance.heure}`)),
  );

  protected readonly passes = computed(() =>
    this.billets()
      .filter((b) => b.passe)
      .sort((a, b) => `${b.seance.date}${b.seance.heure}`.localeCompare(`${a.seance.date}${a.seance.heure}`)),
  );

  // « 1 × Popcorn moyen, 2 × Boisson 50 cl »
  protected texteArticles(lignes: LigneProduit[]): string {
    return lignes.map((ligne) => `${ligne.quantite} × ${this.catalogue.nomProduit(ligne.produit)}`).join(', ');
  }

  // ---------- Commandes de la boutique ----------
  protected readonly commandes = this.compte.commandes;

  // ---------- Avis ----------
  private readonly idsBillets = computed(() => new Set(this.compte.billets().map((b) => b.id)));

  protected readonly mesAvis = computed(() =>
    this.avisService
      .tous()
      .filter((avis) => avis.billetId !== undefined && this.idsBillets().has(avis.billetId))
      .map((avis) => ({ avis, film: this.catalogue.film(avis.filmId) })),
  );

  protected avisDuBillet(idBillet: number) {
    return this.mesAvis().find(({ avis }) => avis.billetId === idBillet)?.avis;
  }

  // Séances passées pas encore notées
  protected readonly aNoter = computed(() => this.passes().filter(({ billet }) => !this.avisDuBillet(billet.id)));

  // Formulaire de notation (un seul ouvert à la fois)
  protected readonly billetANoter = signal<number | null>(null);
  protected readonly noteFilm = signal(0);
  protected readonly noteService = signal(0);
  protected readonly commentaire = signal('');
  protected readonly erreurAvis = signal('');
  protected readonly notes = [1, 2, 3, 4, 5];

  protected ouvrirNotation(idBillet: number): void {
    this.ongletActif.set('avis');
    this.billetANoter.set(idBillet);
    this.noteFilm.set(0);
    this.noteService.set(0);
    this.commentaire.set('');
    this.erreurAvis.set('');
  }

  // L'avis est envoyé au serveur : il devient visible par tous les visiteurs sur la fiche du film
  protected async publierAvis(idBillet: number, idFilm: number): Promise<void> {
    const utilisateur = this.utilisateur();
    if (!utilisateur) return;
    if (!this.noteFilm() || !this.noteService()) {
      return this.erreurAvis.set(t('compte.err.notes'));
    }

    try {
      await this.avisService.publier({
        filmId: idFilm,
        billetId: idBillet,
        auteur: `${utilisateur.prenom}${utilisateur.nom ? ' ' + utilisateur.nom.charAt(0) + '.' : ''}`,
        noteFilm: this.noteFilm(),
        noteService: this.noteService(),
        commentaire: this.commentaire().trim(),
      });
      this.billetANoter.set(null);
    } catch (erreur) {
      this.erreurAvis.set(messageErreur(erreur));
    }
  }

  // ---------- Profil ----------
  // Copies modifiables du profil (remises à jour si le compte change)
  protected readonly profilPrenom = linkedSignal(() => this.utilisateur()?.prenom ?? '');
  protected readonly profilNom = linkedSignal(() => this.utilisateur()?.nom ?? '');
  protected readonly profilEmail = linkedSignal(() => this.utilisateur()?.email ?? '');
  protected readonly profilTelephone = linkedSignal(() => this.utilisateur()?.telephone ?? '');
  protected readonly profilVersion = linkedSignal<Utilisateur['versionPreferee']>(
    () => this.utilisateur()?.versionPreferee ?? 'peu-importe',
  );
  protected readonly profilNewsletter = linkedSignal(() => this.utilisateur()?.newsletter ?? false);
  protected readonly profilEnregistre = signal(false);
  protected readonly erreurProfil = signal('');

  protected enregistrerProfil(): void {
    const email = this.profilEmail().trim().toLowerCase();
    if (!this.profilPrenom().trim()) return this.erreurProfil.set(t('compte.err.prenomObligatoire'));
    if (!/^\S+@\S+\.\S+$/.test(email)) return this.erreurProfil.set(t('err.email'));

    this.compte.modifierProfil({
      prenom: this.profilPrenom().trim(),
      nom: this.profilNom().trim(),
      email,
      telephone: this.profilTelephone().trim(),
      versionPreferee: this.profilVersion(),
      newsletter: this.profilNewsletter(),
    });
    this.erreurProfil.set('');
    this.profilEnregistre.set(true);
  }

  protected deconnexion(): void {
    this.compte.deconnexion();
    this.ongletActif.set('billets');
    this.billetANoter.set(null);
  }

  // Fonctions utilisées dans le HTML
  protected readonly dateLongue = dateLongue;
  protected readonly etoiles = etoiles;
  protected readonly formaterPrix = formaterPrix;
  protected readonly numeroCourt = numeroCourt;
}
