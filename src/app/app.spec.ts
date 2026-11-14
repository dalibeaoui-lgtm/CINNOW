import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { langueActive } from './i18n/langue';

// Composant racine : menu, contenu de la page, pied de page.
describe('App (composant racine)', () => {
  beforeEach(async () => {
    langueActive.set('fr');
    await TestBed.configureTestingModule({
      imports: [App],
      // Faux routeur et faux HTTP : aucun serveur n'est contacté pendant les tests
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('se crée sans erreur', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche le menu, la zone des pages et le pied de page', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('app-header .header')).not.toBeNull();
    expect(page.querySelector('main router-outlet')).not.toBeNull();
    expect(page.querySelector('app-footer .footer')).not.toBeNull();
  });

  it('met la langue choisie sur la balise <html>', async () => {
    const fixture = TestBed.createComponent(App);
    langueActive.set('en');
    await fixture.whenStable();
    expect(document.documentElement.lang).toBe('en');
  });
});
