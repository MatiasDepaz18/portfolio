import { Component } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { Skills } from './components/skills/skills';
import { Projects } from './components/projects/projects';
import { Trajectory } from './components/trajectory/trajectory';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [Navbar, Hero, About, Skills, Projects, Trajectory, Contact, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
