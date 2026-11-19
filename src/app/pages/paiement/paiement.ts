import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Etapes } from '../../components/etapes/etapes';
import { CleTraduction, t } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Produit } from '../../models/produit';
import { Api, messageErreur } from '../../services/api';
import { Catalogue } from '../../services/catalogue';
import { Compte } from '../../services/compte';
import { DernierAchat, MoyenPaiement } from '../../services/dernier-achat';
import { Panier } from '../../services/panier';
import { ReservationEnCours } from '../../services/reservation-en-cours';
import { dateLongue, formaterPrix, seanceEstPassee } from '../../utils/formats';
import { debutDuModeTest, estModeTest } from '../../utils/mode-test';

type Champ = 'nom' | 'numero' | 'expiration' | 'cvc' | 'email';

// « 4970123412341234 » → « 4970 1234 1234 1234 »
const enGroupesDe4 = (texte: string) =>
  texte
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

// « 0827 » → « 08 / 27 »
const enMoisAnnee = (texte: string) => {
  const chiffres = texte.replace(/\D/g, '').slice(0, 4);
  return chiffres.length > 2 ? `${chiffres.slice(0, 2)} / ${chiffres.slice(2)}` : chiffres;
};

// ⚠ Paiement simulé : aucun argent n'est débité et le numéro de carte n'est ni envoyé ni enregistré.
// En cliquant sur « Payer », seule la réservation (séance, places, snacks) ou la commande est
// envoyée au serveur, qui vérifie les places et calcule le prix. Stripe (mode test) viendra plus tard.
@Component({
  selector: 'app-paiement',
  imports: [FormsModule, RouterLink, Etapes, Traduction],
  templateUrl: './paiement.html',
  styleUrl: './paiement.scss',
})
export class Paiement {
  // ?commande=boutique : on paie le panier de la boutique au lieu d'une réservation
  readonly commande = input<string>();

  private readonly router = inject(Router);
  private readonly api = inject(Api);
  private readonly catalogue = inject(Catalogue);
  private readonly reservationEnCours = inject(ReservationEnCours);
  private readonly panier = inject(Panier);
  private readonly compte = inject(Compte);
  private readonly dernierAchat = inject(DernierAchat);

  protected readonly estBoutique = computed(() => this.commande() === 'boutique');

  // ---------- Ce qu'on paie ----------
  protected readonly reservation = computed(() =>
    this.estBoutique() ? null : this.reservationEnCours.reservation(),
  );

  // La séance doit encore exister et ne pas avoir commencé
  protected readonly seance = computed(() => {
    const seance = this.catalogue.seance(this.reservation()?.seanceId);
    return seance && !seanceEstPassee(seance) ? seance : undefined;
  });
  protected readonly film = computed(() => this.catalogue.film(this.seance()?.filmId));

  protected readonly lignes = computed(() =>
    this.estBoutique() ? this.panier.lignes() : (this.reservation()?.snacks ?? []),
  );
  protected readonly total = computed(() =>
    this.estBoutique() ? this.panier.total() : (this.reservation()?.total ?? 0),
  );
  protected readonly rienAPayer = computed(() =>
    this.estBoutique() ? !this.panier.nombre() : !this.seance(),
  );

  protected readonly prixPlace = this.catalogue.salle().prixPlace;

  // ---------- Formulaire ----------
  // « libelle » : clé du texte, traduite dans le HTML
  protected readonly moyens: { id: MoyenPaiement; libelle: CleTraduction }[] = [
    { id: 'carte', libelle: 'pay.carte' },
    { id: 'e-dinar', libelle: 'pay.edinar' },
    { id: 'comptoir', libelle: 'pay.comptoir' },
  ];
  protected readonly moyen = signal<MoyenPaiement>('carte');

  private readonly utilisateur = this.compte.utilisateur;
  protected readonly nom = linkedSignal(() => {
    const u = this.utilisateur();
    return u ? `${u.prenom} ${u.nom}`.trim() : '';
  });
  protected readonly numero = signal('');
  protected readonly expiration = signal('');
  protected readonly cvc = signal('');
  protected readonly envoyerEmail = signal(true);
  protected readonly email = linkedSignal(() => this.utilisateur()?.email ?? '');

  // Pour chaque champ en erreur : la clé du message (traduit dans le HTML)
  protected readonly erreurs = signal<Partial<Record<Champ, CleTraduction>>>({});
  protected readonly paiementEnCours = signal(false);

  // Les champs de chiffres se mettent en forme tout seuls… sauf si on est en train de taper « admin »
  protected changerNumero(valeur: string): void {
    this.numero.set(debutDuModeTest(valeur) ? valeur.trim() : enGroupesDe4(valeur));
  }

