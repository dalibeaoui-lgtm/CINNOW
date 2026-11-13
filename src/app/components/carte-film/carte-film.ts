import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Traduction } from '../../i18n/traduire.pipe';
import { Film } from '../../models/film';
import { formaterDate, formaterDuree } from '../../utils/formats';

// Carte d'un film : affiche, statut, titre, genre, durée et bouton d'action.
// Utilisation : <app-carte-film [film]="film" />
@Component({
  selector: 'app-carte-film',
  imports: [RouterLink, Traduction],
  templateUrl: './carte-film.html',
  styleUrl: './carte-film.scss',
})
export class CarteFilm {
  readonly film = input.required<Film>();

  protected readonly enSalle = computed(() => this.film().statut === 'a-l-affiche');

  // 172 minutes → « 2 h 52 »
  protected readonly duree = computed(() => formaterDuree(this.film().duree));

  // « 2026-12-02 » → « 2 déc. » / « 2 Dec »
  protected readonly dateSortie = computed(() => formaterDate(this.film().dateSortie, { day: 'numeric', month: 'short' }));
}
