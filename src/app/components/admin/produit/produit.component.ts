import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduitService, PaginatedResponse } from '../../../services/produit/produit.service';
import { CategorieService } from '../../../services/categorie/categorie.service';
import { GammeService } from '../../../services/gamme/gamme.service';
import { Produit } from '../../../models/produit';
import { Categorie } from '../../../models/categorie';
import { map } from 'rxjs/operators';
import { Gamme } from '../../../models/gamme';

@Component({
  selector: 'app-produit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.css']
})
export class ProduitComponent implements OnInit {

  // Données principales
  produits: Produit[] = [];
  categories: Categorie[] = [];
  gammes: Gamme[] = [];

  // Pagination
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
  showImageModal = false;
  showGammesModal = false;
  selectedProduit: Produit | null = null;
  imageModalSrc = '';
  imageModalAlt = '';
  gammesModalProduitNom = '';
  gammesModalList: { id: number; nom: string }[] = [];

  // Formulaires
  createForm = {
    nom: '',
    description: '',
    modeUtilisation: '',
    prix: 0,
    prixPromo: 0,
    enPromotion: false,
    stock: 0,
    noteProduit: 0,
    categorie_id: '',
    gammesIds: [] as number[],
    imageFile: null as File | null
  };

  editForm = {
    id: 0,
    nom: '',
    description: '',
    modeUtilisation: '',
    prix: 0,
    prixPromo: 0,
    enPromotion: false,
    stock: 0,
    noteProduit: 0,
    categorie_id: '',
    gammesIds: [] as number[],
    imageFile: null as File | null,
    removeImage: false,
    existingImage: ''
  };

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  // Prévisualisation image
  createPreview: string | null = null;
  editPreview: string | null = null;

  // Avertissement suppression
  hasAvis = false;

  constructor(
    private produitService: ProduitService,
    private categorieService: CategorieService,
    private gammeService: GammeService
  ) { }

  ngOnInit(): void {
    this.loadProduits();
    this.loadCategories();
    this.loadGammes();
  }

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  loadProduits(page: number = 1, search: string = this.searchTerm): void {
    this.produitService.getAll(page, search).subscribe({
      next: (res: any) => {

        // ---- DEBUG : à supprimer une fois le problème résolu ----
        console.log('=== Réponse brute API produits ===', res);
        // ---------------------------------------------------------

        // Gestion défensive des différentes structures possibles
        // Cas 1 : { data: [...], current_page, last_page, total }  ← Laravel pagination standard
        // Cas 2 : { produits: { data: [...], ... } }               ← enveloppé dans une clé
        // Cas 3 : [ {...}, {...} ]                                  ← tableau direct

        let paginatedData: any = null;

        if (res && Array.isArray(res)) {
          // Cas 3 : tableau direct sans pagination
          this.produits = res;
          this.currentPage = 1;
          this.lastPage = 1;
          this.total = res.length;
          this.firstItem = res.length > 0 ? 1 : 0;
          this.lastItem = res.length;
          return;
        }

        // Cherche la clé qui contient { data: [...] }
        if (res && res.data && Array.isArray(res.data)) {
          paginatedData = res; // Cas 1 direct
        } else if (res) {
          // Cas 2 : cherche une clé imbriquée contenant { data: [] }
          for (const key of Object.keys(res)) {
            if (res[key] && res[key].data && Array.isArray(res[key].data)) {
              paginatedData = res[key];
              console.log(`Données trouvées dans la clé "${key}"`);
              break;
            }
          }
        }

        if (paginatedData) {
          this.produits = paginatedData.data;
          this.currentPage = paginatedData.current_page ?? 1;
          this.lastPage = paginatedData.last_page ?? 1;
          this.total = paginatedData.total ?? paginatedData.data.length;
          this.firstItem = paginatedData.from ?? (paginatedData.data.length > 0 ? 1 : 0);
          this.lastItem = paginatedData.to ?? paginatedData.data.length;
        } else {
          console.warn('Structure de réponse inconnue :', res);
          this.produits = [];
        }
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.errorMessage = 'Impossible de charger les produits.';
      }
    });
  }

  loadCategories(): void {
    this.categorieService.getCategories(1).subscribe({
      next: (res: any) => {
        console.log('=== Réponse brute API catégories ===', res);

        if (Array.isArray(res)) {
          this.categories = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.categories = res.data;
        } else {
          // Cherche une clé imbriquée
          for (const key of Object.keys(res || {})) {
            if (res[key]?.data && Array.isArray(res[key].data)) {
              this.categories = res[key].data;
              return;
            }
          }
          this.categories = [];
        }
      },
      error: (err: any) => console.error('Erreur chargement catégories', err)
    });
  }

  loadGammes(): void {
    this.gammeService.getAll(1).subscribe({
      next: (res: any) => {
        console.log('=== Réponse brute API gammes ===', res);

        if (Array.isArray(res)) {
          this.gammes = res;
        } else if (res?.data && Array.isArray(res.data)) {
          this.gammes = res.data;
        } else {
          for (const key of Object.keys(res || {})) {
            if (res[key]?.data && Array.isArray(res[key].data)) {
              this.gammes = res[key].data;
              return;
            }
          }
          this.gammes = [];
        }
      },
      error: (err) => console.error('Erreur chargement gammes', err)
    });
  }

