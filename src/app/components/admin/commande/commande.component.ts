import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CommandeService } from '../../../services/commande/commande.service';
import { Commande, CommandeResponse } from '../../../models/commande';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-commande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.css']
})
export class CommandeComponent implements OnInit, AfterViewInit {
  commandes: Commande[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  selectedStatut: string = '';
  searchTerm: string = '';
  showFilterPanel = false;

  // Filtres date
  selectedMonth: string = '';
  selectedYear: string = '';
  selectedDate: string = '';

  // Listes pour les selects
  months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  years: string[] = [];

  showViewModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCommande: Commande | null = null;
  commandeToDelete: Commande | null = null;

  editForm = {
    statut: '',
    noteCommande: ''
  };

  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(
    private commandeService: CommandeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.generateYears();
    this.loadCommandes();
  }

  ngAfterViewInit(): void { }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.years.push(y.toString());
    }
  }

  loadCommandes(page: number = this.currentPage): void {
    this.commandeService.getCommandes(
      page,
      this.selectedStatut,
      this.searchTerm,
      this.selectedMonth,
      this.selectedYear,
      this.selectedDate
    ).subscribe({
      next: (res: CommandeResponse) => {
        this.commandes = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.firstItem = res.from || 0;
        this.lastItem = res.to || 0;
      },
      error: (err) => {
        console.error('Erreur chargement commandes', err);
        this.errorMessage = 'Impossible de charger les commandes.';
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadCommandes(page);
    }
  }

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadCommandes(1);
  }

  resetFilters(): void {
    this.selectedStatut = '';
    this.searchTerm = '';
    this.selectedMonth = '';
    this.selectedYear = '';
    this.selectedDate = '';
    this.currentPage = 1;
    this.loadCommandes(1);
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.selectedStatut ||
      this.searchTerm ||
      this.selectedMonth ||
      this.selectedYear ||
      this.selectedDate
    );
  }

  openViewModal(commande: Commande): void {
    this.selectedCommande = commande;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCommande = null;
  }

  openEditModal(commande: Commande): void {
    this.selectedCommande = commande;
    this.editForm = {
      statut: commande.statut,
      noteCommande: commande.noteCommande || ''
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedCommande = null;
  }

  updateCommande(): void {
    if (!this.selectedCommande) return;
    const data = {
      statut: this.editForm.statut,
      noteCommande: this.editForm.noteCommande || undefined
    };
    this.commandeService.updateCommande(this.selectedCommande.id, data).subscribe({
      next: () => {
        this.successMessage = 'Statut mis à jour avec succès.';
        this.closeEditModal();
        this.loadCommandes(this.currentPage);
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour.';
        }
      }
    });
  }

  openDeleteModal(commande: Commande): void {
    this.commandeToDelete = commande;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.commandeToDelete = null;
  }

  deleteCommande(): void {
    if (!this.commandeToDelete) return;
    this.commandeService.deleteCommande(this.commandeToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Commande supprimée.';
        this.closeDeleteModal();
        this.loadCommandes(this.currentPage);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // --- Export Excel ---
  exportExcel(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const table = document.getElementById('commandesTable') as HTMLTableElement;
      if (!table) { alert('Erreur: Tableau non trouvé'); return; }

      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      this.removeColumn(clonedTable, 6);
      clonedTable.querySelectorAll('td').forEach(td => {
        const badge = td.querySelector('.badge');
        if (badge) td.innerHTML = badge.textContent || '';
      });

      const ws = XLSX.utils.table_to_sheet(clonedTable);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
      XLSX.writeFile(wb, `commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur export Excel', error);
      alert('Erreur lors de l\'export Excel.');
    }
  }

  // --- Export PDF ---
  exportPDF(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const table = document.getElementById('commandesTable') as HTMLTableElement;
      if (!table) { alert('Erreur: Tableau non trouvé'); return; }

      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      this.removeColumn(clonedTable, 6);

      clonedTable.querySelectorAll('td').forEach(td => {
        const badge = td.querySelector('.badge');
        if (badge) td.innerHTML = badge.textContent?.trim() || '';
      });

      clonedTable.setAttribute('style', `
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        font-family: Arial, sans-serif;
      `);

      clonedTable.querySelectorAll('th').forEach(th => {
        (th as HTMLElement).setAttribute('style', `
          background-color: #10b981;
          color: #ffffff;
          padding: 10px 8px;
          text-align: left;
          border: 1px solid #059669;
          font-weight: bold;
          font-size: 11px;
        `);
      });

      clonedTable.querySelectorAll('tbody tr').forEach((tr, i) => {
        const bg = i % 2 === 0 ? '#ecfdf5' : '#ffffff';
        (tr as HTMLElement).setAttribute('style', `background-color: ${bg};`);
        tr.querySelectorAll('td').forEach(td => {
          (td as HTMLElement).setAttribute('style', `
            padding: 8px;
            border: 1px solid #d1fae5;
            font-size: 11px;
            color: #111827;
          `);
        });
      });

      const date = new Date().toLocaleString('fr-FR');
      const totalCommandes = this.total;

      // Résumé des filtres actifs pour le PDF
      const filterSummary = this.buildFilterSummary();

      const element = document.createElement('div');
      element.setAttribute('style', 'font-family: Arial, sans-serif; padding: 20px;');
      element.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #10b981, #34d399);
          color: white;
          padding: 20px 25px;
          border-radius: 8px;
          margin-bottom: 20px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">
                🛒 BioSen100
              </h2>
              <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">
                Liste des Commandes
              </p>
              ${filterSummary ? `<p style="margin: 5px 0 0; font-size: 11px; opacity: 0.85;">🔍 Filtres : ${filterSummary}</p>` : ''}
            </div>
            <div style="text-align: right; font-size: 11px; opacity: 0.9;">
              <p style="margin: 0;">📅 Généré le ${date}</p>
              <p style="margin: 5px 0 0;">
                📦 Total : <strong>${totalCommandes} commande(s)</strong>
              </p>
            </div>
          </div>
        </div>

        <div style="
          height: 4px;
          background: linear-gradient(to right, #10b981, #34d399, #6ee7b7);
          border-radius: 2px;
          margin-bottom: 18px;
        "></div>

        ${clonedTable.outerHTML}

        <div style="
          margin-top: 20px;
          padding-top: 10px;
          border-top: 2px solid #d1fae5;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #6b7280;
        ">
          <span>© ${new Date().getFullYear()} BioSen100 — Document confidentiel</span>
          <span>Export automatique — biosens100.com</span>
        </div>
      `;

      const opt = {
        margin: [8, 8, 8, 8] as any,
        filename: `commandes_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'landscape' as const, unit: 'mm' as const, format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erreur export PDF', error);
      alert('Erreur lors de l\'export PDF.');
    }
  }

  // --- Imprimer ---
  print(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const table = document.getElementById('commandesTable') as HTMLTableElement;
      if (!table) { alert('Erreur: Tableau non trouvé'); return; }

      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      this.removeColumn(clonedTable, 6);
      clonedTable.querySelectorAll('td').forEach(td => {
        const badge = td.querySelector('.badge');
        if (badge) td.innerHTML = badge.textContent || '';
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) { alert('Veuillez autoriser les popups pour imprimer.'); return; }

      const filterSummary = this.buildFilterSummary();

      printWindow.document.write(`
        <html>
          <head>
            <title>Impression - Liste des Commandes</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h2 { text-align: center; color: #10b981; }
              p { text-align: center; color: #666; font-size: 12px; }
              .filter-info { text-align: center; color: #10b981; font-size: 11px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th { background-color: #10b981; color: white; padding: 10px 8px; border: 1px solid #059669; text-align: left; }
              td { border: 1px solid #d1fae5; padding: 8px; }
              tr:nth-child(even) { background-color: #ecfdf5; }
              .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #d1fae5; padding-top: 8px; }
            </style>
          </head>
          <body>
            <h2>🛒 Liste des Commandes — BioSen100</h2>
            <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
            ${filterSummary ? `<p class="filter-info">🔍 Filtres appliqués : ${filterSummary}</p>` : ''}
            ${clonedTable.outerHTML}
            <div class="footer">© ${new Date().getFullYear()} BioSen100 — Document confidentiel</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    } catch (error) {
      console.error('Erreur impression', error);
      alert('Erreur lors de l\'impression.');
    }
  }

  // Construire un résumé lisible des filtres actifs
  private buildFilterSummary(): string {
    const parts: string[] = [];
    if (this.selectedStatut) parts.push(`Statut: ${this.getStatusLabel(this.selectedStatut)}`);
    if (this.selectedMonth) {
      const m = this.months.find(x => x.value === this.selectedMonth);
      if (m) parts.push(`Mois: ${m.label}`);
    }
    if (this.selectedYear) parts.push(`Année: ${this.selectedYear}`);
    if (this.selectedDate) parts.push(`Date: ${new Date(this.selectedDate).toLocaleDateString('fr-FR')}`);
    if (this.searchTerm) parts.push(`Recherche: "${this.searchTerm}"`);
    return parts.join(' | ');
  }

  private removeColumn(table: HTMLTableElement, columnIndex: number): void {
    const rows = table.rows;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].cells[columnIndex]) {
        rows[i].deleteCell(columnIndex);
      }
    }
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'bg-warning text-dark';
      case 'en_cours': return 'bg-info';
      case 'valider': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'valider': return 'Validée';
      default: return statut;
    }
  }

  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleString('fr-FR') : '';
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}