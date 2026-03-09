import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CommandeService } from '../../../services/commande/commande.service';
import { Commande, CommandeResponse } from '../../../models/commande';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const LOGO_PATH = '/logo-biosen.jpeg';

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

  selectedMonth: string = '';
  selectedYear: string = '';
  selectedDate: string = '';

  logoBase64: string = '';

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
    if (isPlatformBrowser(this.platformId)) {
      this.loadLogoAsBase64();
    }
  }

  ngAfterViewInit(): void { }

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

  // ─── Années ───────────────────────────────────────────────────────────────

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.years.push(y.toString());
    }
  }

  // ─── Chargement commandes ─────────────────────────────────────────────────

  loadCommandes(page: number = this.currentPage): void {
    this.commandeService.getCommandes(
      page,
      this.selectedStatut || undefined,
      this.searchTerm || undefined,
      this.selectedMonth || undefined,
      this.selectedYear || undefined,
      this.selectedDate || undefined
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

  // ─── Filtres ──────────────────────────────────────────────────────────────

  toggleFilterPanel(): void { this.showFilterPanel = !this.showFilterPanel; }

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

  // ─── Produits helper ──────────────────────────────────────────────────────

  getProduits(commande: Commande): { nom: string; prix: number; quantite: number; type: string }[] {
    // Priorité 1 : relation panier->lignesPanier
    const lignes = commande.panier?.lignesPanier;
    if (lignes?.length) {
      return lignes.map((l: any) => ({
        nom: l.gamme?.nom ?? l.produit?.nom ?? 'Produit supprimé',
        prix: Number(l.prixUnitaire ?? l.prix),
        quantite: Number(l.quantite),
        type: l.type ?? 'gamme',
      }));
    }

    // Priorité 2 : champ produits JSON de la commande
    if (commande.produits) {
      const parsed = typeof commande.produits === 'string'
        ? JSON.parse(commande.produits)
        : commande.produits;
      return (parsed ?? []).map((p: any) => ({
        nom: p.nom ?? p.name ?? 'Produit',
        prix: Number(p.prix_unitaire ?? p.price ?? p.prix),
        quantite: Number(p.quantite ?? p.quantity),
        type: p.type ?? 'gamme',
      }));
    }

    return [];
  }

  // ─── Modales ──────────────────────────────────────────────────────────────

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

  // ─── Export Excel ─────────────────────────────────────────────────────────

  exportExcel(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const table = document.getElementById('commandesTable') as HTMLTableElement;
      if (!table) { alert('Erreur: Tableau non trouvé'); return; }

      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      this.removeColumn(clonedTable, 7); // Actions
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

  // ─── Préparation tableau PDF ──────────────────────────────────────────────

  private prepareTableForPdf(source: HTMLTableElement): HTMLTableElement {
    const cloned = source.cloneNode(true) as HTMLTableElement;

    this.removeColumn(cloned, 7); // Actions

    cloned.querySelectorAll('tbody tr').forEach(tr => {
      if (tr.querySelector('td[colspan]')) tr.remove();
    });

    cloned.querySelectorAll('td').forEach(td => {
      const badge = td.querySelector('.badge');
      if (badge) td.innerHTML = badge.textContent?.trim() || '';
    });

    cloned.querySelectorAll('button, .btn, i.fas, i.fa, i.far').forEach(el => el.remove());

    cloned.querySelectorAll('td small').forEach(el => {
      (el as HTMLElement).setAttribute('style',
        'font-size:10px;color:#6b7280;display:block;');
    });

    cloned.setAttribute('style',
      'width:100%;border-collapse:collapse;font-size:11px;font-family:Arial,sans-serif;');

    cloned.querySelectorAll('th').forEach(th => {
      (th as HTMLElement).setAttribute('style',
        'background-color:#287747;color:#fff;padding:10px;text-align:left;' +
        'border:1px solid #1d5c35;font-weight:bold;font-size:10.5px;letter-spacing:0.3px;');
    });

    cloned.querySelectorAll('tbody tr').forEach((tr, i) => {
      const bg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';
      (tr as HTMLElement).setAttribute('style', `background-color:${bg};`);
      tr.querySelectorAll('td').forEach(td => {
        (td as HTMLElement).setAttribute('style',
          'padding:9px 10px;border:1px solid #d1fae5;font-size:11px;' +
          'color:#111827;vertical-align:middle;');
      });
    });

    return cloned;
  }

  // ─── Construction élément PDF ─────────────────────────────────────────────

  private buildPdfElement(clonedTable: HTMLTableElement): HTMLElement {
    const date = new Date().toLocaleString('fr-FR');
    const filterSummary = this.buildFilterSummary();

    const element = document.createElement('div');
    element.setAttribute('style', 'font-family:Arial,sans-serif;padding:20px;background:#fff;');

    element.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:16px 22px;background:linear-gradient(135deg,#287747 0%,#1a5230 100%);
        border-radius:10px;margin-bottom:0;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${this.getLogoHtml('54px')}
          <div>
            <div style="color:white;font-size:17px;font-weight:800;">Liste des Commandes</div>
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
            <div style="color:#bbf7d0;font-size:18px;font-weight:800;">${this.total}</div>
            <div style="color:rgba(255,255,255,0.65);font-size:9px;">commandes</div>
          </div>
        </div>
      </div>
      <div style="height:4px;background:linear-gradient(to right,#287747,#34d399,#6ee7b7);
        margin-bottom:18px;"></div>
      ${clonedTable.outerHTML}
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

  // ─── Export PDF ───────────────────────────────────────────────────────────

  exportPDF(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const table = document.getElementById('commandesTable') as HTMLTableElement;
      if (!table) { alert('Erreur: Tableau non trouvé'); return; }
      if (this.commandes.length === 0) { alert('Aucune commande à exporter.'); return; }

      const clonedTable = this.prepareTableForPdf(table);
      const opt = {
        margin: [8, 8, 8, 8] as any,
        filename: `commandes_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'landscape' as const, unit: 'mm' as const, format: 'a4' }
      };
      html2pdf().set(opt).from(this.buildPdfElement(clonedTable)).save();
    } catch (error) {
      console.error('Erreur export PDF', error);
      alert('Erreur lors de l\'export PDF.');
    }
  }

  // ─── Impression ───────────────────────────────────────────────────────────

  print(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const table = document.getElementById('commandesTable') as HTMLTableElement;
      if (!table) { alert('Erreur: Tableau non trouvé'); return; }

      const clonedTable = this.prepareTableForPdf(table);
      const filterSummary = this.buildFilterSummary();
      const date = new Date().toLocaleString('fr-FR');
      const logoHtml = this.getLogoHtml('52px');

      const printWindow = window.open('', '_blank');
      if (!printWindow) { alert('Veuillez autoriser les popups pour imprimer.'); return; }

      printWindow.document.write(`
        <!DOCTYPE html><html lang="fr"><head>
        <meta charset="UTF-8">
        <title>Commandes — SenBio</title>
        <style>
          * { box-sizing:border-box; margin:0; padding:0; }
          body { font-family:Arial,sans-serif;background:#fff;padding:22px;font-size:11px; }
          .pdf-header { display:flex;justify-content:space-between;align-items:center;
            background:linear-gradient(135deg,#287747 0%,#1a5230 100%);
            border-radius:10px;padding:16px 22px;margin-bottom:0; }
          .pdf-header-left { display:flex;align-items:center;gap:14px; }
          .pdf-title { color:white;font-size:17px;font-weight:800; }
          .pdf-subtitle { color:rgba(255,255,255,0.65);font-size:9.5px;margin-top:2px; }
          .pdf-stripe { height:4px;background:linear-gradient(to right,#287747,#34d399,#6ee7b7);margin-bottom:18px; }
          .pdf-meta-box { background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);
            border-radius:8px;padding:10px 16px;text-align:right; }
          .pdf-meta-count { color:#bbf7d0;font-size:18px;font-weight:800; }
          .pdf-meta-label { color:rgba(255,255,255,0.65);font-size:9px; }
          table { width:100%;border-collapse:collapse;font-size:10.5px; }
          thead th { background:#287747;color:white;padding:10px;text-align:left;
            border:1px solid #1d5c35;font-weight:700;font-size:10px; }
          tbody td { padding:9px 10px;border:1px solid #d1fae5;color:#1a2e25;vertical-align:middle; }
          tbody tr:nth-child(even) td { background:#f0fdf4; }
          tbody tr:nth-child(odd)  td { background:#ffffff; }
          .pdf-footer { margin-top:16px;padding-top:10px;border-top:1.5px solid #d1e7dd;
            display:flex;justify-content:space-between;font-size:9px;color:#9ca3af; }
          .pdf-badge { background:#287747;color:white;padding:2px 9px;border-radius:20px;
            font-size:8.5px;font-weight:700; }
          @page { size:A4 landscape;margin:10mm; }
        </style></head>
        <body>
          <div class="pdf-header">
            <div class="pdf-header-left">
              ${logoHtml}
              <div>
                <div class="pdf-title">Liste des Commandes</div>
                <div class="pdf-subtitle">Export automatique — Document confidentiel</div>
                ${filterSummary ? `<div style="margin-top:7px;background:rgba(255,255,255,0.15);
                  border-radius:5px;padding:4px 9px;font-size:9px;color:rgba(255,255,255,0.9);">
                  🔍 Filtres : ${filterSummary}</div>` : ''}
              </div>
            </div>
            <div class="pdf-meta-box">
              <div style="color:rgba(255,255,255,0.7);font-size:9px;">📅 ${date}</div>
              <div class="pdf-meta-count">${this.total}</div>
              <div class="pdf-meta-label">commandes</div>
            </div>
          </div>
          <div class="pdf-stripe"></div>
          ${clonedTable.outerHTML}
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
      alert('Erreur lors de l\'impression.');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

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