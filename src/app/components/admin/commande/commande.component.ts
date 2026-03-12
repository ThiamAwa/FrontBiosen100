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

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Export Excel ─────────────────────────────────────────────────────────
  // ── Construit les données manuellement (ne dépend plus du DOM)
  // ══════════════════════════════════════════════════════════════════════════
  exportExcel(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (this.commandes.length === 0) { alert('Aucune commande à exporter.'); return; }

      // ── Feuille principale : une ligne par commande ──────────────────────
      const dataCommandes = this.commandes.map(c => {
        const produits = this.getProduits(c);
        const produitsStr = produits.length
          ? produits.map(p => `${p.quantite}x ${p.nom} (${p.prix.toLocaleString('fr')} F)`).join(' | ')
          : '—';
        const adresse = [
          c.adresse_client,
          c.ville_zone,
          c.region,
          c.code_postal,
          c.pays
        ].filter(Boolean).join(', ') || '—';

        return {
          'N° Commande': c.numeroCommande,
          'Client': c.user ? `${c.user.prenom ?? ''} ${c.user.nom ?? ''}`.trim() : '—',
          'Téléphone': c.user?.telephone ?? '—',
          'Produits commandés': produitsStr,
          'Montant (FCFA)': Number(c.montantTotal),
          'Date commande': this.formatDate(c.created_at),
          'Adresse livraison': adresse,
          'Boutique': c.boutique?.nom ?? '—',
          'Statut': this.getStatusLabel(c.statut),
          'Note': c.noteCommande ?? '',
        };
      });

      const wsCommandes = XLSX.utils.json_to_sheet(dataCommandes);
      wsCommandes['!cols'] = [
        { wch: 18 }, // N° Commande
        { wch: 26 }, // Client
        { wch: 18 }, // Téléphone
        { wch: 55 }, // Produits
        { wch: 16 }, // Montant
        { wch: 20 }, // Date
        { wch: 36 }, // Adresse
        { wch: 18 }, // Boutique
        { wch: 14 }, // Statut
        { wch: 30 }, // Note
      ];

      // Style header (fond vert)
      const headerRange = XLSX.utils.decode_range(wsCommandes['!ref'] ?? 'A1');
      for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!wsCommandes[cellAddr]) continue;
        wsCommandes[cellAddr].s = {
          fill: { fgColor: { rgb: '287747' } },
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center' }
        };
      }

      // ── Feuille détail produits : une ligne par produit ──────────────────
      const dataProduits: Record<string, any>[] = [];
      this.commandes.forEach(c => {
        const produits = this.getProduits(c);
        if (produits.length === 0) {
          dataProduits.push({
            'N° Commande': c.numeroCommande,
            'Client': c.user ? `${c.user.prenom ?? ''} ${c.user.nom ?? ''}`.trim() : '—',
            'Produit': '—',
            'Quantité': 0,
            'Prix unitaire (F)': 0,
            'Total ligne (F)': 0,
          });
        } else {
          produits.forEach(p => {
            dataProduits.push({
              'N° Commande': c.numeroCommande,
              'Client': c.user ? `${c.user.prenom ?? ''} ${c.user.nom ?? ''}`.trim() : '—',
              'Produit': p.nom,
              'Quantité': p.quantite,
              'Prix unitaire (F)': p.prix,
              'Total ligne (F)': p.prix * p.quantite,
            });
          });
        }
      });

      const wsProduits = XLSX.utils.json_to_sheet(dataProduits);
      wsProduits['!cols'] = [
        { wch: 18 }, { wch: 26 }, { wch: 36 }, { wch: 10 }, { wch: 18 }, { wch: 16 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsCommandes, 'Commandes');
      XLSX.utils.book_append_sheet(wb, wsProduits, 'Détail Produits');
      XLSX.writeFile(wb, `commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur export Excel', error);
      alert('Erreur lors de l\'export Excel.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Helpers tableau HTML (partagé PDF + impression) ─────────────────────
  // ══════════════════════════════════════════════════════════════════════════

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

  /** Construit le tableau HTML des commandes depuis les données (pas depuis le DOM) */
  private buildCommandesTable(commandes: Commande[]): string {
    const rows = commandes.map((c, i) => {
      const produits = this.getProduits(c);
      const bg = i % 2 === 0 ? '#f0fdf4' : '#ffffff';

      // Produits HTML
      const produitsHtml = produits.length
        ? produits.map(p => `
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
              <span style="background:#287747;color:#fff;border-radius:10px;
                padding:1px 7px;font-size:9.5px;font-weight:700;white-space:nowrap;">
                ${p.quantite}x
              </span>
              <span style="font-size:10.5px;color:#1a2e25;">${p.nom}</span>
            </div>
            <div style="font-size:9px;color:#6b7280;padding-left:30px;margin-bottom:2px;">
              ${p.prix.toLocaleString('fr')} F × ${p.quantite}
              = <strong style="color:#287747;">${(p.prix * p.quantite).toLocaleString('fr')} F</strong>
            </div>`
        ).join('')
        : '<span style="color:#9ca3af;font-style:italic;font-size:10px;">Aucun produit</span>';

      // Adresse
      const adresse = [c.ville_zone, c.region, c.pays].filter(Boolean).join(', ') || '—';

      // Statut badge
      const statutColors: Record<string, { bg: string; color: string }> = {
        'en_attente': { bg: '#fef3c7', color: '#92400e' },
        'en_cours': { bg: '#dbeafe', color: '#1e40af' },
        'valider': { bg: '#d1fae5', color: '#064e3b' },
      };
      const sc = statutColors[c.statut] ?? { bg: '#f1f5f9', color: '#475569' };

      return `<tr style="background:${bg};">
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:11px;
          color:#065f46;font-weight:700;font-family:monospace;white-space:nowrap;">
          ${c.numeroCommande}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;">
          <div style="font-size:11px;font-weight:600;color:#111827;">
            ${c.user ? `${c.user.prenom ?? ''} ${c.user.nom ?? ''}`.trim() : '—'}
          </div>
          ${c.user?.telephone
          ? `<div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">${c.user.telephone}</div>`
          : ''}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;">${produitsHtml}</td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;text-align:right;
          font-size:11px;font-weight:700;color:#064e3b;white-space:nowrap;">
          ${Number(c.montantTotal).toLocaleString('fr')}
          <span style="font-size:8.5px;color:#94a3b8;font-weight:400;"> FCFA</span>
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:10px;
          color:#6b7280;font-family:monospace;white-space:nowrap;">
          ${this.formatDate(c.created_at)}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;font-size:10px;color:#374151;">
          ${adresse}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;">
          ${c.boutique
          ? `<span style="background:#dbeafe;color:#1e40af;border-radius:12px;
                padding:2px 9px;font-size:9.5px;font-weight:600;">${c.boutique.nom}</span>`
          : '<span style="color:#9ca3af;">—</span>'}
        </td>
        <td style="padding:9px 10px;border:1px solid #d1fae5;text-align:center;">
          <span style="background:${sc.bg};color:${sc.color};border-radius:12px;
            padding:3px 10px;font-size:9.5px;font-weight:700;display:inline-block;">
            ${this.getStatusLabel(c.statut).toUpperCase()}
          </span>
        </td>
      </tr>`;
    }).join('');

    return `<table style="width:100%;border-collapse:collapse;font-size:11px;font-family:Arial,sans-serif;">
      <thead>
        <tr>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:left;
            border:1px solid #1d5c35;font-size:10px;letter-spacing:.3px;">N° COMMANDE</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:left;
            border:1px solid #1d5c35;font-size:10px;">CLIENT</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:left;
            border:1px solid #1d5c35;font-size:10px;">PRODUITS COMMANDÉS</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:right;
            border:1px solid #1d5c35;font-size:10px;">MONTANT</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:left;
            border:1px solid #1d5c35;font-size:10px;">DATE</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:left;
            border:1px solid #1d5c35;font-size:10px;">ADRESSE LIVRAISON</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:left;
            border:1px solid #1d5c35;font-size:10px;">BOUTIQUE</th>
          <th style="background:#287747;color:#fff;padding:10px 11px;text-align:center;
            border:1px solid #1d5c35;font-size:10px;">STATUT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Construction élément PDF ─────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  private buildPdfElement(commandes: Commande[]): HTMLElement {
    const date = new Date().toLocaleString('fr-FR');
    const filterSummary = this.buildFilterSummary();
    const tableHtml = this.buildCommandesTable(commandes);

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
            <div style="color:#bbf7d0;font-size:18px;font-weight:800;">${commandes.length}</div>
            <div style="color:rgba(255,255,255,0.65);font-size:9px;">commande(s)</div>
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

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Export PDF ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  exportPDF(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (this.commandes.length === 0) { alert('Aucune commande à exporter.'); return; }
      const opt = {
        margin: [8, 8, 8, 8] as any,
        filename: `commandes_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'landscape' as const, unit: 'mm' as const, format: 'a4' }
      };
      html2pdf().set(opt).from(this.buildPdfElement(this.commandes)).save();
    } catch (error) {
      console.error('Erreur export PDF', error);
      alert('Erreur lors de l\'export PDF.');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ─── Impression ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  print(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (this.commandes.length === 0) { alert('Aucune commande à imprimer.'); return; }

      const filterSummary = this.buildFilterSummary();
      const date = new Date().toLocaleString('fr-FR');
      const logoHtml = this.getLogoHtml('52px');
      const tableHtml = this.buildCommandesTable(this.commandes);

      const printWindow = window.open('', '_blank');
      if (!printWindow) { alert('Veuillez autoriser les popups pour imprimer.'); return; }

      printWindow.document.write(`
        <!DOCTYPE html><html lang="fr"><head>
        <meta charset="UTF-8">
        <title>Commandes — SenBio</title>
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
          .pdf-footer {
            margin-top:16px;padding-top:10px;border-top:1.5px solid #d1e7dd;
            display:flex;justify-content:space-between;font-size:9px;color:#9ca3af;
          }
          .pdf-badge { background:#287747;color:white;padding:2px 9px;border-radius:20px;
            font-size:8.5px;font-weight:700; }
          @media print {
            @page { size:A4 landscape;margin:10mm; }
            body { padding:0; }
          }
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
              <div class="pdf-meta-count">${this.commandes.length}</div>
              <div class="pdf-meta-label">commande(s)</div>
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
      alert('Erreur lors de l\'impression.');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

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