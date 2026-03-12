import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout-cancel.component.html',
  styleUrls: ['./checkout-cancel.component.css']
})
export class CheckoutCancelComponent implements OnInit {
  commandeNumber: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.commandeNumber = this.route.snapshot.queryParams['commande'] || 'inconnue';
  }
}
