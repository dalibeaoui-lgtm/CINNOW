import { Component, input } from '@angular/core';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';

// Barre des étapes de la réservation : Séance → Places → Snacks → Paiement.
// Utilisation : <app-etapes [courantes]="[4]" />  (les étapes avant sont cochées)
//               <app-etapes [courantes]="[]" />   (tout est coché : réservation terminée)
@Component({
  selector: 'app-etapes',
  imports: [Traduction],
  templateUrl: './etapes.html',
  styleUrl: './etapes.scss',
})
export class Etapes {
  readonly courantes = input.required<number[]>();

  // Clés des textes (traduits dans le HTML avec « | t »)
  protected readonly noms: CleTraduction[] = [
    'etapes.seance',
    'etapes.places',
    'etapes.snacks',
    'etapes.paiement',
  ];

  protected etat(numero: number): 'faite' | 'active' | 'a-venir' {
    const courantes = this.courantes();
    if (!courantes.length || numero < Math.min(...courantes)) return 'faite';
    return courantes.includes(numero) ? 'active' : 'a-venir';
  }
}
