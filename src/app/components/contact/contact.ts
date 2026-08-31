import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact {
  name = '';
  email = '';
  message = '';
  submitted = signal(false);

  onSubmit() {
    if (this.name && this.email && this.message) {
      // Aquí se puede integrar un servicio de email (EmailJS, Formspree, etc.)
      console.log('Formulario enviado:', { name: this.name, email: this.email, message: this.message });
      this.submitted.set(true);
      this.name = '';
      this.email = '';
      this.message = '';
    }
  }
}
