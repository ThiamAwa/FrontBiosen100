import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  section: string;
  links: NavLink[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  @Input() collapsed = false;

  // Équivalent exact des liens de votre sidebar Laravel
  // navGroups: NavGroup[] = [
  //   {
  //     section: 'Tableau de bord',
  //     links: [
  //       { label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: '/admin/dashboard' },
  //     ]
  //   },
  //   {
  //     section: 'Catalogue',
  //     links: [
  //       { label: 'Type Catégories', icon: 'fas fa-tags', route: '/admin/typecategories' },
  //       { label: 'Catégories', icon: 'fas fa-tags', route: '/admin/categories' },
  //       { label: 'Gammes', icon: 'fas fa-layer-group', route: '/admin/gammes' },
  //       { label: 'Produits Bio', icon: 'fas fa-box', route: '/admin/produits' },
  //       { label: 'Produits Sport', icon: 'fas fa-dumbbell', route: '/admin/produits-sport' },
  //     ]
  //   },
  //   {
  //     section: 'Utilisateurs',
  //     links: [
  //       { label: 'Vendeurs', icon: 'fas fa-user-tie', route: '/admin/vendeurs' },
  //       { label: 'Livreurs', icon: 'fas fa-truck', route: '/admin/livreurs' },
  //       { label: 'Boutiques', icon: 'fas fa-store', route: '/admin/boutiques' },
  //     ]
  //   },
  //   {
  //     section: 'Clients',
  //     links: [
  //       { label: 'Clients', icon: 'fas fa-users', route: '/admin/clients' },
  //     ]
  //   },
  //   {
  //     section: 'Commandes',
  //     links: [
  //       { label: 'Commandes', icon: 'fas fa-shopping-cart', route: '/admin/commandes' },
  //     ]
  //   },
  //   {
  //     section: 'Témoignages',
  //     links: [
  //       { label: 'Témoignages', icon: 'fas fa-quote-left', route: '/admin/temoignages' },
  //     ]
  //   },
  // ];
}