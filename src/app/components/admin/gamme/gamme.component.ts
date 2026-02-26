import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GammeService, GammePagination } from '../../../services/gamme/gamme.service';
import { TypeCategorieService } from '../../../services/type-categorie/type-categorie.service';
import { TypeCategorie } from '../../../models/type-categorie';
import { Gamme } from '../../../models/gamme';

declare var bootstrap: any;

@Component({
  selector: 'app-gamme',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gamme.component.html',
  styleUrls: ['./gamme.component.css']
})
export class GammeComponent implements OnInit, AfterViewInit {
  gammes: Gamme[] = [];
  typeCategories: TypeCategorie[] = [];

  // Pagination
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // Recherche
  searchTerm = '';

  // Modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showImageModal = false;
  selectedGamme: Gamme | null = null;
  imageModalSrc = '';
  imageModalAlt = '';

  // Formulaires
  createForm = {
    nom: '',
    description: '',
    modeUtilisation: '',
    prix: 0,
    prixPromo: 0,
    enPromotion: false,
    stock: 0,
    type_categorie_id: '',
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
    type_categorie_id: '',
    imageFile: null as File | null,
    removeImage: false,
    existingImage: ''
  };

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  // Prévisualisation
  createPreview: string | null = null;
  editPreview: string | null = null;

  hasProduits = false;

  constructor(
    private gammeService: GammeService,
    private typeCategorieService: TypeCategorieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadGammes();
    this.loadTypeCategories();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Bootstrap déjà chargé
    }
  }

  loadGammes(page: number = 1, search: string = this.searchTerm): void {
    this.gammeService.getAll(page, search).subscribe({
      next: (res: GammePagination) => {
        this.gammes = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.firstItem = res.from || 0;
        this.lastItem = res.to || 0;
      },
      error: (err) => {
        console.error('Erreur chargement gammes', err);
        this.errorMessage = 'Impossible de charger les gammes.';
      }
    });
  }

  loadTypeCategories(): void {
    this.typeCategorieService.getTypeCategories(1).subscribe({
      next: (res) => {
        this.typeCategories = res.data;
      },
      error: (err) => console.error('Erreur chargement types', err)
    });
  }

  search(): void {
    this.currentPage = 1;
    this.loadGammes(1, this.searchTerm);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadGammes(page, this.searchTerm);
    }
  }

  // Création
  openCreateModal(): void {
    this.createForm = {
      nom: '',
      description: '',
      modeUtilisation: '',
      prix: 0,
      prixPromo: 0,
      enPromotion: false,
      stock: 0,
      type_categorie_id: '',
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

  createGamme(): void {
    const formData = this.gammeService.buildFormData(
      {
        nom: this.createForm.nom,
        description: this.createForm.description,
        modeUtilisation: this.createForm.modeUtilisation,
        prix: this.createForm.prix,
        prixPromo: this.createForm.prixPromo,
        enPromotion: this.createForm.enPromotion,
        stock: this.createForm.stock,
        type_categorie_id: this.createForm.type_categorie_id ? +this.createForm.type_categorie_id : undefined
      },
      this.createForm.imageFile || undefined
    );

    this.gammeService.create(formData).subscribe({
      next: () => {
        this.successMessage = 'Gamme créée avec succès.';
        this.closeCreateModal();
        this.loadGammes(this.currentPage, this.searchTerm);
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

  // Édition
  openEditModal(gamme: Gamme): void {
    this.selectedGamme = gamme;
    this.editForm = {
      id: gamme.id!,
      nom: gamme.nom,
      description: gamme.description || '',
      modeUtilisation: gamme.modeUtilisation || '',
      prix: gamme.prix || 0,
      prixPromo: gamme.prixPromo || 0,
      enPromotion: gamme.enPromotion || false,
      stock: gamme.stock || 0,
      type_categorie_id: gamme.type_categorie_id?.toString() || '',
      imageFile: null,
      removeImage: false,
      existingImage: gamme.image || ''
    };
    this.editPreview = null;
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedGamme = null;
    this.editPreview = null;
  }

  updateGamme(): void {
    if (!this.selectedGamme) return;
    const partialGamme: Partial<Gamme> = {
      nom: this.editForm.nom,
      description: this.editForm.description,
      modeUtilisation: this.editForm.modeUtilisation,
      prix: this.editForm.prix,
      prixPromo: this.editForm.prixPromo,
      enPromotion: this.editForm.enPromotion,
      stock: this.editForm.stock,
      type_categorie_id: this.editForm.type_categorie_id ? +this.editForm.type_categorie_id : undefined
    };
    const formData = this.gammeService.buildFormData(
      partialGamme,
      this.editForm.imageFile || undefined
    );
    if (this.editForm.removeImage) formData.append('remove_image', '1');

    this.gammeService.update(this.editForm.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Gamme modifiée avec succès.';
        this.closeEditModal();
        this.loadGammes(this.currentPage, this.searchTerm);
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

  // Suppression
  openDeleteModal(gamme: Gamme): void {
    this.selectedGamme = gamme;
    this.hasProduits = (gamme.produits_count ?? 0) > 0;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedGamme = null;
  }

  deleteGamme(): void {
    if (!this.selectedGamme) return;
    this.gammeService.delete(this.selectedGamme.id!).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Gamme supprimée.';
        this.closeDeleteModal();
        this.loadGammes(this.currentPage, this.searchTerm);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // Image modal
  openImageModal(src: string, alt: string): void {
    this.imageModalSrc = src;
    this.imageModalAlt = alt;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
  }

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
    (event.target as HTMLImageElement).src = 'assets/img/default-gamme.png';
  }
}