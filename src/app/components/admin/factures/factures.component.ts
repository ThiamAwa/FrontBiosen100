import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Facture, FacturePagination,
  CreateFactureDto,
  UpdateFactureDto
} from '../../../models/facture';
import { FactureService } from '../../../services/facture/facture.service';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factures.component.html',
  styleUrls: ['./factures.component.css']
})
export class FacturesComponent implements OnInit {

  // ── Data ────────────────────────────────────────────────────────
  factures: Facture[] = [];
  submitting = false;

  // ── Pagination ──────────────────────────────────────────────────
  currentPage = 1;
  lastPage = 1;
  total = 0;
  perPage = 10;

  get firstItem(): number { return (this.currentPage - 1) * this.perPage + 1; }
  get lastItem(): number { return Math.min(this.currentPage * this.perPage, this.total); }

  // ── Filters ─────────────────────────────────────────────────────
  showFilterPanel = false;
  selectedStatut = '';
  selectedMonth = '';
  selectedYear = '';
  selectedDate = '';
  searchTerm = '';

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
    return !!(this.selectedStatut || this.selectedMonth || this.selectedYear
      || this.selectedDate || this.searchTerm);
  }

  // ── Alerts ──────────────────────────────────────────────────────
  successMessage = '';
  errorMessage = '';
  validationErrors: string[] = [];

  // ── Modals ──────────────────────────────────────────────────────
  showViewModal = false;
  showEditModal = false;
  showDeleteModal = false;

  selectedFacture: Facture | null = null;
  factureToDelete: Facture | null = null;

  editForm: UpdateFactureDto = {
    statut_paiement: 'en_attente',
    date_echeance: ''
  };
  editTargetId: number | null = null;

  constructor(private factureService: FactureService) { }

  ngOnInit(): void {
    this.loadFactures();
  }

  // ── Load ────────────────────────────────────────────────────────
  loadFactures(): void {
    const filters: any = { page: this.currentPage, per_page: this.perPage };
    if (this.selectedStatut) filters['statut_paiement'] = this.selectedStatut;
    if (this.selectedMonth) filters['month'] = this.selectedMonth;
    if (this.selectedYear) filters['year'] = this.selectedYear;
    if (this.selectedDate) filters['date'] = this.selectedDate;
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

  // ── Filters ─────────────────────────────────────────────────────
  toggleFilterPanel(): void { this.showFilterPanel = !this.showFilterPanel; }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadFactures();
  }

  resetFilters(): void {
    this.selectedStatut = '';
    this.selectedMonth = '';
    this.selectedYear = '';
    this.selectedDate = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadFactures();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadFactures();
  }

  // ── Helpers ─────────────────────────────────────────────────────
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getMontant(facture: Facture): number {
    if (facture.commande?.montantTotal) return facture.commande.montantTotal;
    return facture.metadonnees.produits.reduce((sum, p) => sum + p.prix * p.quantite, 0);
  }

  isOverdue(facture: Facture): boolean {
    if (facture.statut_paiement === 'payé') return false;
    return new Date(facture.date_echeance) < new Date();
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'payé': 'Payé',
      'impayé': 'Impayé',
      'en_attente': 'En attente'
    };
    return labels[statut] ?? statut;
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'payé': 'bg-success',
      'impayé': 'bg-danger',
      'en_attente': 'bg-warning text-dark'
    };
    return classes[statut] ?? 'bg-secondary';
  }

  // ── View Modal ──────────────────────────────────────────────────
  openViewModal(facture: Facture): void {
    this.factureService.getById(facture.id).subscribe({
      next: (f) => { this.selectedFacture = f; this.showViewModal = true; },
      error: () => { this.selectedFacture = facture; this.showViewModal = true; }
    });
  }

  closeViewModal(): void { this.showViewModal = false; this.selectedFacture = null; }

  // ── Edit Modal ──────────────────────────────────────────────────
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

  closeEditModal(): void { this.showEditModal = false; this.selectedFacture = null; this.editTargetId = null; }

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
  openDeleteModal(facture: Facture): void {
    this.factureToDelete = facture;
    this.showDeleteModal = true;
  }

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
      error: () => {
        this.showError('Erreur lors de la suppression.');
        this.submitting = false;
      }
    });
  }

  // ── PDF ──────────────────────────────────────────────────────────
  downloadPdf(facture: Facture): void {
    this.factureService.downloadPdf(facture.id, facture.numero_facture);
  }

  // ── Export ───────────────────────────────────────────────────────
  exportExcel(): void {
    // Implémenter selon votre librairie d'export (ex: xlsx)
    console.log('Export Excel');
  }

  exportPDF(): void {
    // Implémenter selon votre librairie (ex: jsPDF)
    console.log('Export PDF');
  }

  print(): void {
    window.print();
  }

  // ── Alert helpers ────────────────────────────────────────────────
  closeAlert(): void { this.successMessage = ''; this.errorMessage = ''; }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 4000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }
}