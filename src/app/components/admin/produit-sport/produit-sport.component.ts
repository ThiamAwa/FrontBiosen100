import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { ProduitSport, ProduitMedia, ProduitSportResponse } from '../../../models/produit-sport.model';
// import { SafePipe } from '../../../shared/pipes/safe.pipe';
@Component({
  selector: 'app-produit-sport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produit-sport.component.html',
  styleUrls: ['./produit-sport.component.css']
})
export class ProduitSportComponent implements OnInit {
  // Données
  produits: ProduitSport[] = [];
  categories: { id: number; nom: string }[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;
  searchTerm = '';

  // États des modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showGalerieModal = false;
  showImageModal = false;
  selectedProduit: ProduitSport | null = null;
  selectedForDelete: ProduitSport | null = null;
  imageModalSrc = '';
  imageModalAlt = '';

  // Galerie
  galerieMedias: ProduitMedia[] = [];
  galerieProduitNom = '';
  galerieIndex = 0;
  galerieCount = 0;

  // Formulaires
  createForm = {
    nom: '',
    description: '',
    prix: 0,
    prixPromo: 0,
    enPromotion: false,
    stock: 0,
    categorie_id: '',
    images: [] as File[],
    videos: [] as { url: string; titre: string }[]
  };
  editForm = {
    id: 0,
    nom: '',
    description: '',
    prix: 0,
    prixPromo: 0,
    enPromotion: false,
    stock: 0,
    categorie_id: '',
    images: [] as File[],
    videos: [] as { url: string; titre: string }[],
    mediasASupprimer: [] as number[],
    mediaPrincipalId: null as number | null,
    existingMedias: [] as ProduitMedia[],
    existingImage: ''
  };

  // Prévisualisations images
  createPreviews: { file: File; url: string }[] = [];
  editPreviews: { file: File; url: string }[] = [];

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(private produitSportService: ProduitSportService) { }

  ngOnInit(): void {
    this.loadProduits();
    this.loadCategories();
  }

  // Chargement des produits
  loadProduits(page: number = 1): void {
    this.produitSportService.getProduits(page).subscribe({
      next: (res: ProduitSportResponse) => {
        this.produits = res.produits.data;
        this.currentPage = res.produits.current_page;
        this.lastPage = res.produits.last_page;
        this.total = res.produits.total;
        this.firstItem = (this.currentPage - 1) * res.produits.per_page + 1;
        this.lastItem = Math.min(this.currentPage * res.produits.per_page, this.total);
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.errorMessage = 'Impossible de charger les produits.';
      }
    });
  }

  loadCategories(): void {
    this.produitSportService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Erreur chargement catégories', err)
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadProduits(page);
    }
  }

  // Recherche (à implémenter côté backend)
  search(): void {
    // Appeler le service avec filtre search
    // Pour l'instant, on recharge simplement
    this.loadProduits(1);
  }