  search(): void {
    this.currentPage = 1;
    this.loadProduits(1, this.searchTerm);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadProduits(page, this.searchTerm);
    }
  }

  // ============================================================
  // CRÉATION
  // ============================================================

  openCreateModal(): void {
    this.createForm = {
      nom: '',
      description: '',
      modeUtilisation: '',
      prix: 0,
      prixPromo: 0,
      enPromotion: false,
      stock: 0,
      noteProduit: 0,
      categorie_id: '',
      gammesIds: [],
      imageFile: null
    };
    this.createPreview = null;
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onFileSelected(event: Event, type: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (type === 'create') {
        this.createForm.imageFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => this.createPreview = e.target.result;
        reader.readAsDataURL(file);
      } else {
        this.editForm.imageFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => this.editPreview = e.target.result;
        reader.readAsDataURL(file);
      }
    }
  }

  toggleGamme(gammeId: number, isEdit: boolean): void {
    if (isEdit) {
      const index = this.editForm.gammesIds.indexOf(gammeId);
      if (index === -1) this.editForm.gammesIds.push(gammeId);
      else this.editForm.gammesIds.splice(index, 1);
    } else {
      const index = this.createForm.gammesIds.indexOf(gammeId);
      if (index === -1) this.createForm.gammesIds.push(gammeId);
      else this.createForm.gammesIds.splice(index, 1);
    }
  }

  createProduit(): void {
    this.validationErrors = [];

    if (!this.createForm.nom?.trim()) {
      this.validationErrors.push('Le nom est obligatoire.');
      return;
    }

    const formData = this.produitService.buildFormData(
      {
        nom: this.createForm.nom,
        description: this.createForm.description,
        modeUtilisation: this.createForm.modeUtilisation,
        prix: this.createForm.prix,
        prixPromo: this.createForm.prixPromo,
        enPromotion: this.createForm.enPromotion,
        stock: this.createForm.stock,
        noteProduit: this.createForm.noteProduit,
        categorie_id: this.createForm.categorie_id ? +this.createForm.categorie_id : undefined
      },
      this.createForm.gammesIds,
      this.createForm.imageFile || undefined
    );

    this.produitService.create(formData).subscribe({
      next: () => {
        this.successMessage = 'Produit créé avec succès.';
        this.closeCreateModal();
        this.loadProduits(this.currentPage, this.searchTerm);
        setTimeout(() => this.successMessage = null, 4000);
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

  // ============================================================
  // ÉDITION
  // ============================================================

  openEditModal(produit: Produit): void {
    this.selectedProduit = produit;
    this.editForm = {
      id: produit.id,
      nom: produit.nom,
      description: produit.description || '',
      modeUtilisation: produit.modeUtilisation || '',
      prix: produit.prix || 0,
      prixPromo: produit.prixPromo || 0,
      enPromotion: produit.enPromotion || false,
      stock: produit.stock || 0,
      noteProduit: produit.noteProduit || 0,
      categorie_id: produit.categorie_id?.toString() || '',
      gammesIds: produit.gammes?.map(g => g.id) || [],
      imageFile: null,
      removeImage: false,
      existingImage: produit.image || ''
    };
    this.editPreview = null;
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

    this.validationErrors = [];

    if (!this.editForm.nom?.trim()) {
      this.validationErrors.push('Le nom est obligatoire.');
      return;
    }

    const formData = this.produitService.buildFormData(
      {
        nom: this.editForm.nom,
        description: this.editForm.description,
        modeUtilisation: this.editForm.modeUtilisation,
        prix: this.editForm.prix,
        prixPromo: this.editForm.prixPromo,
        enPromotion: this.editForm.enPromotion,
        stock: this.editForm.stock,
        noteProduit: this.editForm.noteProduit,
        categorie_id: this.editForm.categorie_id ? +this.editForm.categorie_id : undefined
      },
      this.editForm.gammesIds,
      this.editForm.imageFile || undefined
    );

    if (this.editForm.removeImage) formData.append('remove_image', '1');

    this.produitService.update(this.editForm.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Produit modifié avec succès.';
        this.closeEditModal();
        this.loadProduits(this.currentPage, this.searchTerm);
        setTimeout(() => this.successMessage = null, 4000);
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

  // ============================================================
  // SUPPRESSION
  // ============================================================

  openDeleteModal(produit: Produit): void {
    this.selectedProduit = produit;
    this.hasAvis = (produit as any).avis_count > 0;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedProduit = null;
  }

  deleteProduit(): void {
    if (!this.selectedProduit) return;
    this.produitService.delete(this.selectedProduit.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Produit supprimé.';
        this.closeDeleteModal();
        // Revenir à la page précédente si la page actuelle est vide
        const newPage = this.produits.length === 1 && this.currentPage > 1
          ? this.currentPage - 1
          : this.currentPage;
        this.loadProduits(newPage, this.searchTerm);
        setTimeout(() => this.successMessage = null, 4000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // ============================================================
  // MODALS SECONDAIRES
  // ============================================================

  openGammesModal(produit: Produit): void {
    if (produit.gammes && produit.gammes.length > 0) {
      this.gammesModalProduitNom = produit.nom;
      this.gammesModalList = produit.gammes;
      this.showGammesModal = true;
    }
  }

  closeGammesModal(): void {
    this.showGammesModal = false;
  }

  openImageModal(src: string, alt: string): void {
    this.imageModalSrc = src;
    this.imageModalAlt = alt;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  getStockClass(stock: number): string {
    if (stock > 10) return 'bg-success';
    if (stock > 0) return 'bg-warning text-dark';
    return 'bg-danger';
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/default-produit.png';
  }
}