import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Etapes } from '../../components/etapes/etapes';
import { QrCode } from '../../components/qr-code/qr-code';
import { t } from '../../i18n/langue';
import { Traduction } from '../../i18n/traduire.pipe';
import { Catalogue } from '../../services/catalogue';
import { Compte } from '../../services/compte';
import { DernierAchat } from '../../services/dernier-achat';
import { dateLongue, formaterPrix, numeroCourt } from '../../utils/formats';

@Component({
  selector: 'app-confirmation',
  imports: [RouterLink, Etapes, QrCode, Traduction],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly compte = inject(Compte);
  protected readonly achat = inject(DernierAchat).achat;
  protected readonly connecte = computed(() => !!this.compte.utilisateur());

  protected readonly reservation = computed(() => {
    const achat = this.achat();
    return achat?.type === 'reservation' ? achat.reservation : null;
  });
  protected readonly commande = computed(() => {
    const achat = this.achat();
    return achat?.type === 'commande' ? achat.commande : null;
  });

  private readonly catalogue = inject(Catalogue);
  protected readonly seance = computed(() => this.catalogue.seance(this.reservation()?.seanceId));
  protected readonly film = computed(() => this.catalogue.film(this.seance()?.filmId));

  protected readonly numero = computed(() => this.reservation()?.id ?? this.commande()?.id ?? 0);

  // « Votre e-billet a été envoyé à sarra@exemple.com et ajouté à « Mes billets ». »
  protected readonly message = computed(() => {
    const achat = this.achat();
    if (!achat) return '';
    const billet = achat.type === 'reservation';
    let texte = achat.email
      ? t(billet ? 'conf.billetEnvoye' : 'conf.recuEnvoye', { email: achat.email })
      : t(billet ? 'conf.billetPret' : 'conf.commandeEnregistree');
    if (this.connecte()) texte += t(billet ? 'conf.ajouteBillets' : 'conf.ajouteCommandes');
    return texte + '.';
  });

  // Snacks de la réservation, ou articles de la commande : « 1 × Popcorn moyen, 2 × Boisson 50 cl »
  protected readonly texteArticles = computed(() => {
    const lignes = this.reservation()?.snacks ?? this.commande()?.articles ?? [];
    return lignes.map((l) => `${l.quantite} × ${this.catalogue.nomProduit(l.produit)}`).join(', ');
  });

  // « Télécharger le billet (PDF) » : ouvre l'impression du navigateur, où l'on choisit « Enregistrer en PDF ».
  // Le menu et le pied de page sont cachés à l'impression (voir styles.scss).
  protected telechargerPdf(): void {
    window.print();
  }

  // « Ajouter au calendrier » : télécharge un fichier .ics, que Google Agenda, Outlook
  // et le calendrier du téléphone savent ouvrir.
  protected ajouterAuCalendrier(): void {
    const seance = this.seance();
    const film = this.film();
    const reservation = this.reservation();
    if (!seance || !film || !reservation) return;

    const [annee, mois, jour] = seance.date.split('-').map(Number);
    const [heures, minutes] = seance.heure.split(':').map(Number);
    const debut = new Date(annee, mois - 1, jour, heures, minutes);
    const fin = new Date(debut.getTime() + film.duree * 60_000);

    // Format des dates dans un .ics : 20261115T173000 (heure locale)
    const ics = (date: Date) =>
      `${date.getFullYear()}${deux(date.getMonth() + 1)}${deux(date.getDate())}T${deux(date.getHours())}${deux(date.getMinutes())}00`;

    const contenu = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CINNOW//Reservation//FR',
      'BEGIN:VEVENT',
      `UID:${reservation.id}@cinnow`,
      `DTSTAMP:${ics(new Date())}`,
      `DTSTART:${ics(debut)}`,
      `DTEND:${ics(fin)}`,
      `SUMMARY:${film.titre} (${seance.version}) — CINNOW`,
      `LOCATION:CINNOW\\, salle ${seance.salle}`,
      `DESCRIPTION:Places ${reservation.places.join('\\, ')} · Réservation n° ${numeroCourt(reservation.id)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([contenu], { type: 'text/calendar;charset=utf-8' }));
    lien.download = `cinnow-${film.titre.toLowerCase().replace(/\W+/g, '-')}.ics`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  // Fonctions utilisées dans le HTML
  protected readonly dateLongue = dateLongue;
  protected readonly formaterPrix = formaterPrix;
  protected readonly numeroCourt = numeroCourt;
}

const deux = (n: number) => String(n).padStart(2, '0');
