import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { AvisService } from './services/avis';
import { Catalogue } from './services/catalogue';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Les paramètres de l'adresse (ex. le « :id » de /film/:id) arrivent dans les input() des pages
      withComponentInputBinding(),
      // Chaque nouvelle page s'ouvre en haut ; le bouton « retour » revient où on était
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // Requêtes HTTP vers l'API (dossier backend/)
    provideHttpClient(withFetch()),
    // Avant d'afficher la première page : charger films, séances, produits et avis depuis le serveur
    provideAppInitializer(() => Promise.all([inject(Catalogue).charger(), inject(AvisService).charger()])),
  ],
};