  protected changerExpiration(valeur: string): void {
    this.expiration.set(debutDuModeTest(valeur) ? valeur.trim() : enMoisAnnee(valeur));
  }

  protected changerCvc(valeur: string): void {
    this.cvc.set(debutDuModeTest(valeur) ? valeur.trim() : valeur.replace(/\D/g, '').slice(0, 3));
  }

  // Chaque champ qui contient « admin » est accepté sans vérification (mode test, voir utils/mode-test.ts)
  private verifier(): Partial<Record<Champ, CleTraduction>> {
    const erreurs: Partial<Record<Champ, CleTraduction>> = {};

    if (this.moyen() === 'carte') {
      if (!this.nom().trim()) erreurs.nom = 'pay.err.nom';

      if (!estModeTest(this.numero()) && this.numero().replace(/\D/g, '').length !== 16) {
        erreurs.numero = 'pay.err.numero';
      }

      if (!estModeTest(this.expiration())) {
        const [mois, annee] = this.expiration().split(' / ').map(Number);
        const aujourdhui = new Date();
        const anneeActuelle = aujourdhui.getFullYear() % 100;
        const expiree =
          annee < anneeActuelle || (annee === anneeActuelle && mois < aujourdhui.getMonth() + 1);
        if (!mois || mois > 12 || annee === undefined || Number.isNaN(annee)) {
          erreurs.expiration = 'pay.err.format';
        } else if (expiree) {
          erreurs.expiration = 'pay.err.expiree';
        }
      }

      if (!estModeTest(this.cvc()) && this.cvc().length !== 3) erreurs.cvc = 'pay.err.cvc';
    }

    const email = this.email().trim();
    if (this.envoyerEmail() && !estModeTest(email) && !/^\S+@\S+\.\S+$/.test(email)) {
      erreurs.email = 'err.email';
    }
    return erreurs;
  }

  // Texte du bouton : « Paiement en cours… », « Confirmer → » ou « Payer 33,500 DT → »
  protected readonly texteBoutonPayer = computed(() => {
    if (this.paiementEnCours()) return t('pay.enCours');
    if (this.moyen() === 'comptoir') return t('pay.confirmer');
    return t('pay.payer', { total: formaterPrix(this.total()) });
  });

  // Nom d'un produit du panier ou de la réservation, dans la langue choisie
  protected nomProduit(produit: Produit): string {
    return this.catalogue.nomProduit(produit);
  }

  // Erreur renvoyée par le serveur (ex. « la place F7 vient d'être réservée par quelqu'un d'autre »)
  protected readonly erreurServeur = signal('');

  protected async payer(): Promise<void> {
    if (this.paiementEnCours() || this.rienAPayer()) return;

    const erreurs = this.verifier();
    this.erreurs.set(erreurs);
    if (Object.keys(erreurs).length) return;

    this.paiementEnCours.set(true);
    this.erreurServeur.set('');
    try {
      await this.envoyerAuServeur();
      this.router.navigate(['/confirmation']);
    } catch (erreur) {
      this.erreurServeur.set(messageErreur(erreur));
      this.paiementEnCours.set(false);
    }
  }

  // Envoie la réservation (ou la commande) au serveur. Le serveur répond avec le numéro
  // définitif et le prix qu'il a calculé lui-même. En cas de refus, une erreur est lancée.
  private async envoyerAuServeur(): Promise<void> {
    // En mode test, « admin » n'est pas une vraie adresse : on n'affiche pas « envoyé à admin »
    const email =
      this.envoyerEmail() && !estModeTest(this.email()) ? this.email().trim().toLowerCase() : '';
    const moyen = this.moyen();

    if (this.estBoutique()) {
      const commande = await this.api.creerCommande(
        this.panier.lignes().map((l) => ({ produitId: l.produit.id, quantite: l.quantite })),
      );
      this.compte.ajouterCommande(commande);
      this.panier.vider();
      this.dernierAchat.enregistrer({ type: 'commande', commande, email, moyen });
    } else {
      const brouillon = this.reservation()!;
      const reservation = await this.api.creerReservation({
        seanceId: brouillon.seanceId,
        places: brouillon.places,
        snacks: brouillon.snacks.map((l) => ({ produitId: l.produit.id, quantite: l.quantite })),
      });
      this.compte.ajouterBillet(reservation);
      this.reservationEnCours.vider();
      this.dernierAchat.enregistrer({ type: 'reservation', reservation, email, moyen });
      // Les places réservées passent en « occupées » pour la suite de la visite
      this.catalogue.actualiserSeance(reservation.seanceId);
    }
  }

  // Fonctions utilisées dans le HTML
  protected readonly formaterPrix = formaterPrix;
  protected readonly dateLongue = dateLongue;
}
