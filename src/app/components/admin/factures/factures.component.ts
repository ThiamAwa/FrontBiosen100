import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import {
  Facture, FacturePagination,
  CreateFactureDto,
  UpdateFactureDto
} from '../../../models/facture';
import { User, Commande } from '../../../models/commande';
import { FactureService } from '../../../services/facture/facture.service';

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

  get firstItem(): number { return (this.currentPage - 1) * this.perPage + 1; }
  get lastItem(): number { return Math.min(this.currentPage * this.perPage, this.total); }

  // ── Filtres ──────────────────────────────────────────────────────
  showFilterPanel = false;
  selectedStatut = '';
  selectedPeriode = '';
  selectedMonth = '';
  selectedYear = '';
  selectedDateDebut = '';
  selectedDateFin = '';
  searchTerm = '';

  // Conservé pour compatibilité exports existants
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

  constructor(private factureService: FactureService) { }

  ngOnInit(): void { this.loadFactures(); }

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
    this.selectedStatut = '';
    this.selectedPeriode = '';
    this.selectedMonth = '';
    this.selectedYear = '';
    this.selectedDate = '';
    this.selectedDateDebut = '';
    this.selectedDateFin = '';
    this.searchTerm = '';
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
      'cette_semaine': 'Cette semaine',
      'semaine_derniere': 'Semaine dernière',
      'ce_mois': 'Ce mois',
      'mois_dernier': 'Mois dernier',
      'cette_annee': 'Cette année',
      'custom': 'Personnalisé',
    };
    return labels[periode] ?? periode;
  }

  onPeriodeChange(periode: string): void {
    if (!periode || periode === 'custom') {
      this.selectedMonth = '';
      this.selectedYear = '';
      this.selectedDateDebut = '';
      this.selectedDateFin = '';
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based
    const day = now.getDay();   // 0=dim

    // Lundi semaine courante
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
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private formatMontantPdf(n: number): string {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  getClientInfo(facture: Facture): {
    nom: string; prenom: string; email: string; telephone: string; adresse: string;
  } {
    const user = facture.commande?.user;
    if (user) {
      return {
        nom: user.nom ?? '',
        prenom: user.prenom ?? '',
        email: user.email ?? '',
        telephone: user.telephone ?? '',
        adresse: user.adresse ?? '',
      };
    }
    const c = facture.metadonnees?.client ?? {};
    return {
      nom: c.nom ?? '',
      prenom: c.prenom ?? '',
      email: c.email ?? '',
      telephone: c.telephone ?? c.tel ?? c.phone ?? '',
      adresse: c.adresse ?? '',
    };
  }

  getMontant(facture: Facture): number {
    if (facture.commande?.montantTotal) return Number(facture.commande.montantTotal);
    if (!facture?.metadonnees?.produits?.length) return 0;
    return facture.metadonnees.produits.reduce(
      (sum, p) => sum + Number(p.prix) * Number(p.quantite), 0
    );
  }

  getProduits(facture: Facture): { nom: string; prix: number; quantite: number }[] {
    const lignes = facture.commande?.panier?.lignesPanier;
    if (lignes?.length) {
      return lignes.map(l => ({
        nom: l.gamme?.nom ?? 'Produit',
        prix: Number(l.prixUnitaire),
        quantite: Number(l.quantite),
      }));
    }
    return (facture.metadonnees?.produits ?? []).map(p => ({
      nom: p.nom,
      prix: Number(p.prix),
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

  // ── View Modal ───────────────────────────────────────────────────
  openViewModal(facture: Facture): void {
    this.factureService.getById(facture.id).subscribe({
      next: (f) => { this.selectedFacture = f; this.showViewModal = true; },
      error: () => { this.selectedFacture = facture; this.showViewModal = true; }
    });
  }
  closeViewModal(): void { this.showViewModal = false; this.selectedFacture = null; }

  // ── Edit Modal ───────────────────────────────────────────────────
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

  // ── Delete Modal ─────────────────────────────────────────────────
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

  // ── PDF individuel ───────────────────────────────────────────────
  downloadPdf(facture: Facture): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const VERT = { r: 40, g: 119, b: 71 };
    const VERT_L = { r: 232, g: 245, b: 237 };
    const NOIR = { r: 17, g: 24, b: 39 };
    const GRIS = { r: 75, g: 85, b: 99 };
    const BLANC = { r: 255, g: 255, b: 255 };

    const setV = () => doc.setTextColor(VERT.r, VERT.g, VERT.b);
    const setN = () => doc.setTextColor(NOIR.r, NOIR.g, NOIR.b);
    const setG = () => doc.setTextColor(GRIS.r, GRIS.g, GRIS.b);
    const setW = () => doc.setTextColor(BLANC.r, BLANC.g, BLANC.b);
    const fillV = () => doc.setFillColor(VERT.r, VERT.g, VERT.b);
    const fillVL = () => doc.setFillColor(VERT_L.r, VERT_L.g, VERT_L.b);
    const fillW = () => doc.setFillColor(BLANC.r, BLANC.g, BLANC.b);

    const client = this.getClientInfo(facture);
    const produits = this.getProduits(facture);
    const montant = this.getMontant(facture);
    const clientNomComplet = [client.prenom, client.nom].filter(Boolean).join(' ');
    const numCommande = facture.commande?.numeroCommande
      ?? `CMD-${facture.numero_facture.replace('FAC-', '')}`;

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const m = 14;

    fillV(); doc.rect(0, 0, W, 2.5, 'F');

    fillW();
    doc.setDrawColor(VERT.r, VERT.g, VERT.b);
    doc.setLineWidth(0.8);
    doc.circle(m + 9, 22, 11, 'FD');
    fillV(); doc.circle(m + 9, 22, 9, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); setW();
    doc.text('SEN BIO', m + 9, 20.5, { align: 'center' });
    doc.text('YOFF', m + 9, 24, { align: 'center' });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); setN();
    doc.text('BIOSEN100', m + 23, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setG();
    doc.text('Sen Bio Yoff', m + 23, 24.5);
    doc.text('Yoff', m + 23, 29.5);
    doc.text('774510313', m + 23, 34.5);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setV();
    doc.text('FACTURE', W - m, 13, { align: 'right' });
    doc.setFontSize(17); setN();
    doc.text(facture.numero_facture, W - m, 22, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setG();
    doc.text("Date d'emission :", W - 58, 30);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setN();
    doc.text(this.formatDate(facture.date_emission), W - m, 30, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setG();
    doc.text('Ref. commande :', W - 58, 36);
    doc.setFont('helvetica', 'bold'); setV();
    doc.text(numCommande, W - m, 36, { align: 'right' });

    doc.setDrawColor(200, 210, 200); doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(m, 42, W - m, 42);
    doc.setLineDashPattern([], 0);

    fillV(); doc.rect(m, 46, 2.5, 50, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setV();
    doc.text('FACTURE A', m + 6, 53);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); setN();
    doc.text(clientNomComplet || 'Client', m + 6, 63);

    let infoY = 72;
    const infoItems: { label: string; value: string }[] = [];
    if (client.telephone) infoItems.push({ label: 'TEL.', value: client.telephone });
    if (client.email) infoItems.push({ label: 'EMAIL', value: client.email });
    if (client.adresse) infoItems.push({ label: 'ADRESSE', value: client.adresse });

    infoItems.forEach(item => {
      fillV();
      doc.roundedRect(m + 6, infoY - 4.2, 20, 5.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); setW();
      doc.text(item.label, m + 16, infoY - 0.7, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setN();
      doc.text(item.value, m + 29, infoY - 0.7);
      infoY += 9;
    });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setG();
    doc.text("Date d'echeance :", W - m - 48, 53);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setN();
    doc.text(this.formatDate(facture.date_echeance), W - m, 53, { align: 'right' });

    const statutColors: Record<string, [number, number, number]> = {
      'payé': [40, 119, 71], 'impayé': [220, 38, 38], 'en_attente': [202, 138, 4]
    };
    const sc = statutColors[facture.statut_paiement] ?? [107, 114, 128];
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(W - m - 32, 59, 32, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setW();
    doc.text(facture.statut_paiement.replace('_', ' ').toUpperCase(), W - m - 16, 64.2, { align: 'center' });

    const tY = Math.max(infoY + 6, 104);
    const tW = W - m * 2;
    fillV(); doc.roundedRect(m, tY, tW, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setW();
    doc.text('DESIGNATION', m + 13, tY + 7);
    doc.text('QTE', m + 112, tY + 7, { align: 'center' });
    doc.text('PRIX UNIT.', m + 148, tY + 7, { align: 'center' });
    doc.text('MONTANT', W - m - 3, tY + 7, { align: 'right' });

    let py = tY + 10;
    produits.forEach((p, i) => {
      const total = p.prix * p.quantite;
      const rowH = 13.5;
      if (i % 2 === 0) { fillW(); } else { fillVL(); }
      doc.rect(m, py, tW, rowH, 'F');
      doc.setFillColor(188, 220, 200);
      doc.circle(m + 6, py + rowH / 2, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setV();
      doc.text(String(i + 1), m + 6, py + rowH / 2 + 2.8, { align: 'center' });
      doc.setFont('helvetica', i % 2 === 0 ? 'normal' : 'bold'); doc.setFontSize(9); setN();
      doc.text(p.nom, m + 13, py + rowH / 2 + 2.8);
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(m + 106, py + 3, 12, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setN();
      doc.text(String(p.quantite), m + 112, py + rowH / 2 + 2.8, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setG();
      doc.text(`${this.formatMontantPdf(p.prix)} F`, m + 148, py + rowH / 2 + 2.8, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setN();
      doc.text(`${this.formatMontantPdf(total)} F`, W - m - 3, py + rowH / 2 + 2.8, { align: 'right' });
      doc.setDrawColor(188, 220, 200); doc.setLineWidth(0.2);
      doc.line(m, py + rowH, W - m, py + rowH);
      py += rowH;
    });

    py += 9;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); setG();
    const lignes = doc.splitTextToSize('ARRETEE LA PRESENTE FACTURE A LA SOMME DE FRANCS', W / 2 - m - 8);
    doc.text(lignes, m, py + 4);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setN();
    doc.text(`${this.formatMontantPdf(montant)} FCFA`, m, py + 13);

    const bX = W / 2 + 8;
    const bW = W - m - bX;
    const bH = 30;
    fillV(); doc.roundedRect(bX, py - 3, bW, bH, 4, 4, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); setW();
    doc.text('TOTAL A PAYER', bX + bW - 5, py + 5, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24); setW();
    doc.text(this.formatMontantPdf(montant), bX + bW - 16, py + 19, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setW();
    doc.text('FCFA', bX + bW - 4, py + 19, { align: 'right' });

    py += bH + 6;
    doc.setDrawColor(VERT.r, VERT.g, VERT.b); doc.setLineWidth(1.2);
    doc.line(W / 2 - 3, py + 2, W / 2, py + 5);
    doc.line(W / 2, py + 5, W / 2 + 5, py - 1);

    py += 10;
    doc.setDrawColor(VERT.r, VERT.g, VERT.b); doc.setLineWidth(0.8);
    doc.line(m, py, W - m, py);
    py += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setN();
    doc.text('CONDITIONS', m, py);
    py += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setG();
    doc.text('Echange possible avant utilisation du produit. Aucun retour apres utilisation.', m, py);

    const fY = 256;
    fillW();
    doc.setDrawColor(VERT.r, VERT.g, VERT.b); doc.setLineWidth(0.6);
    doc.circle(W - m - 18, fY + 5, 7, 'FD');
    fillV(); doc.circle(W - m - 18, fY + 5, 5.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(4.5); setW();
    doc.text('SEN BIO', W - m - 18, fY + 3.5, { align: 'center' });
    doc.text('YOFF', W - m - 18, fY + 6.5, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setV();
    doc.text('BIOSEN100', W - m, fY + 4, { align: 'right' });
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); setG();
    doc.text('Merci de votre confiance', W - m, fY + 9.5, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setN();
    doc.text('RC : SN DKR 2022 A 6647', m, fY + 4);
    doc.text('NINEA : 009221079', m + 58, fY + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); setN();
    doc.text('Compte bancaire UBA : 309070004683', m, fY + 10);
    doc.text('Web : www.biosen100.com', m + 68, fY + 10);
    doc.setDrawColor(188, 220, 200); doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(m, fY + 17, W - m, fY + 17);
    doc.setLineDashPattern([], 0);

    const now = new Date();
    const heure = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.setTextColor(160, 170, 160);
    doc.text(
      `Document genere le ${this.formatDate(now.toISOString())} a ${heure} - ${facture.numero_facture}`,
      W / 2, fY + 22, { align: 'center' }
    );
    fillV(); doc.rect(0, H - 2.5, W, 2.5, 'F');
    doc.save(`facture_${facture.numero_facture}.pdf`);
    this.showSuccess('PDF téléchargé avec succès.');
  }

  // ── Export Excel ─────────────────────────────────────────────────
  exportExcel(): void {
    this.factureService.getAll(this.buildExportFilters()).subscribe({
      next: (res) => {
        import('xlsx').then(XLSX => {
          const data = res.data.map(f => ({
            'N° Facture': f.numero_facture,
            'Client': f.metadonnees?.client?.nom ?? f.commande?.user?.nom ?? '',
            'Email': f.metadonnees?.client?.email ?? f.commande?.user?.email ?? '',
            'Montant (FCFA)': this.getMontant(f),
            'Date Emission': this.formatDate(f.date_emission),
            'Date Echeance': this.formatDate(f.date_echeance),
            'Statut': this.getStatutLabel(f.statut_paiement),
          }));
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 18 }, { wch: 25 }, { wch: 30 },
            { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
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

  // ── Export PDF liste ─────────────────────────────────────────────
  exportPDF(): void {
    this.factureService.getAll(this.buildExportFilters()).subscribe({
      next: (res) => this.generateListePdf(res.data),
      error: () => this.showError('Erreur lors du chargement pour export PDF.')
    });
  }

  private generateListePdf(factures: Facture[]): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });

    const VERT = { r: 40, g: 119, b: 71 };
    const NOIR = { r: 17, g: 24, b: 39 };
    const GRIS = { r: 75, g: 85, b: 99 };
    const BLANC = { r: 255, g: 255, b: 255 };
    const VERT_L = { r: 232, g: 245, b: 237 };

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const m = 14;

    const cols = [
      { label: 'N° FACTURE', x: m, w: 38 },
      { label: 'CLIENT', x: m + 38, w: 52 },
      { label: 'MONTANT', x: m + 90, w: 32 },
      { label: 'EMISSION', x: m + 122, w: 30 },
      { label: 'ECHEANCE', x: m + 152, w: 30 },
      { label: 'STATUT', x: m + 182, w: 30 },
    ];

    const headerH = 9;
    const rowH = 9;

    const drawPageHeader = (y: number) => {
      doc.setFillColor(VERT.r, VERT.g, VERT.b);
      doc.rect(0, 0, W, 2.5, 'F');
      doc.setFillColor(VERT.r, VERT.g, VERT.b);
      doc.roundedRect(m, y, W - m * 2, headerH, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(BLANC.r, BLANC.g, BLANC.b);
      cols.forEach(col => doc.text(col.label, col.x + 2, y + 6.2));
    };

    // Titre page 1
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.setTextColor(NOIR.r, NOIR.g, NOIR.b);
    doc.text('LISTE DES FACTURES', m, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(GRIS.r, GRIS.g, GRIS.b);
    const dateLabel = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Edite le ${dateLabel}  -  ${factures.length} facture(s)`, m, 24);
    doc.setDrawColor(VERT.r, VERT.g, VERT.b); doc.setLineWidth(0.5);
    doc.line(m, 28, W - m, 28);

    drawPageHeader(32);
    let rowY = 32 + headerH;

    factures.forEach((f, i) => {
      if (rowY + rowH > H - 10) {
        doc.setFillColor(VERT.r, VERT.g, VERT.b);
        doc.rect(0, H - 2.5, W, 2.5, 'F');
        doc.addPage();
        drawPageHeader(10);
        rowY = 10 + headerH;
      }

      const bg = i % 2 === 0 ? BLANC : VERT_L;
      doc.setFillColor(bg.r, bg.g, bg.b);
      doc.rect(m, rowY, W - m * 2, rowH, 'F');

      const nom = f.metadonnees?.client?.nom ?? f.commande?.user?.nom ?? '-';
      const montant = this.formatMontantPdf(this.getMontant(f));
      const statut = this.getStatutLabel(f.statut_paiement);

      const sc = ({ 'payé': [40, 119, 71], 'impayé': [220, 38, 38], 'en_attente': [202, 138, 4] } as any)[f.statut_paiement] ?? [107, 114, 128];

      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.setTextColor(VERT.r, VERT.g, VERT.b);
      doc.text(f.numero_facture, cols[0].x + 2, rowY + 5.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(NOIR.r, NOIR.g, NOIR.b);
      doc.text(nom.substring(0, 24), cols[1].x + 2, rowY + 5.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(NOIR.r, NOIR.g, NOIR.b);
      doc.text(`${montant} F`, cols[2].x + 2, rowY + 5.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(GRIS.r, GRIS.g, GRIS.b);
      doc.text(this.formatDate(f.date_emission), cols[3].x + 2, rowY + 5.8);
      doc.text(this.formatDate(f.date_echeance), cols[4].x + 2, rowY + 5.8);

      doc.setFillColor(sc[0], sc[1], sc[2]);
      doc.roundedRect(cols[5].x + 2, rowY + 1.5, 24, 6, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
      doc.setTextColor(BLANC.r, BLANC.g, BLANC.b);
      doc.text(statut.toUpperCase(), cols[5].x + 14, rowY + 5.8, { align: 'center' });

      doc.setDrawColor(220, 230, 220); doc.setLineWidth(0.15);
      doc.line(m, rowY + rowH, W - m, rowY + rowH);
      rowY += rowH;
    });

    doc.setFillColor(VERT.r, VERT.g, VERT.b);
    doc.rect(0, H - 2.5, W, 2.5, 'F');

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      doc.setTextColor(160, 170, 160);
      doc.text(`Page ${p} / ${totalPages}`, W - m, H - 5, { align: 'right' });
    }

    doc.save(`liste_factures_${new Date().toISOString().slice(0, 10)}.pdf`);
    this.showSuccess('Export PDF téléchargé avec succès.');
  }

  // ── Impression ───────────────────────────────────────────────────
  print(): void {
    this.factureService.getAll(this.buildExportFilters()).subscribe({
      next: (res) => {
        const rows = res.data.map(f => `
          <tr>
            <td>${f.numero_facture}</td>
            <td>${f.metadonnees?.client?.nom ?? f.commande?.user?.nom ?? '-'}</td>
            <td style="text-align:right">${this.formatMontantPdf(this.getMontant(f))} FCFA</td>
            <td>${this.formatDate(f.date_emission)}</td>
            <td>${this.formatDate(f.date_echeance)}</td>
            <td>${this.getStatutLabel(f.statut_paiement)}</td>
          </tr>`).join('');

        const html = `
          <html><head><title>Liste des Factures</title>
          <style>
            body  { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            h2    { color: #287747; margin-bottom: 4px; }
            p     { color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th    { background: #287747; color: white; padding: 8px; text-align: left; font-size: 11px; }
            td    { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #e8f5ed; }
            @media print { button { display: none; } }
          </style></head>
          <body>
            <h2>LISTE DES FACTURES — BIOSEN100</h2>
            <p>Edité le ${new Date().toLocaleDateString('fr-FR')} &mdash; ${res.data.length} facture(s)</p>
            <table>
              <thead><tr>
                <th>N° Facture</th><th>Client</th><th>Montant</th>
                <th>Émission</th><th>Échéance</th><th>Statut</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </body></html>`;

        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => { win.print(); win.close(); }, 600);
        }
      },
      error: () => this.showError('Erreur lors du chargement pour impression.')
    });
  }

  // ── Alert helpers ─────────────────────────────────────────────────
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