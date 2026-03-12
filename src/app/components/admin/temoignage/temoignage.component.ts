import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemoignageService } from '../../../services/temoignage/temoignage.service';
import { Temoignage } from '../../../models/temoignage';

@Component({
  selector: 'app-temoignage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './temoignage.component.html',
  styleUrls: ['./temoignage.component.css']
})
export class TemoignageComponent implements OnInit {
  // Données
  temoignages: Temoignage[] = [];
  gammes: any[] = [];
  clients: any[] = [];

  // Pagination
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // États des modales
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showDeleteModal = false;
  selectedTemoignage: Temoignage | null = null;
  temoignageToDelete: Temoignage | null = null;

  // Type de client (manuel / inscrit)
  clientType: 'manuel' | 'inscrit' = 'manuel';

  // Formulaire de création
  createForm = {
    nom_client: '',
    user_id: '',
    gamme_id: '',
    description: '',
    video_url: '',
    afficher: true,
    images: [] as File[]
  };

  // Formulaire d'édition
  editForm = {
    id: 0,
    nom_client: '',
    user_id: '',
    gamme_id: '',
    description: '',
    video_url: '',
    afficher: true,
    images: [] as File[],
    supprimer_images: false,
    existingImages: [] as string[]
  };

  // Prévisualisations
  createPreviews: { file: File; url: string }[] = [];
  editPreviews: { file: File; url: string }[] = [];

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(private temoignageService: TemoignageService) { }

  ngOnInit(): void {
    this.loadTemoignages();
    this.loadGammes();
    this.loadClients();
  }

  // Charger les témoignages (paginés)
  loadTemoignages(page: number = 1): void {
    this.temoignageService.getTemoignagesAdmin(page).subscribe({
      next: (res) => {
        this.temoignages = res.temoignages.data;
        this.currentPage = res.temoignages.current_page;
        this.lastPage = res.temoignages.last_page;
        this.total = res.temoignages.total;
        this.firstItem = res.temoignages.from || 0;
        this.lastItem = res.temoignages.to || 0;
      },
      error: (err) => {
        console.error('Erreur chargement témoignages', err);
        this.errorMessage = 'Impossible de charger les témoignages.';
      }
    });
  }

  // Charger les gammes pour les selects
  loadGammes(): void {
    this.temoignageService.getGammes().subscribe({
      next: (data) => (this.gammes = data),
      error: (err) => console.error('Erreur chargement gammes', err)
    });
  }

  // Charger les clients pour les selects
  loadClients(): void {
    this.temoignageService.getClients().subscribe({
      next: (data) => (this.clients = data),
      error: (err) => console.error('Erreur chargement clients', err)
    });
  }

  // Changer de page
  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadTemoignages(page);
    }
  }

  // Générer la liste des pages pour la pagination
  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.lastPage; i++) pages.push(i);
    return pages;
  }

  // --- Création ---
  openCreateModal(): void {
    this.createForm = {
      nom_client: '',
      user_id: '',
      gamme_id: '',
      description: '',
      video_url: '',
      afficher: true,
      images: []
    };
    this.createPreviews = [];
    this.clientType = 'manuel';
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onFileSelected(event: Event, type: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      if (type === 'create') {
        this.createForm.images.push(...files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e: any) => this.createPreviews.push({ file, url: e.target.result });
          reader.readAsDataURL(file);
        });
      } else {
        this.editForm.images.push(...files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e: any) => this.editPreviews.push({ file, url: e.target.result });
          reader.readAsDataURL(file);
        });
      }
    }
  }

  removePreview(index: number, type: 'create' | 'edit'): void {
    if (type === 'create') {
      this.createForm.images.splice(index, 1);
      this.createPreviews.splice(index, 1);
    } else {
      this.editForm.images.splice(index, 1);
      this.editPreviews.splice(index, 1);
    }
  }

  createTemoignage(): void {
    const formData = new FormData();
    if (this.clientType === 'manuel') {
      if (this.createForm.nom_client) formData.append('nom_client', this.createForm.nom_client);
    } else {
      if (this.createForm.user_id) formData.append('user_id', this.createForm.user_id);
    }
    if (this.createForm.gamme_id) formData.append('gamme_id', this.createForm.gamme_id);
    if (this.createForm.description) formData.append('description', this.createForm.description);
    if (this.createForm.video_url) formData.append('video_url', this.createForm.video_url);
    formData.append('afficher', this.createForm.afficher ? '1' : '0');
    this.createForm.images.forEach(file => formData.append('images[]', file));

    this.temoignageService.createTemoignage(formData).subscribe({
      next: () => {
        this.successMessage = 'Témoignage créé avec succès.';
        this.closeCreateModal();
        this.loadTemoignages(this.currentPage);
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la création.';
        }
      }
    });
  }

  // --- Édition ---
  openEditModal(temoignage: Temoignage): void {
    this.selectedTemoignage = temoignage;
    this.clientType = temoignage.user_id ? 'inscrit' : 'manuel';
    this.editForm = {
      id: temoignage.id,
      nom_client: temoignage.nom_client || '',
      user_id: temoignage.user_id?.toString() || '',
      gamme_id: temoignage.gamme_id?.toString() || '',
      description: temoignage.description || '',
      video_url: temoignage.video_url || '',
      afficher: temoignage.afficher,
      images: [],
      supprimer_images: false,
      existingImages: temoignage.images || []
    };
    this.editPreviews = [];
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTemoignage = null;
  }

  updateTemoignage(): void {
    if (!this.selectedTemoignage) return;
    const formData = new FormData();
    if (this.clientType === 'manuel') {
      if (this.editForm.nom_client) formData.append('nom_client', this.editForm.nom_client);
    } else {
      if (this.editForm.user_id) formData.append('user_id', this.editForm.user_id);
    }
    if (this.editForm.gamme_id) formData.append('gamme_id', this.editForm.gamme_id);
    if (this.editForm.description) formData.append('description', this.editForm.description);
    if (this.editForm.video_url) formData.append('video_url', this.editForm.video_url);
    formData.append('afficher', this.editForm.afficher ? '1' : '0');
    if (this.editForm.supprimer_images) formData.append('supprimer_images', '1');
    this.editForm.images.forEach(file => formData.append('images[]', file));

    this.temoignageService.updateTemoignage(this.editForm.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Témoignage modifié avec succès.';
        this.closeEditModal();
        this.loadTemoignages(this.currentPage);
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la modification.';
        }
      }
    });
  }

  // --- Suppression ---
  openDeleteModal(temoignage: Temoignage): void {
    this.temoignageToDelete = temoignage;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.temoignageToDelete = null;
  }

  deleteTemoignage(): void {
    if (!this.temoignageToDelete) return;
    this.temoignageService.deleteTemoignage(this.temoignageToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Témoignage supprimé.';
        this.closeDeleteModal();
        this.loadTemoignages(this.currentPage);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }
  openImage(url: string): void {
    window.open(url, '_blank');
  }

  // --- Vue détail ---
  openViewModal(temoignage: Temoignage): void {
    this.selectedTemoignage = temoignage;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedTemoignage = null;
  }

  // --- Helpers ---
  getNomComplet(t: Temoignage): string {
    return t.nom_complet || 'Anonyme';
  }

  getInitials(t: Temoignage): string {
    const name = this.getNomComplet(t);
    const parts = name.split(' ');
    return (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '');
  }

  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
  }

  isInscrit(t: Temoignage): boolean {
    return !!t.user_id;
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
    this.validationErrors = [];
  }
}