import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FondFilms } from '../../components/fond-films/fond-films';
import { Apparition } from '../../directives/apparition';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Catalogue } from '../../services/catalogue';
import { formaterPrix } from '../../utils/formats';

type Categorie = 'reservation' | 'billets' | 'boutique' | 'tarifs' | 'acces';

interface Question {
  id: string;
  categorie: Categorie;
  question: CleTraduction;
  reponse: CleTraduction;
}

// Page FAQ (sitemap) : les questions les plus fréquentes, rangées par thème.
// Chaque question s'ouvre au clic (<details> : accessible au clavier sans code en plus).
@Component({
  selector: 'app-faq',
  imports: [RouterLink, FondFilms, Apparition, Traduction],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq {
  private readonly catalogue = inject(Catalogue);

  protected readonly categories: { id: Categorie; libelle: CleTraduction }[] = [
    { id: 'reservation', libelle: 'faq.cat.reservation' },
    { id: 'billets', libelle: 'faq.cat.billets' },
    { id: 'boutique', libelle: 'faq.cat.boutique' },
    { id: 'tarifs', libelle: 'faq.cat.tarifs' },
    { id: 'acces', libelle: 'faq.cat.acces' },
  ];

  private readonly questions: Question[] = [
    { id: 'reserver', categorie: 'reservation', question: 'faq.q.reserver', reponse: 'faq.r.reserver' },
    { id: 'combien', categorie: 'reservation', question: 'faq.q.combien', reponse: 'faq.r.combien' },
    { id: 'annuler', categorie: 'reservation', question: 'faq.q.annuler', reponse: 'faq.r.annuler' },
    { id: 'compte', categorie: 'reservation', question: 'faq.q.compte', reponse: 'faq.r.compte' },
    { id: 'imprimer', categorie: 'billets', question: 'faq.q.imprimer', reponse: 'faq.r.imprimer' },
    { id: 'payer', categorie: 'billets', question: 'faq.q.payer', reponse: 'faq.r.payer' },
    { id: 'arriver', categorie: 'billets', question: 'faq.q.arriver', reponse: 'faq.r.arriver' },
    { id: 'boutique', categorie: 'boutique', question: 'faq.q.boutique', reponse: 'faq.r.boutique' },
    { id: 'apporter', categorie: 'boutique', question: 'faq.q.apporter', reponse: 'faq.r.apporter' },
    { id: 'reduits', categorie: 'tarifs', question: 'faq.q.reduits', reponse: 'faq.r.reduits' },
    { id: 'abonnement', categorie: 'tarifs', question: 'faq.q.abonnement', reponse: 'faq.r.abonnement' },
    { id: 'ou', categorie: 'acces', question: 'faq.q.ou', reponse: 'faq.r.ou' },
    { id: 'fauteuil', categorie: 'acces', question: 'faq.q.fauteuil', reponse: 'faq.r.fauteuil' },
  ];

  // Thème choisi avec les boutons (« toutes » = tout afficher)
  protected readonly filtre = signal<Categorie | 'toutes'>('toutes');

  // Les thèmes à afficher, chacun avec ses questions
  protected readonly groupes = computed(() =>
    this.categories
      .filter((c) => this.filtre() === 'toutes' || this.filtre() === c.id)
      .map((c) => ({ ...c, questions: this.questions.filter((q) => q.categorie === c.id) })),
  );

  // Valeurs glissées dans les réponses : mêmes chiffres que le reste du site (page À propos, salle)
  protected readonly valeurs = computed(() => {
    const salle = this.catalogue.salle();
    return {
      max: salle.maxPlaces,
      plein: formaterPrix(salle.prixPlace),
      etudiant: formaterPrix(9),
      enfant: formaterPrix(8),
      abonnement: formaterPrix(35),
    };
  });
}
