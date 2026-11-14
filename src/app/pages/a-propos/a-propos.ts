import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FondFilms } from '../../components/fond-films/fond-films';
import { Apparition } from '../../directives/apparition';
import { CleTraduction } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Catalogue } from '../../services/catalogue';
import { formaterPrix } from '../../utils/formats';

// Page À propos (sitemap) : notre histoire et nos chiffres, salles et équipements,
// tarifs et abonnements, horaires d'ouverture.
@Component({
  selector: 'app-a-propos',
  imports: [RouterLink, FondFilms, Apparition, Traduction],
  templateUrl: './a-propos.html',
  styleUrl: './a-propos.scss',
})
export class APropos {
  private readonly catalogue = inject(Catalogue);

  // Chiffres calculés à partir des données du serveur : ils restent justes si le programme change
  protected readonly chiffres = computed(() => {
    const salle = this.catalogue.salle();
    const sallesUtilisees = new Set(this.catalogue.seances().map((s) => s.salle)).size;
    return [
      { valeur: sallesUtilisees, libelle: 'apropos.chiffre.salles' as CleTraduction },
      { valeur: salle.rangees.length * salle.placesParRangee, libelle: 'apropos.chiffre.places' as CleTraduction },
      { valeur: 3, libelle: 'apropos.chiffre.seances' as CleTraduction },
      { valeur: 7, libelle: 'apropos.chiffre.jours' as CleTraduction },
    ];
  });

  // Icônes au trait fin (style de la charte), une par équipement
  protected readonly equipements: { icone: string; titre: CleTraduction; texte: CleTraduction }[] = [
    { icone: 'M4 9v6h4l5 4V5L8 9H4zm12.5 3a3.5 3.5 0 00-2-3.2v6.4a3.5 3.5 0 002-3.2zm-2-7.8v2a6 6 0 010 11.6v2a8 8 0 000-15.6z', titre: 'apropos.equip.son.titre', texte: 'apropos.equip.son.texte' },
    { icone: 'M3 5h18v11H3zM8 20h8M12 16v4', titre: 'apropos.equip.image.titre', texte: 'apropos.equip.image.texte' },
    { icone: 'M6 11V6a3 3 0 013-3h6a3 3 0 013 3v5M4 11h16v5H4zM6 16v4M18 16v4', titre: 'apropos.equip.fauteuils.titre', texte: 'apropos.equip.fauteuils.texte' },
    { icone: 'M12 4.5a1.5 1.5 0 100 .01M8 8h8M12 8v6l-3 6M12 14l3 6', titre: 'apropos.equip.acces.titre', texte: 'apropos.equip.acces.texte' },
  ];

  // Tarifs : le plein tarif est celui du serveur (le même que pour la réservation en ligne)
  protected readonly tarifs = computed(() => [
    { nom: 'apropos.tarif.plein' as CleTraduction, detail: 'apropos.tarif.plein.detail' as CleTraduction, prix: this.catalogue.salle().prixPlace, mensuel: false },
    { nom: 'apropos.tarif.etudiant' as CleTraduction, detail: 'apropos.tarif.etudiant.detail' as CleTraduction, prix: 9, mensuel: false },
    { nom: 'apropos.tarif.enfant' as CleTraduction, detail: 'apropos.tarif.enfant.detail' as CleTraduction, prix: 8, mensuel: false },
    { nom: 'apropos.tarif.abonnement' as CleTraduction, detail: 'apropos.tarif.abonnement.detail' as CleTraduction, prix: 35, mensuel: true },
  ]);

  protected readonly horaires: { jours: CleTraduction; heures: string }[] = [
    { jours: 'contact.horaires.semaine', heures: '13:00 – 23:30' },
    { jours: 'contact.horaires.weekend', heures: '13:00 – 01:00' },
    { jours: 'contact.horaires.dimanche', heures: '11:00 – 23:30' },
  ];

  protected readonly formaterPrix = formaterPrix;
}