  // --- Création ---
  openCreateModal(): void {
    this.createForm = {
      nom: '',
      description: '',
      prix: 0,
      prixPromo: 0,
      enPromotion: false,
      stock: 0,
      categorie_id: '',
      images: [],
      videos: []
    };
    this.createPreviews = [];
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
          reader.onload = (e: any) => {
            this.createPreviews.push({ file, url: e.target.result });
          };
          reader.readAsDataURL(file);
        });
      } else {
        this.editForm.images.push(...files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.editPreviews.push({ file, url: e.target.result });
          };
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

  addVideoRow(type: 'create' | 'edit'): void {
    if (type === 'create') {
      this.createForm.videos.push({ url: '', titre: '' });
    } else {
      this.editForm.videos.push({ url: '', titre: '' });
    }
  }

  removeVideoRow(index: number, type: 'create' | 'edit'): void {
    if (type === 'create') {
      this.createForm.videos.splice(index, 1);
    } else {
      this.editForm.videos.splice(index, 1);
    }
  }

  toggleMediaASupprimer(mediaId: number): void {
    const index = this.editForm.mediasASupprimer.indexOf(mediaId);
    if (index === -1) {
      this.editForm.mediasASupprimer.push(mediaId);
    } else {
      this.editForm.mediasASupprimer.splice(index, 1);
    }
  }

  setMediaPrincipal(mediaId: number): void {
    this.editForm.mediaPrincipalId = mediaId;
  }

  createProduit(): void {
    const formData = new FormData();
    formData.append('nom', this.createForm.nom);
    if (this.createForm.description) formData.append('description', this.createForm.description);
    formData.append('prix', this.createForm.prix.toString());
    if (this.createForm.prixPromo) formData.append('prixPromo', this.createForm.prixPromo.toString());
    formData.append('enPromotion', this.createForm.enPromotion ? '1' : '0');
    formData.append('stock', this.createForm.stock.toString());
    if (this.createForm.categorie_id) formData.append('categorie_id', this.createForm.categorie_id);
    this.createForm.images.forEach(file => formData.append('images[]', file));
    this.createForm.videos.forEach((v, i) => {
      if (v.url) formData.append(`videos_urls[${i}]`, v.url);
      if (v.titre) formData.append(`videos_titres[${i}]`, v.titre);
    });

    this.produitSportService.createProduit(formData).subscribe({
      next: () => {
        this.successMessage = 'Produit sport créé avec succès.';
        this.closeCreateModal();
        this.loadProduits(this.currentPage);
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
  openEditModal(produit: ProduitSport): void {
    this.selectedProduit = produit;
    this.editForm = {
      id: produit.id,
      nom: produit.nom,
      description: produit.description || '',
      prix: produit.prix,
      prixPromo: produit.prixPromo || 0,
      enPromotion: produit.enPromotion,
      stock: produit.stock,
      categorie_id: produit.categorie_id?.toString() || '',
      images: [],
      videos: [],
      mediasASupprimer: [],
      mediaPrincipalId: null,
      existingMedias: produit.medias || [],
      existingImage: produit.image || ''
    };
    this.editPreviews = [];
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProduit = null;
  }

  updateProduit(): void {
    if (!this.selectedProduit) return;

    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('nom', this.editForm.nom);
    if (this.editForm.description) formData.append('description', this.editForm.description);
    formData.append('prix', this.editForm.prix.toString());
    if (this.editForm.prixPromo) formData.append('prixPromo', this.editForm.prixPromo.toString());
    formData.append('enPromotion', this.editForm.enPromotion ? '1' : '0');
    formData.append('stock', this.editForm.stock.toString());
    if (this.editForm.categorie_id) formData.append('categorie_id', this.editForm.categorie_id);
    this.editForm.mediasASupprimer.forEach(id => formData.append('medias_a_supprimer[]', id.toString()));
    if (this.editForm.mediaPrincipalId) formData.append('media_principal_id', this.editForm.mediaPrincipalId.toString());
    this.editForm.images.forEach(file => formData.append('images[]', file));
    this.editForm.videos.forEach((v, i) => {
      if (v.url) formData.append(`videos_urls[${i}]`, v.url);
      if (v.titre) formData.append(`videos_titres[${i}]`, v.titre);
    });

    this.produitSportService.updateProduit(this.editForm.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Produit sport modifié avec succès.';
        this.closeEditModal();
        this.loadProduits(this.currentPage);
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
  openDeleteModal(produit: ProduitSport): void {
    this.selectedForDelete = produit;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedForDelete = null;
  }

  deleteProduit(): void {
    if (!this.selectedForDelete) return;
    this.produitSportService.deleteProduit(this.selectedForDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Produit supprimé.';
        this.closeDeleteModal();
        this.loadProduits(this.currentPage);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // --- Galerie ---
  openGalerieModal(produit: ProduitSport): void {
    this.produitSportService.getMedias(produit.id).subscribe({
      next: (res) => {
        this.galerieMedias = res.medias;
        this.galerieProduitNom = produit.nom;
        this.galerieIndex = 0;
        this.galerieCount = res.medias.length;
        this.showGalerieModal = true;
      },
      error: (err) => console.error('Erreur chargement médias', err)
    });
  }

  closeGalerieModal(): void {
    this.showGalerieModal = false;
  }

  galerieNav(delta: number): void {
    this.galerieIndex = (this.galerieIndex + delta + this.galerieCount) % this.galerieCount;
  }

  setGalerieIndex(index: number): void {
    this.galerieIndex = index;
  }

  // --- Modal image simple (fallback) ---
  openImageModal(src: string, alt: string): void {
    this.imageModalSrc = src;
    this.imageModalAlt = alt;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
  }

  // --- Alertes ---
  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  // --- Helpers pour le template ---
  getMediaPrincipal(produit: ProduitSport): ProduitMedia | undefined {
    return produit.medias?.find(m => m.est_principal) || produit.medias?.find(m => m.type === 'image') || produit.medias?.[0];
  }

  getStockClass(stock: number): string {
    if (stock > 10) return 'bg-success';
    if (stock > 0) return 'bg-warning text-dark';
    return 'bg-danger';
  }

  // Formatage prix
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  // Truncate description
  truncate(text: string, limit: number): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}