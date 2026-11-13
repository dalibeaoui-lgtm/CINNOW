import { Pipe, PipeTransform } from '@angular/core';
import { CleTraduction, t, tn } from './langue';

// Dans le HTML : {{ 'menu.films' | t }}  ou  {{ 'menu.panier' | t: { n: 2 } }}
// « pure: false » : le texte est recalculé quand on change de langue.
@Pipe({ name: 't', pure: false })
export class TraduirePipe implements PipeTransform {
  // « string » : on accepte aussi une clé construite, ex. 'version.' + seance.version
  transform(cle: CleTraduction | string, parametres?: Record<string, string | number>): string {
    return t(cle as CleTraduction, parametres);
  }
}

// Singulier / pluriel : {{ 'bout.nbProduits' | tn: 3 }} → « 3 produits »
@Pipe({ name: 'tn', pure: false })
export class TraduirePlurielPipe implements PipeTransform {
  transform(base: string, n: number, parametres?: Record<string, string | number>): string {
    return tn(base, n, parametres);
  }
}

// À importer dans les composants : imports: [Traduction]
export const Traduction = [TraduirePipe, TraduirePlurielPipe] as const;
