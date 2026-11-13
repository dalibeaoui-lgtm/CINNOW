import { Component, DestroyRef, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CleTraduction, t } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Produit } from '../../models/produit';
import { Catalogue } from '../../services/catalogue';
import { Panier } from '../../services/panier';
import { formaterPrix } from '../../utils/formats';

type Filtre = 'tout' | Produit['categorie'];

@Component({
  selector: 'app-boutique',
  imports: [Traduction],
  templateUrl: './boutique.html',
  styleUrl: './boutique.scss',
  host: { '(document:keydown.escape)': 'panierOuvert.set(false)' },
})
export class Boutique {
  // ?panier=ouvert dans l'adresse ouvre directement le panier (lien « Panier » du menu)
  readonly panier = input<string>();

  private readonly router = inject(Router);
  protected readonly lePanier = inject(Panier);

  // ---------- Filtres ----------
  // « libelle » et « titre » : clés des textes, traduites dans le HTML
  protected readonly filtres: { id: Filtre; libelle: CleTraduction }[] = [
    { id: 'tout', libelle: 'bout.tout' },
    { id: 'snack', libelle: 'bout.snacks' },
    { id: 'boisson', libelle: 'bout.boissons' },
    { id: 'poster', libelle: 'bout.posters' },
  ];
  protected readonly filtre = signal<Filtre>('tout');

  // Produits envoyés par le serveur
  private readonly catalogue = inject(Catalogue);
  private readonly tousLesProduits = this.catalogue.produits;

  protected readonly produits = computed(() =>
    this.filtre() === 'tout'
      ? this.tousLesProduits()
      : this.tousLesProduits().filter((p) => p.categorie === this.filtre()),
  );

  // Les produits filtrés, rangés en 2 parties séparées sur la page
  protected readonly sections = computed(() => {
    const produits = this.produits();
    return [
      { id: 'snacks', titre: 'bout.partieSnacks' as CleTraduction, produits: produits.filter((p) => p.categorie !== 'poster') },
      { id: 'posters', titre: 'bout.partiePosters' as CleTraduction, produits: produits.filter((p) => p.categorie === 'poster') },
    ].filter((section) => section.produits.length > 0);
  });

  protected nombreDans(filtre: Filtre): number {
    const produits = this.tousLesProduits();
    return filtre === 'tout' ? produits.length : produits.filter((p) => p.categorie === filtre).length;
  }

  // ---------- Panier ----------
  protected readonly panierOuvert = linkedSignal(() => this.panier() === 'ouvert');

  // Petit message « Popcorn moyen ajouté au panier » qui disparaît tout seul
  protected readonly notification = signal('');
  private minuteur?: ReturnType<typeof setTimeout>;

  constructor() {
    // Panier ouvert : on bloque le défilement de la page derrière
    effect(() => document.body.classList.toggle('sans-defilement', this.panierOuvert()));
    inject(DestroyRef).onDestroy(() => {
      document.body.classList.remove('sans-defilement');
      clearTimeout(this.minuteur);
    });
  }

  protected ajouter(produit: Produit): void {
    this.lePanier.ajouter(produit);
    this.notification.set(t('bout.ajoute', { nom: produit.nom }));
    clearTimeout(this.minuteur);
    this.minuteur = setTimeout(() => this.notification.set(''), 2500);
  }

  protected commander(): void {
    this.panierOuvert.set(false);
    this.router.navigate(['/paiement'], { queryParams: { commande: 'boutique' } });
  }

  // Vignette de couleur pour les produits sans photo
  protected vignette(produit: Produit): string {
    return `vignette--${produit.categorie}`;
  }

  protected readonly formaterPrix = formaterPrix;

  // Nom d'un produit du panier dans la langue choisie (le panier garde le nom de l'époque)
  protected nomProduit(produit: Produit): string {
    return this.catalogue.nomProduit(produit);
  }
}
