import { Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { WhatsappComponent } from './components/whatsapp/whatsapp.component';
import { AdminLayoutComponent } from './components/admin/layout/admin-layout/admin-layout.component';
import { PublicLayoutComponent } from './components/layout/public-layout/public-layout.component';
import { BoutiqueComponent } from './components/pages/boutique/boutique.component';
import { TemoignagesComponent } from './components/pages/temoignages/temoignages.component';
import { SportComponent } from './components/pages/sport/sport.component';
import { ContactComponent } from './components/pages/contact/contact.component';
import { SportDetailComponent } from './components/pages/sport-detail/sport-detail.component';
import { CheckoutComponent } from './components/pages/checkout/checkout.component';
import {
    CheckoutConfirmationComponent
} from './components/pages/checkout-confirmation/checkout-confirmation.component';

export const routes: Routes = [

    // Routes publiques avec layout public
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: '', loadComponent: () => import('./components/pages/home/home.component').then(m => m.HomeComponent) },
            { path: 'whatsapp', loadComponent: () => import('./components/whatsapp/whatsapp.component').then(m => m.WhatsappComponent) },
            { path: '', component: HomeComponent },
            { path: 'boutique', component: BoutiqueComponent },
            { path: 'temoignages', component: TemoignagesComponent },
            { path: 'sport', component: SportComponent },
            { path: 'sport/:id', component: SportDetailComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'checkout', component: CheckoutComponent },
            { path: 'checkout/confirmation/:order_number', component: CheckoutConfirmationComponent },
        ]
    },

    // ── Routes Admin ────────────────────────────────────────
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'typecategories',
                loadComponent: () => import('./components/admin/type-categorie/type-categorie.component').then(m => m.TypeCategorieComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./components/admin/categorie/categorie.component').then(m => m.CategorieComponent)
            },
            {
                path: 'gammes',
                loadComponent: () => import('./components/admin/gamme/gamme.component').then(m => m.GammeComponent)
            },
            {
                path: 'produits',
                loadComponent: () => import('./components/admin/produit/produit.component').then(m => m.ProduitComponent)
            },
            {
                path: 'produits-sport',
                loadComponent: () => import('./components/admin/produit-sport/produit-sport.component').then(m => m.ProduitSportComponent)
            },
            {
                path: 'vendeurs',
                loadComponent: () => import('./components/admin/vendeur/vendeur.component').then(m => m.VendeurComponent)
            },
            {
                path: 'livreurs',
                loadComponent: () => import('./components/admin/livreur/livreur.component').then(m => m.LivreurComponent)
            },
            {
                path: 'boutiques',
                loadComponent: () => import('./components/admin/boutique/boutique.component').then(m => m.BoutiqueComponent)
            },
            {
                path: 'clients',
                loadComponent: () => import('./components/admin/client/client.component').then(m => m.ClientComponent)
            },
            {
                path: 'commandes',
                loadComponent: () => import('./components/admin/commande/commande.component').then(m => m.CommandeComponent)
            },
            {
                path: 'factures',
                loadComponent: () => import('./components/admin/factures/factures.component').then(m => m.FacturesComponent)
            },
            {
                path: 'temoignages',

                loadComponent: () => import('./components/admin/temoignage/temoignage.component').then(m => m.TemoignageComponent)

            }
        ]
    },

    // ── Wildcard ─────────────────────────────────────────────
    { path: '**', redirectTo: '' }
];
