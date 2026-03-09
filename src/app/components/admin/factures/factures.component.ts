import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import {
  Facture, FacturePagination,
  CreateFactureDto,
  UpdateFactureDto
} from '../../../models/facture';
import { User, Commande } from '../../../models/commande';
import { FactureService } from '../../../services/facture/facture.service';

const LOGO_PATH = '/logo-biosen.jpeg';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.css']
})
export class FacturesComponent implements OnInit {

  factures: Facture[] = [];
  submitting = false;

  currentPage = 1;
  lastPage = 1;
  total = 0;
  perPage = 10;

  logoBase64: string = '';

  get firstItem(): number { return (this.currentPage - 1) * this.perPage + 1; }
  get lastItem(): number { return Math.min(this.currentPage * this.perPage, this.total); }

  showFilterPanel = false;
  selectedStatut = '';
  selectedPeriode = '';
  selectedMonth = '';
  selectedYear = '';
  selectedDateDebut = '';
  selectedDateFin = '';
  searchTerm = '';
  selectedDate = '';

  months = [
    { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' }, { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' }, { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' }, { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' }
  ];

  get years(): number[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - i);
  }

  get hasActiveFilters(): boolean {
    return !!(this.selectedStatut || this.selectedPeriode || this.selectedMonth
      || this.selectedYear || this.selectedDateDebut || this.selectedDateFin
      || this.searchTerm);
  }

  successMessage = '';
  errorMessage = '';
  validationErrors: string[] = [];

  showViewModal = false;
  showEditModal = false;
  showDeleteModal = false;

  selectedFacture: Facture | null = null;
  factureToDelete: Facture | null = null;

  editForm: UpdateFactureDto = { statut_paiement: 'en_attente', date_echeance: '' };
  editTargetId: number | null = null;

  constructor(
    private factureService: FactureService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadFactures();
    if (isPlatformBrowser(this.platformId)) {
      this.loadLogoAsBase64();
    }
  }

  // ─── Logo Base64 ──────────────────────────────────────────────────────────

  private loadLogoAsBase64(): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        this.logoBase64 = canvas.toDataURL('image/jpeg');
      }
    };
    img.onerror = () => { this.logoBase64 = ''; };
    img.src = window.location.origin + LOGO_PATH + '?v=' + Date.now();
  }

  private getLogoHtml(height: string = '54px'): string {
    if (this.logoBase64) {
      return `<img src="${this.logoBase64}" alt="Logo SenBio"
        style="height:${height};width:auto;object-fit:contain;" />`;
    }
    return `<div style="color:white;font-size:20px;font-weight:800;">SenBio</div>`;
  }

  // ── Load ─────────────────────────────────────────────────────────
  loadFactures(): void {
    const filters: any = { page: this.currentPage, per_page: this.perPage };
    if (this.selectedStatut) filters['statut_paiement'] = this.selectedStatut;
    if (this.selectedMonth) filters['month'] = this.selectedMonth;
    if (this.selectedYear) filters['year'] = this.selectedYear;
    if (this.selectedDateDebut) filters['date_debut'] = this.selectedDateDebut;
    if (this.selectedDateFin) filters['date_fin'] = this.selectedDateFin;
    if (this.searchTerm) filters['search'] = this.searchTerm;

    this.factureService.getAll(filters).subscribe({
      next: (res: FacturePagination) => {
        this.factures = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.perPage = res.per_page;
      },
      error: () => this.showError('Erreur lors du chargement des factures.')
    });
  }

  private buildExportFilters(): any {
    const filters: any = { page: 1, per_page: 99999 };
    if (this.selectedStatut) filters['statut_paiement'] = this.selectedStatut;
    if (this.selectedMonth) filters['month'] = this.selectedMonth;
    if (this.selectedYear) filters['year'] = this.selectedYear;
    if (this.selectedDateDebut) filters['date_debut'] = this.selectedDateDebut;
    if (this.selectedDateFin) filters['date_fin'] = this.selectedDateFin;
    if (this.searchTerm) filters['search'] = this.searchTerm;
    return filters;
  }

  // ── Filtres ──────────────────────────────────────────────────────
  toggleFilterPanel(): void { this.showFilterPanel = !this.showFilterPanel; }
  applyFilters(): void { this.currentPage = 1; this.loadFactures(); }

  resetFilters(): void {
    this.selectedStatut = ''; this.selectedPeriode = '';
    this.selectedMonth = ''; this.selectedYear = '';
    this.selectedDate = ''; this.selectedDateDebut = '';
    this.selectedDateFin = ''; this.searchTerm = '';
    this.currentPage = 1;
    this.loadFactures();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadFactures();
  }

  getPeriodeLabel(periode: string): string {
    const labels: Record<string, string> = {
      'cette_semaine': 'Cette semaine', 'semaine_derniere': 'Semaine dernière',
      'ce_mois': 'Ce mois', 'mois_dernier': 'Mois dernier',
      'cette_annee': 'Cette année', 'custom': 'Personnalisé',
    };
    return labels[periode] ?? periode;
  }

  onPeriodeChange(periode: string): void {
    if (!periode || periode === 'custom') {
      this.selectedMonth = ''; this.selectedYear = '';
      this.selectedDateDebut = ''; this.selectedDateFin = '';
      return;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDay();
    const diffLundi = (day === 0 ? -6 : 1 - day);
    const lundi = new Date(now);
    lundi.setDate(now.getDate() + diffLundi);
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);

    switch (periode) {
      case 'cette_semaine':
        this.selectedDateDebut = lundi.toISOString().slice(0, 10);
        this.selectedDateFin = dimanche.toISOString().slice(0, 10);
        this.selectedMonth = ''; this.selectedYear = '';
        break;
      case 'semaine_derniere':
        const lP = new Date(lundi); lP.setDate(lundi.getDate() - 7);
        const dP = new Date(lP); dP.setDate(lP.getDate() + 6);
        this.selectedDateDebut = lP.toISOString().slice(0, 10);
        this.selectedDateFin = dP.toISOString().slice(0, 10);
        this.selectedMonth = ''; this.selectedYear = '';
        break;
      case 'ce_mois':
        this.selectedMonth = String(month + 1).padStart(2, '0');
        this.selectedYear = String(year);
        this.selectedDateDebut = ''; this.selectedDateFin = '';
        break;
      case 'mois_dernier':
        const mPrec = month === 0 ? 12 : month;
        const aPrec = month === 0 ? year - 1 : year;
        this.selectedMonth = String(mPrec).padStart(2, '0');
        this.selectedYear = String(aPrec);
        this.selectedDateDebut = ''; this.selectedDateFin = '';
        break;
      case 'cette_annee':
        this.selectedYear = String(year);
        this.selectedMonth = '';
        this.selectedDateDebut = ''; this.selectedDateFin = '';
        break;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  private formatMontantPdf(n: number): string {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  }

  getClientInfo(facture: Facture): {
    nom: string; prenom: string; email: string; telephone: string; adresse: string; nomComplet: string;
  } {
    const user = facture.commande?.user;
    if (user?.nom) {
      return {
        nom: user.nom ?? '', prenom: user.prenom ?? '',
        email: user.email ?? '', telephone: user.telephone ?? '',
        adresse: user.adresse ?? '',
        nomComplet: [user.prenom, user.nom].filter(Boolean).join(' '),
      };
    }
    const c = facture.metadonnees?.client;
    if (c?.nom) {
      return {
        nom: c.nom ?? '', prenom: c.prenom ?? '',
        email: c.email ?? '', telephone: c.telephone ?? c.tel ?? c.phone ?? '',
        adresse: c.adresse ?? '',
        nomComplet: [c.prenom, c.nom].filter(Boolean).join(' '),
      };
    }
    const nomClient = facture.metadonnees?.nom_client?.trim() ?? '';
    const parts = nomClient.split(' ');
    const prenom = parts.length > 1 ? parts[0] : '';
    const nom = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? '';
    return {
      nom, prenom,
      email: facture.metadonnees?.email ?? '',
      telephone: facture.metadonnees?.telephone_client ?? '',
      adresse: facture.metadonnees?.adresse_client ?? '',
      nomComplet: nomClient || 'Client',
    };
  }

  getMontant(facture: Facture): number {
    if (facture.commande?.montantTotal) return Number(facture.commande.montantTotal);
    if (facture.metadonnees?.total) return Number(facture.metadonnees.total);
    const produits = facture.metadonnees?.produits;
    if (!produits?.length) return 0;
    return produits.reduce(
      (sum, p) => sum + Number(p.prix_unitaire ?? p.prix) * Number(p.quantite), 0
    );
  }

  getProduits(facture: Facture): { nom: string; prix: number; quantite: number }[] {
    const lignes = facture.commande?.panier?.lignesPanier;
    if (lignes?.length) {
      return lignes.map((l: any) => ({
        nom: l.gamme?.nom ?? 'Produit',
        prix: Number(l.prixUnitaire),
        quantite: Number(l.quantite),
      }));
    }
    return (facture.metadonnees?.produits ?? []).map(p => ({
      nom: p.nom,
      prix: Number(p.prix_unitaire ?? p.prix),
      quantite: Number(p.quantite),
    }));
  }

  isOverdue(facture: Facture): boolean {
    if (facture.statut_paiement === 'payé') return false;
    return new Date(facture.date_echeance) < new Date();
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'payé': 'Payé', 'impayé': 'Impayé', 'en_attente': 'En attente'
    };
    return labels[statut] ?? statut;
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'payé': 'bg-success', 'impayé': 'bg-danger', 'en_attente': 'bg-warning text-dark'
    };
    return classes[statut] ?? 'bg-secondary';
  }

  // ── Modals ────────────────────────────────────────────────────────
  openViewModal(facture: Facture): void {
    this.factureService.getById(facture.id).subscribe({
      next: (f) => { this.selectedFacture = f; this.showViewModal = true; },
      error: () => { this.selectedFacture = facture; this.showViewModal = true; }
    });
  }
  closeViewModal(): void { this.showViewModal = false; this.selectedFacture = null; }

  openEditModal(facture: Facture): void {
    this.validationErrors = [];
    this.selectedFacture = facture;
    this.editTargetId = facture.id;
    this.editForm = {
      statut_paiement: facture.statut_paiement,
      date_echeance: facture.date_echeance?.substring(0, 10) ?? ''
    };
    this.showEditModal = true;
  }
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedFacture = null;
    this.editTargetId = null;
  }

  updateFacture(): void {
    if (!this.editTargetId) return;
    this.validationErrors = [];
    this.submitting = true;
    this.factureService.update(this.editTargetId, this.editForm).subscribe({
      next: () => {
        this.showSuccess('Facture mise à jour avec succès.');
        this.closeEditModal();
        this.loadFactures();
        this.submitting = false;
      },
      error: (err) => {
        if (err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.showError('Erreur lors de la mise à jour.');
        }
        this.submitting = false;
      }
    });
  }

  openDeleteModal(facture: Facture): void { this.factureToDelete = facture; this.showDeleteModal = true; }
  closeDeleteModal(): void { this.showDeleteModal = false; this.factureToDelete = null; }

  deleteFacture(): void {
    if (!this.factureToDelete) return;
    this.submitting = true;
    this.factureService.delete(this.factureToDelete.id).subscribe({
      next: () => {
        this.showSuccess('Facture supprimée avec succès.');
        this.closeDeleteModal();
        this.loadFactures();
        this.submitting = false;
      },
      error: () => { this.showError('Erreur lors de la suppression.'); this.submitting = false; }
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // PDF individuel — design premium Emerald & Gold (inchangé)
  // ══════════════════════════════════════════════════════════════════
  downloadPdf(facture: Facture): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const E = [6, 95, 70] as [number, number, number];
    const EL = [209, 250, 229] as [number, number, number];
    const EM = [16, 185, 129] as [number, number, number];
    const G = [212, 168, 67] as [number, number, number];
    const GL = [240, 217, 138] as [number, number, number];
    const N = [15, 23, 42] as [number, number, number];
    const S = [71, 85, 105] as [number, number, number];
    const W = [255, 255, 255] as [number, number, number];
    const F = [248, 250, 252] as [number, number, number];

    const tc = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
    const fc = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
    const dc = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

    const client = this.getClientInfo(facture);
    const produits = this.getProduits(facture);
    const montant = this.getMontant(facture);
    const numCmd = facture.commande?.numeroCommande
      ?? `CMD-${facture.numero_facture.replace('FAC-', '')}`;

    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const m = 15;

    fc(W); doc.rect(0, 0, PW, PH, 'F');
    fc(E); doc.rect(0, 0, 8, PH, 'F');
    fc(N); doc.rect(8, 0, PW - 8, 52, 'F');
    fc(G); doc.rect(8, 52, PW - 8, 1.5, 'F');

    fc([255, 255, 255]); doc.setGState({ opacity: 0.04 } as any);
    doc.circle(PW + 10, -10, 70, 'F');
    doc.setGState({ opacity: 1 } as any);

    fc(EM); doc.circle(m + 13, 26, 12, 'F');
    fc(W); doc.circle(m + 13, 26, 9.5, 'F');
    fc(E); doc.circle(m + 13, 26, 7.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(4.5); tc(W);
    doc.text('SEN BIO', m + 13, 24.5, { align: 'center' });
    doc.text('YOFF', m + 13, 27.5, { align: 'center' });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); tc(W);
    doc.text('BIOSEN100', m + 30, 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); tc(GL);
    doc.text('Sen Bio Yoff  •  Yoff  •  +221 77 451 03 13', m + 30, 28);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); tc([148, 163, 184]);
    doc.text('www.biosen100.com', m + 30, 33.5);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); tc(G);
    doc.text('FACTURE', PW - m, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc([148, 163, 184]);
    doc.text(facture.numero_facture, PW - m, 28, { align: 'right' });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); tc(GL);
    doc.text("ÉMISSION :", PW - 65, 38);
    doc.setFont('helvetica', 'normal'); tc(W);
    doc.text(this.formatDate(facture.date_emission), PW - m, 38, { align: 'right' });
    doc.setFont('helvetica', 'bold'); tc(GL);
    doc.text("COMMANDE :", PW - 65, 44.5);
    doc.setFont('helvetica', 'bold'); tc(G);
    doc.text(numCmd, PW - m, 44.5, { align: 'right' });

    const zY = 62;

    fc(F); dc([226, 232, 240]);
    doc.setLineWidth(0.3);
    doc.roundedRect(m, zY, 85, 48, 4, 4, 'FD');
    fc(EM); doc.roundedRect(m, zY, 85, 9, 4, 4, 'F');
    fc(EM); doc.rect(m, zY + 5, 85, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); tc(W);
    doc.text('FACTURER À', m + 5, zY + 6.2);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); tc(N);
    doc.text(client.nomComplet || 'Client', m + 5, zY + 18);

    let cy = zY + 25;
    if (client.telephone) {
      fc(EM); doc.roundedRect(m + 5, cy - 3.5, 14, 5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); tc(W);
      doc.text('TÉL', m + 12, cy - 0.2, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); tc(S);
      doc.text(client.telephone, m + 22, cy - 0.2);
      cy += 9;
    }
    if (client.adresse) {
      fc(E); doc.roundedRect(m + 5, cy - 3.5, 14, 5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); tc(W);
      doc.text('ADR', m + 12, cy - 0.2, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); tc(S);
      const adr = doc.splitTextToSize(client.adresse, 58);
      doc.text(adr[0], m + 22, cy - 0.2);
    }

    const bx = m + 92;
    fc(F); dc([226, 232, 240]);
    doc.roundedRect(bx, zY, PW - m - bx, 48, 4, 4, 'FD');
    fc(N); doc.roundedRect(bx, zY, PW - m - bx, 9, 4, 4, 'F');
    fc(N); doc.rect(bx, zY + 5, PW - m - bx, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); tc(G);
    doc.text('INFORMATIONS', bx + 5, zY + 6.2);

    const infoRows = [
      { label: 'N° Facture', value: facture.numero_facture },
      { label: 'Échéance', value: this.formatDate(facture.date_echeance) },
    ];
    let iy = zY + 17;
    infoRows.forEach(row => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); tc([148, 163, 184]);
      doc.text(row.label.toUpperCase(), bx + 5, iy);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); tc(N);
      doc.text(row.value, bx + 5, iy + 5.5);
      iy += 13;
    });

    const statColors: Record<string, [number, number, number]> = {
      'payé': [6, 95, 70],
      'impayé': [185, 28, 28],
      'en_attente': [146, 64, 14],
    };
    const sc = statColors[facture.statut_paiement] ?? [71, 85, 105];
    fc(sc); doc.roundedRect(bx + 5, iy - 4, 36, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); tc(W);
    doc.text(
      facture.statut_paiement.replace('_', ' ').toUpperCase(),
      bx + 23, iy + 0.5, { align: 'center' }
    );

    const tY = zY + 56;
    fc(N); doc.roundedRect(m, tY, PW - m * 2, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); tc(G);
    doc.text('DÉSIGNATION', m + 8, tY + 6.8);
    doc.text('QTÉ', m + 112, tY + 6.8, { align: 'center' });
    doc.text('PRIX UNIT.', m + 140, tY + 6.8, { align: 'center' });
    doc.text('MONTANT', PW - m - 4, tY + 6.8, { align: 'right' });

    let py = tY + 10;
    produits.forEach((p, i) => {
      const rowH = 13;
      const total = p.prix * p.quantite;
      if (i % 2 === 0) { fc(W); } else { fc(EL); }
      doc.rect(m, py, PW - m * 2, rowH, 'F');

      fc(i % 2 === 0 ? N : E);
      doc.circle(m + 6, py + rowH / 2, 3.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); tc(W);
      doc.text(String(i + 1), m + 6, py + rowH / 2 + 2.4, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(N);
      doc.text(p.nom, m + 13, py + rowH / 2 + 2.4);

      fc([226, 232, 240]);
      doc.roundedRect(m + 107, py + 3.5, 10, 6.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); tc(N);
      doc.text(String(p.quantite), m + 112, py + rowH / 2 + 2.4, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); tc(S);
      doc.text(`${this.formatMontantPdf(p.prix)} F`, m + 140, py + rowH / 2 + 2.4, { align: 'center' });

      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); tc(E);
      doc.text(`${this.formatMontantPdf(total)} F`, PW - m - 4, py + rowH / 2 + 2.4, { align: 'right' });

      dc([209, 250, 229]); doc.setLineWidth(0.15);
      doc.line(m, py + rowH, PW - m, py + rowH);
      py += rowH;
    });

    py += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); tc(S);
    const arr = doc.splitTextToSize('Arrêtée la présente facture à la somme de :', PW / 2 - m - 10);
    doc.text(arr, m, py + 3);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); tc(N);
    doc.text(`${this.formatMontantPdf(montant)} FCFA`, m, py + 11);

    const bW2 = 75; const bH2 = 28;
    const bX2 = PW - m - bW2;
    fc(N); doc.roundedRect(bX2, py - 4, bW2, bH2, 4, 4, 'F');
    fc(G); doc.roundedRect(bX2, py - 4, bW2, 4, 4, 4, 'F');
    fc(G); doc.rect(bX2, py - 1, bW2, 1, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); tc([148, 163, 184]);
    doc.text('TOTAL À PAYER', bX2 + bW2 / 2, py + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); tc(G);
    doc.text(this.formatMontantPdf(montant), bX2 + bW2 - 14, py + 17, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); tc(GL);
    doc.text('FCFA', bX2 + bW2 - 3, py + 17, { align: 'right' });

    py += bH2 + 12;
    fc(F); dc([226, 232, 240]);
    doc.roundedRect(m, py, PW - m * 2, 18, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); tc(E);
    doc.text('CONDITIONS', m + 6, py + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); tc(S);
    doc.text('Échange possible avant utilisation du produit. Aucun retour après utilisation.', m + 6, py + 13);

    const fY = PH - 24;
    fc(G); doc.rect(8, fY - 2, PW - 8, 0.8, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); tc(N);
    doc.text('RC : SN DKR 2022 A 6647', m, fY + 6);
    doc.text('NINEA : 009221079', m + 60, fY + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); tc(S);
    doc.text('Compte UBA : 309070004683', m, fY + 12);
    doc.text('web@biosen100.com', m + 60, fY + 12);

    fc(E); doc.circle(PW - m - 12, fY + 7, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(4.5); tc(W);
    doc.text('SEN BIO', PW - m - 12, fY + 5.5, { align: 'center' });
    doc.text('YOFF', PW - m - 12, fY + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); tc(E);
    doc.text('BIOSEN100', PW - m - 24, fY + 7, { align: 'right' });
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7); tc(S);
    doc.text('Merci de votre confiance', PW - m - 24, fY + 12, { align: 'right' });

    const now = new Date();
    const heure = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); tc([148, 163, 184]);
    doc.text(
      `Généré le ${this.formatDate(now.toISOString())} à ${heure} — ${facture.numero_facture}`,
      PW / 2, PH - 5, { align: 'center' }
    );

    fc(E); doc.rect(0, PH - 2.5, PW, 2.5, 'F');

    doc.save(`facture_${facture.numero_facture}.pdf`);
    this.showSuccess('PDF téléchargé avec succès.');
  }

  // ── Export Excel ──────────────────────────────────────────────────
  exportExcel(): void {
    this.factureService.getAll(this.buildExportFilters()).subscribe({
      next: (res) => {
        import('xlsx').then(XLSX => {
          const data = res.data.map(f => {
            const client = this.getClientInfo(f);
            return {
              'N° Facture': f.numero_facture,
              'N° Commande': f.commande?.numeroCommande ?? '—',
              'Client': client.nomComplet,
              'Email': client.email,
              'Téléphone': client.telephone,
              'Montant (FCFA)': this.getMontant(f),
              'Date Emission': this.formatDate(f.date_emission),
              'Date Echeance': this.formatDate(f.date_echeance),
              'Statut': this.getStatutLabel(f.statut_paiement),
            };
          });
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 30 },
            { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
          ];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Factures');
          XLSX.writeFile(wb, `factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
          this.showSuccess('Export Excel téléchargé avec succès.');
        }).catch(() => this.showError("Erreur lors de l'export Excel."));
      },
      error: () => this.showError('Erreur lors du chargement pour export Excel.')
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // Helpers partagés PDF liste + impression
  // ══════════════════════════════════════════════════════════════════

  private buildFilterSummary(): string {
    const parts: string[] = [];
    if (this.selectedStatut) parts.push(`Statut: ${this.getStatutLabel(this.selectedStatut)}`);
    if (this.selectedMonth) {
      const m = this.months.find(x => x.value === this.selectedMonth);
      if (m) parts.push(`Mois: ${m.label}`);
    }
    if (this.selectedYear) parts.push(`Année: ${this.selectedYear}`);
    if (this.selectedDateDebut) parts.push(`Du: ${this.formatDate(this.selectedDateDebut)}`);
    if (this.selectedDateFin) parts.push(`Au: ${this.formatDate(this.selectedDateFin)}`);
    if (this.searchTerm) parts.push(`Recherche: "${this.searchTerm}"`);
    return parts.join(' | ');
  }

  /** Construit le tableau HTML cloné et stylisé (style Commandes) */
  private buildFacturesTable(factures: Facture[]): string {
    const rows = factures.map((f, i) => {
      const client = this.getClientInfo(f);
      const numCmd = f.commande?.numeroCommande ?? '—';
      const montant = this.formatMontantPdf(this.getMontant(f));

      const statutStyle: Record<string, string> = {
        'payé': 'background:#d1fae5;color:#064e3b;',
        'impayé': 'background:#fee2e2;color:#7f1d1d;',
        'en_attente': 'background:#fef3c7;color:#92400e;',
      };
      const sStyle = statutStyle[f.statut_paiement] ?? 'background:#f1f5f9;color:#475569;';
      const bg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';

      return `<tr style="background:${bg};">
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;color:#065f46;font-weight:700;font-family:monospace;">
          ${f.numero_facture}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;color:#475569;font-family:monospace;">
          ${numCmd}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;color:#111827;font-weight:600;">
          ${client.nomComplet}
          ${client.telephone ? `<br><small style="color:#94a3b8;font-weight:400;font-size:10px;">${client.telephone}</small>` : ''}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;color:#064e3b;font-weight:700;text-align:right;">
          ${montant} <span style="font-size:9px;color:#94a3b8;font-weight:400;">FCFA</span>
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;color:#6b7280;font-family:monospace;">
          ${this.formatDate(f.date_emission)}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;font-family:monospace;
          ${this.isOverdue(f) ? 'color:#dc2626;font-weight:700;' : 'color:#6b7280;'}">
          ${this.formatDate(f.date_echeance)}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;">
          <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;${sStyle}">
            ${this.getStatutLabel(f.statut_paiement).toUpperCase()}
          </span>
        </td>
      </tr>`;
    }).join('');

    return `<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:Arial,sans-serif;">
      <thead>
        <tr>
          <th style="background:#287747;color:#fff;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">N° FACTURE</th>
          <th style="background:#287747;color:#fff;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">N° COMMANDE</th>
          <th style="background:#287747;color:#fff;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">CLIENT</th>
          <th style="background:#287747;color:#fff;padding:10px;text-align:right;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">MONTANT</th>
          <th style="background:#287747;color:#fff;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">ÉMISSION</th>
          <th style="background:#287747;color:#fff;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">ÉCHÉANCE</th>
          <th style="background:#287747;color:#fff;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;">STATUT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  /** Construit le bloc header + stripe + tableau + footer (style Commandes) */
  private buildPdfElement(factures: Facture[]): HTMLElement {
    const date = new Date().toLocaleString('fr-FR');
    const filterSummary = this.buildFilterSummary();
    const tableHtml = this.buildFacturesTable(factures);

    const element = document.createElement('div');
    element.setAttribute('style', 'font-family:Arial,sans-serif;padding:20px;background:#fff;');

    element.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:16px 22px;background:linear-gradient(135deg,#287747 0%,#1a5230 100%);
        border-radius:10px;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${this.getLogoHtml('54px')}
          <div>
            <div style="color:white;font-size:17px;font-weight:800;">Liste des Factures</div>
            <div style="color:rgba(255,255,255,0.65);font-size:9.5px;margin-top:2px;">
              Export automatique — Document confidentiel
            </div>
            ${filterSummary ? `
            <div style="margin-top:7px;background:rgba(255,255,255,0.15);border-radius:5px;
              padding:4px 9px;font-size:9px;color:rgba(255,255,255,0.9);">
              🔍 Filtres : ${filterSummary}
            </div>` : ''}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);
            border-radius:8px;padding:10px 16px;">
            <div style="color:rgba(255,255,255,0.7);font-size:9px;margin-bottom:4px;">📅 ${date}</div>
            <div style="color:#bbf7d0;font-size:18px;font-weight:800;">${factures.length}</div>
            <div style="color:rgba(255,255,255,0.65);font-size:9px;">facture(s)</div>
          </div>
        </div>
      </div>
      <div style="height:4px;background:linear-gradient(to right,#287747,#34d399,#6ee7b7);
        margin-bottom:18px;"></div>
      ${tableHtml}
      <div style="margin-top:16px;padding-top:10px;border-top:1.5px solid #d1e7dd;
        display:flex;justify-content:space-between;align-items:center;
        font-size:9px;color:#9ca3af;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#287747;color:white;padding:2px 9px;border-radius:20px;
            font-size:8.5px;font-weight:700;">CONFIDENTIEL</span>
          <span>© ${new Date().getFullYear()} SenBio — Tous droits réservés</span>
        </div>
        <span>biosens100.com</span>
      </div>`;

    return element;
  }

  // ── Export PDF liste (style Commandes) ────────────────────────────
  exportPDF(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.factureService.getAll(this.buildExportFilters()).subscribe({
      next: (res) => {
        if (res.data.length === 0) { alert('Aucune facture à exporter.'); return; }
        try {
          const opt = {
            margin: [8, 8, 8, 8] as any,
            filename: `factures_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true },
            jsPDF: { orientation: 'landscape' as const, unit: 'mm' as const, format: 'a4' }
          };
          html2pdf().set(opt).from(this.buildPdfElement(res.data)).save();
          this.showSuccess('Export PDF téléchargé avec succès.');
        } catch (error) {
          console.error('Erreur export PDF', error);
          this.showError("Erreur lors de l'export PDF.");
        }
      },
      error: () => this.showError('Erreur lors du chargement pour export PDF.')
    });
  }

  // ── Impression (style Commandes) ──────────────────────────────────
  print(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.factureService.getAll(this.buildExportFilters()).subscribe({
      next: (res) => {
        try {
          const filterSummary = this.buildFilterSummary();
          const date = new Date().toLocaleString('fr-FR');
          const logoHtml = this.getLogoHtml('52px');
          const tableHtml = this.buildFacturesTable(res.data);

          const printWindow = window.open('', '_blank');
          if (!printWindow) { alert('Veuillez autoriser les popups pour imprimer.'); return; }

          printWindow.document.write(`
            <!DOCTYPE html><html lang="fr"><head>
            <meta charset="UTF-8">
            <title>Factures — SenBio</title>
            <style>
              * { box-sizing:border-box; margin:0; padding:0; }
              body { font-family:Arial,sans-serif;background:#fff;padding:22px;font-size:11px; }
              .pdf-header {
                display:flex;justify-content:space-between;align-items:center;
                background:linear-gradient(135deg,#287747 0%,#1a5230 100%);
                border-radius:10px;padding:16px 22px;margin-bottom:0;
              }
              .pdf-header-left { display:flex;align-items:center;gap:14px; }
              .pdf-title       { color:white;font-size:17px;font-weight:800; }
              .pdf-subtitle    { color:rgba(255,255,255,0.65);font-size:9.5px;margin-top:2px; }
              .pdf-stripe      { height:4px;background:linear-gradient(to right,#287747,#34d399,#6ee7b7);margin-bottom:18px; }
              .pdf-meta-box    {
                background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);
                border-radius:8px;padding:10px 16px;text-align:right;
              }
              .pdf-meta-count  { color:#bbf7d0;font-size:18px;font-weight:800; }
              .pdf-meta-label  { color:rgba(255,255,255,0.65);font-size:9px; }
              .pdf-footer      {
                margin-top:16px;padding-top:10px;border-top:1.5px solid #d1e7dd;
                display:flex;justify-content:space-between;font-size:9px;color:#9ca3af;
              }
              .pdf-badge { background:#287747;color:white;padding:2px 9px;border-radius:20px;font-size:8.5px;font-weight:700; }
              table { width:100%;border-collapse:collapse;font-size:10.5px; }
              thead th { background:#287747;color:white;padding:10px;text-align:left;border:1px solid #1d5c35;font-weight:700;font-size:10px; }
              tbody td { padding:9px 10px;border:1px solid #d1fae5;color:#1a2e25;vertical-align:middle; }
              tbody tr:nth-child(even) td { background:#f0fdf4; }
              tbody tr:nth-child(odd)  td { background:#ffffff; }
              @page { size:A4 landscape;margin:10mm; }
              @media print {
                thead th { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                .pdf-header { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                .pdf-stripe { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
              }
            </style></head>
            <body>
              <div class="pdf-header">
                <div class="pdf-header-left">
                  ${logoHtml}
                  <div>
                    <div class="pdf-title">Liste des Factures</div>
                    <div class="pdf-subtitle">Export automatique — Document confidentiel</div>
                    ${filterSummary ? `<div style="margin-top:7px;background:rgba(255,255,255,0.15);
                      border-radius:5px;padding:4px 9px;font-size:9px;color:rgba(255,255,255,0.9);">
                      🔍 Filtres : ${filterSummary}</div>` : ''}
                  </div>
                </div>
                <div class="pdf-meta-box">
                  <div style="color:rgba(255,255,255,0.7);font-size:9px;">📅 ${date}</div>
                  <div class="pdf-meta-count">${res.data.length}</div>
                  <div class="pdf-meta-label">facture(s)</div>
                </div>
              </div>
              <div class="pdf-stripe"></div>
              ${tableHtml}
              <div class="pdf-footer">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="pdf-badge">CONFIDENTIEL</span>
                  <span>© ${new Date().getFullYear()} SenBio — Tous droits réservés</span>
                </div>
                <span>biosens100.com</span>
              </div>
            </body></html>`);

          printWindow.document.close();
          setTimeout(() => printWindow.print(), 400);
        } catch (error) {
          console.error('Erreur impression', error);
          this.showError("Erreur lors de l'impression.");
        }
      },
      error: () => this.showError('Erreur lors du chargement pour impression.')
    });
  }

  // ── Alerts ────────────────────────────────────────────────────────
  closeAlert(): void { this.successMessage = ''; this.errorMessage = ''; }

  private showSuccess(msg: string): void {
    this.successMessage = msg; this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 4000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg; this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }
}