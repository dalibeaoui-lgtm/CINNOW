import { Component, computed, input } from '@angular/core';
import { Traduction } from '../../i18n/traduire.pipe';

const TAILLE = 21; // un QR code « version 1 » fait 21 × 21 cases

// Faux QR code (dessin seulement), toujours le même pour un même numéro.
// Un vrai QR code, lisible par un téléphone, sera généré par le backend.
// Utilisation : <app-qr-code [numero]="billet.id" label="E-billet n° 48213" />
@Component({
  selector: 'app-qr-code',
  imports: [Traduction],
  template: `
    <svg viewBox="-1 -1 23 23" role="img" [attr.aria-label]="label() || ('qr.defaut' | t)">
      <path [attr.d]="chemin()" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 1;
      background: #fff;
      color: #080808;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `,
})
export class QrCode {
  readonly numero = input.required<number>();
  readonly label = input(''); // vide : « Code à présenter à l'entrée » dans la langue choisie

  protected readonly chemin = computed(() => {
    let nombre = this.numero() % 233280;
    let chemin = '';
    for (let y = 0; y < TAILLE; y++) {
      for (let x = 0; x < TAILLE; x++) {
        nombre = (nombre * 9301 + 49297) % 233280; // nombre « au hasard »
        const noir = dansUnCoin(x, y) ? carreDuCoin(x, y) : nombre / 233280 < 0.5;
        if (noir) chemin += `M${x} ${y}h1v1h-1z`; // une case noire de 1 × 1
      }
    }
    return chemin;
  });
}

// Les 3 grands carrés de repérage, en haut à gauche, en haut à droite et en bas à gauche
function dansUnCoin(x: number, y: number): boolean {
  return (x < 7 && y < 7) || (x >= TAILLE - 7 && y < 7) || (x < 7 && y >= TAILLE - 7);
}

// Dans un carré de repérage : un contour et un centre plein
function carreDuCoin(x: number, y: number): boolean {
  const cx = x >= TAILLE - 7 ? x - (TAILLE - 7) : x;
  const cy = y >= TAILLE - 7 ? y - (TAILLE - 7) : y;
  const bord = Math.max(Math.abs(cx - 3), Math.abs(cy - 3));
  return bord === 3 || bord <= 1;
}
