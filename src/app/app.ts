import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BarreNavigation } from './components/barre-navigation/barre-navigation';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { CLE_STOCKAGE_LANGUE, langueActive } from './i18n/langue';
import { Traduction } from './i18n/traduire.pipe';
import { Catalogue } from './services/catalogue';
import { ecrireStockage } from './utils/stockage';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BarreNavigation, Header, Footer, Traduction],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Pour afficher un bandeau si le serveur ne répond pas
  protected readonly catalogue = inject(Catalogue);

  constructor() {
    // À chaque changement de langue : <html lang="…"> (lecteurs d'écran, césure) et sauvegarde
    effect(() => {
      document.documentElement.lang = langueActive();
      ecrireStockage(CLE_STOCKAGE_LANGUE, langueActive());
    });
  }
}
