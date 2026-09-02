import { Component } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Hero } from './components/hero/hero';
import { About } from './components/about/about';
import { Skills } from './components/skills/skills';
import { Projects } from './components/projects/projects';
import { Trajectory } from './components/trajectory/trajectory';
import { Education } from './components/education/education';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { ScrollPlant } from './components/scroll-plant/scroll-plant';

@Component({
  selector: 'app-root',
  imports: [
    Navbar,
    Hero,
    About,
    Skills,
    Projects,
    Trajectory,
    Education,
    Contact,
    Footer,
    ScrollPlant,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
