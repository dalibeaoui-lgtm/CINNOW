import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Traduction } from '../../i18n/traduire.pipe';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Traduction],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
