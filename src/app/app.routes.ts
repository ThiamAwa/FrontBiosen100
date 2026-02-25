import { Routes } from '@angular/router';

import { HomeComponent } from './components/pages/home/home.component';
import {BoutiqueComponent} from './components/pages/boutique/boutique.component';
import {TemoignagesComponent} from './components/pages/temoignages/temoignages.component';
import {SportComponent} from './components/pages/sport/sport.component';
import {ContactComponent} from './components/pages/contact/contact.component';
import { SportDetailComponent } from './components/pages/sport-detail/sport-detail.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'boutique', component: BoutiqueComponent },
    { path: 'temoignages', component: TemoignagesComponent },
    { path: 'sport', component: SportComponent },
    { path: 'sport/:id', component: SportDetailComponent },
    { path: 'contact', component: ContactComponent },
];
