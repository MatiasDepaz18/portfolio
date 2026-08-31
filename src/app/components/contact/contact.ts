import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Badge } from '../shared/badge/badge';
import { Flag } from '../shared/flag/flag';
import { GameButton } from '../shared/game-button/game-button';
import { RevealDirective } from '../../directives/reveal.directive';
import { site } from '../../data/site.data';

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, Badge, Flag, GameButton, RevealDirective, NgIcon],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  readonly site = site;

  name = '';
  email = '';
  message = '';

  readonly submitted = signal(false);
  readonly errors = signal<ContactErrors>({});

  onSubmit(): void {
    const errors: ContactErrors = {};
    if (!this.name.trim()) {
      errors.name = 'Contame tu nombre.';
    }
    if (!this.email.trim()) {
      errors.email = 'Necesito tu email para responderte.';
    } else if (!EMAIL_PATTERN.test(this.email.trim())) {
      errors.email = 'Ese email no parece válido.';
    }
    if (!this.message.trim()) {
      errors.message = 'Escribí tu mensaje.';
    }
    this.errors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    // TODO: integrar un servicio real (EmailJS, Formspree, endpoint propio).
    console.log('Formulario enviado:', {
      name: this.name,
      email: this.email,
      message: this.message,
    });
    this.submitted.set(true);
    this.name = '';
    this.email = '';
    this.message = '';
  }

  submitAnother(): void {
    this.submitted.set(false);
    this.errors.set({});
  }
}
