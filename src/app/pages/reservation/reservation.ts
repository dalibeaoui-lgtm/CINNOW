import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Etapes } from '../../components/etapes/etapes';
import { Traduction } from '../../i18n/traduire.pipe';
import { Catalogue } from '../../services/catalogue';
import { ReservationEnCours } from '../../services/reservation-en-cours';
import { dateLongue, formaterPrix, seanceEstPassee } from '../../utils/formats';

const MAX_PAR_PRODUIT = 10;

// « F12 » et « F7 » → F7 avant F12 (tri par rangée, puis par numéro)
const triPlaces = (a: string, b: string) =>
  a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1));

@Component({
  selector: 'app-reservation',
  imports: [RouterLink, Etapes, Traduction],
  templateUrl: './reservation.html',
  styleUrl: './reservation.scss',
})
export class Reservation {
  // Le « :seanceId » de l'adresse /reservation/:seanceId
  readonly seanceId = input.required<string>();

  private readonly router = inject(Router);
  private readonly enCours = inject(ReservationEnCours);
  private readonly catalogue = inject(Catalogue);

  // Une séance déjà commencée ne peut plus être réservée (la page affiche « Séance introuvable »)
  protected readonly seance = computed(() => {
    const seance = this.catalogue.seance(Number(this.seanceId()));
    return seance && !seanceEstPassee(seance) ? seance : undefined;
  });
  protected readonly film = computed(() => this.catalogue.film(this.seance()?.filmId));
  // Seuls les snacks et les boissons sont proposés pendant la réservation (les posters sont à la boutique)
  protected readonly produits = computed(() =>
    this.catalogue.produits().filter((p) => p.categorie === 'snack' || p.categorie === 'boisson'),
  );

  constructor() {
    // En ouvrant la page, on redemande la séance au serveur : les places prises par d'autres
    // spectateurs depuis le chargement du site apparaissent alors en gris.
    effect(() => {
      const id = Number(this.seanceId());
      untracked(async () => {
        this.verification.set(true);
        await this.catalogue.actualiserSeance(id);
        this.places.update((places) => places.filter((p) => !this.occupees().has(p)));
        this.verification.set(false);
      });
    });
  }

  // Vrai pendant que le serveur confirme les places libres (message + spinner au-dessus du plan)
  protected readonly verification = signal(true);

  protected readonly dateSeance = computed(() => {
    const seance = this.seance();
    return seance ? dateLongue(seance.date) : '';
  });

  // ---------- Plan de la salle (envoyé par le serveur) ----------
  private readonly salle = this.catalogue.salle();
  protected readonly rangees = this.salle.rangees;
  protected readonly numeros = Array.from({ length: this.salle.placesParRangee }, (_, i) => i + 1);
  protected readonly allees = this.salle.alleesApres;
  protected readonly maxPlaces = this.salle.maxPlaces;
  protected readonly prixPlace = this.salle.prixPlace;
  protected readonly occupees = computed(() => new Set(this.seance()?.placesOccupees ?? []));

  // Si on revient du paiement (bouton « retour »), on retrouve ce qu'on avait choisi
  private readonly brouillon = computed(() => {
    const reservation = this.enCours.reservation();
    return reservation && reservation.seanceId === this.seance()?.id ? reservation : null;
  });

  protected readonly places = linkedSignal<string[]>(() => this.brouillon()?.places ?? []);

  protected basculerPlace(place: string): void {
    if (this.occupees().has(place)) return;
    this.places.update((places) => {
      if (places.includes(place)) return places.filter((p) => p !== place);
      if (places.length >= this.maxPlaces) return places;
      return [...places, place].sort(triPlaces);
    });
  }

  // ---------- Snacks ----------
  // Quantité choisie pour chaque produit : { idProduit: quantité }
  protected readonly quantites = linkedSignal<Record<number, number>>(() =>
    Object.fromEntries(
      (this.brouillon()?.snacks ?? []).map((ligne) => [ligne.produit.id, ligne.quantite]),
    ),
  );

  protected quantite(idProduit: number): number {
    return this.quantites()[idProduit] ?? 0;
  }

  protected changerQuantite(idProduit: number, ajout: number): void {
    const nouvelle = Math.min(Math.max(this.quantite(idProduit) + ajout, 0), MAX_PAR_PRODUIT);
    this.quantites.update((quantites) => ({ ...quantites, [idProduit]: nouvelle }));
  }

  protected readonly maxParProduit = MAX_PAR_PRODUIT;

  // ---------- Récapitulatif ----------
  protected readonly lignesSnacks = computed(() =>
    this.produits()
      .filter((produit) => this.quantite(produit.id) > 0)
      .map((produit) => ({ produit, quantite: this.quantite(produit.id) })),
  );

  // Total affiché pendant le choix. Au paiement, c'est le serveur qui recalcule le vrai prix.
  protected readonly totalPlaces = computed(() => this.places().length * this.prixPlace);
  protected readonly total = computed(
    () =>
      this.totalPlaces() +
      this.lignesSnacks().reduce((somme, l) => somme + l.produit.prix * l.quantite, 0),
  );

  protected readonly formaterPrix = formaterPrix;

  protected continuer(): void {
    const seance = this.seance();
    if (!seance || !this.places().length) return;

    // Brouillon gardé jusqu'au paiement : c'est là que la réservation est envoyée au serveur
    this.enCours.enregistrer({
      id: 0, // le vrai numéro sera donné par le serveur
      seanceId: seance.id,
      places: this.places(),
      snacks: this.lignesSnacks(),
      total: this.total(),
    });
    this.router.navigate(['/paiement']);
  }
}
