import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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

  private readonly baseStorageUrl = 'http://localhost:8000/storage/';

  gammes: Gamme[] = [];
  typeCategories: TypeCategorie[] = [];

  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  searchTerm = '';

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showImageModal = false;
  showBulkPromoModal = false;
  selectedGamme: Gamme | null = null;
  imageModalSrc = '';
  imageModalAlt = '';

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

  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  createPreview: string | null = null;
  editPreview: string | null = null;

  hasProduits = false;

  selectedIds: number[] = [];
  bulkPromoType: 'pourcentage' | 'fixe' = 'pourcentage';
  bulkPromoValue: number = 0;
  bulkPromoErrors: string[] = [];

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
    if (isPlatformBrowser(this.platformId)) { }
  }

  // ============================================================
  // UTILITAIRE IMAGE
  // ============================================================

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('storage/') ? path.replace('storage/', '') : path;
    return `${this.baseStorageUrl}${cleanPath}`;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.style.opacity = '0.3';
    img.style.filter = 'grayscale(100%)';
  }

  // ============================================================
  // CHARGEMENT
  // ============================================================

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
      next: (res) => { this.typeCategories = res.data; },
      error: (err) => console.error('Erreur chargement types', err)
    });
  }

  // ============================================================
  // RECHERCHE & PAGINATION
  // ============================================================

  search(): void {
    this.currentPage = 1;
    this.loadGammes(1, this.searchTerm);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadGammes(page, this.searchTerm);
    }
  }

  // ============================================================
  // MODAL CRÉATION
  // ============================================================

  openCreateModal(): void {
    this.createForm = {
      nom: '', description: '', modeUtilisation: '',
      prix: 0, prixPromo: 0, enPromotion: false,
      stock: 0, type_categorie_id: '', imageFile: null
    };
    this.createPreview = null;
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createPreview = null;
    this.validationErrors = [];
  }

  // ============================================================
  // FICHIER IMAGE
  // ============================================================

  onFileSelected(event: Event, type: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = "L'image ne doit pas dépasser 2MB.";
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Format non supporté. Utilisez JPG, PNG, GIF ou WEBP.';
        return;
      }
      const reader = new FileReader();
      if (type === 'create') {
        this.createForm.imageFile = file;
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.createPreview = e.target?.result as string;
        };
      } else {
        this.editForm.imageFile = file;
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.editPreview = e.target?.result as string;
        };
      }
      reader.readAsDataURL(file);
    }
  }

  // ============================================================
  // CRÉATION
  // ============================================================

  createGamme(): void {
    this.validationErrors = [];
    this.errorMessage = null;

    if (!this.createForm.nom.trim()) {
      this.validationErrors.push('Le nom est obligatoire.');
      return;
    }
    if (!this.createForm.prix || this.createForm.prix <= 0) {
      this.validationErrors.push('Le prix doit être supérieur à 0.');
      return;
    }
    if (this.createForm.enPromotion) {
      if (!this.createForm.prixPromo || this.createForm.prixPromo <= 0) {
        this.validationErrors.push('Le prix promotionnel est obligatoire quand la promotion est activée.');
        return;
      }
      if (this.createForm.prixPromo >= this.createForm.prix) {
        this.validationErrors.push('Le prix promotionnel doit être inférieur au prix normal.');
        return;
      }
    }

    const formData = this.gammeService.buildFormData(
      {
        nom: this.createForm.nom,
        description: this.createForm.description,
        modeUtilisation: this.createForm.modeUtilisation,
        prix: this.createForm.prix,
        prixPromo: this.createForm.prixPromo,
        enPromotion: this.createForm.enPromotion,
        stock: this.createForm.stock,
        type_categorie_id: this.createForm.type_categorie_id
          ? +this.createForm.type_categorie_id
          : undefined
      },
      this.createForm.imageFile || undefined
    );

    this.gammeService.create(formData).subscribe({
      next: () => {
        this.successMessage = 'Gamme créée avec succès.';
        this.closeCreateModal();
        this.loadGammes(this.currentPage, this.searchTerm);
        this.autoCloseAlert();
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
  // MODAL ÉDITION
  // ============================================================

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
    this.validationErrors = [];
  }

  // ============================================================
  // MISE À JOUR
  // ============================================================

  updateGamme(): void {
    if (!this.selectedGamme) return;
    this.validationErrors = [];
    this.errorMessage = null;

    if (!this.editForm.nom.trim()) {
      this.validationErrors.push('Le nom est obligatoire.');
      return;
    }
    if (!this.editForm.prix || this.editForm.prix <= 0) {
      this.validationErrors.push('Le prix doit être supérieur à 0.');
      return;
    }
    if (this.editForm.enPromotion) {
      if (!this.editForm.prixPromo || this.editForm.prixPromo <= 0) {
        this.validationErrors.push('Le prix promotionnel est obligatoire quand la promotion est activée.');
        return;
      }
      if (this.editForm.prixPromo >= this.editForm.prix) {
        this.validationErrors.push('Le prix promotionnel doit être inférieur au prix normal.');
        return;
      }
    }

    const partialGamme: Partial<Gamme> = {
      nom: this.editForm.nom,
      description: this.editForm.description,
      modeUtilisation: this.editForm.modeUtilisation,
      prix: this.editForm.prix,
      prixPromo: this.editForm.prixPromo,
      enPromotion: this.editForm.enPromotion,
      stock: this.editForm.stock,
      type_categorie_id: this.editForm.type_categorie_id
        ? +this.editForm.type_categorie_id
        : undefined
    };

    const formData = this.gammeService.buildFormData(
      partialGamme,
      this.editForm.imageFile || undefined
    );

    if (this.editForm.removeImage) {
      formData.append('remove_image', '1');
    }

    this.gammeService.update(this.editForm.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Gamme modifiée avec succès.';
        this.closeEditModal();
        this.loadGammes(this.currentPage, this.searchTerm);
        this.autoCloseAlert();
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
        this.successMessage = res.message || 'Gamme supprimée avec succès.';
        this.closeDeleteModal();
        if (this.gammes.length === 1 && this.currentPage > 1) {
          this.loadGammes(this.currentPage - 1, this.searchTerm);
        } else {
          this.loadGammes(this.currentPage, this.searchTerm);
        }
        this.autoCloseAlert();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // ============================================================
  // MODAL IMAGE
  // ============================================================

  openImageModal(src: string, alt: string): void {
    if (!src) return;
    this.imageModalSrc = src;
    this.imageModalAlt = alt;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.imageModalSrc = '';
    this.imageModalAlt = '';
  }

  // ============================================================
  // SÉLECTION MULTIPLE
  // ============================================================

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  isAllSelected(): boolean {
    return this.gammes.length > 0 &&
      this.gammes.every(g => this.selectedIds.includes(g.id!));
  }

  isSomeSelected(): boolean {
    return this.selectedIds.length > 0 && !this.isAllSelected();
  }

  toggleSelect(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
    } else {
      this.selectedIds = this.selectedIds.filter(i => i !== id);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds = checked ? this.gammes.map(g => g.id!) : [];
  }

  clearSelection(): void {
    this.selectedIds = [];
  }

  // ============================================================
  // MODAL PROMO GROUPÉE
  // Si toutes les gammes ont déjà un prixPromo → activation directe
  // Sinon → ouvre le modal pour saisir une remise
  // ============================================================

  openBulkPromoModal(): void {
    const gammesSelectionnees = this.gammes.filter(g =>
      this.selectedIds.includes(g.id!)
    );
    const sansPrixPromo = gammesSelectionnees.filter(
      g => !g.prixPromo || g.prixPromo <= 0
    );

    if (sansPrixPromo.length === 0) {
      // Toutes ont déjà un prixPromo → activation directe sans modal
      this.bulkPromoValue = 0;
      this.bulkPromoErrors = [];
      this.bulkActiverPromo();
      return;
    }

    // Certaines n'ont pas de prixPromo → ouvrir le modal
    this.bulkPromoType = 'pourcentage';
    this.bulkPromoValue = 0;
    this.bulkPromoErrors = [];
    this.showBulkPromoModal = true;
  }

  closeBulkPromoModal(): void {
    this.showBulkPromoModal = false;
    this.bulkPromoErrors = [];
  }

  // ============================================================
  // ACTIVER PROMO GROUPÉE
  // - Gamme avec prixPromo existant → récupéré directement
  // - Gamme sans prixPromo → calculé depuis bulkPromoValue
  // - Envoie TOUS les champs pour éviter le 422 Laravel
  // ============================================================

  bulkActiverPromo(): void {
    this.bulkPromoErrors = [];

    const gammesSelectionnees = this.gammes.filter(g =>
      this.selectedIds.includes(g.id!)
    );

    const sansPrixPromo = gammesSelectionnees.filter(
      g => !g.prixPromo || g.prixPromo <= 0
    );

    if (sansPrixPromo.length > 0) {
      if (!this.bulkPromoValue || this.bulkPromoValue <= 0) {
        this.bulkPromoErrors.push(
          `${sansPrixPromo.length} gamme(s) n'ont pas de prix promo : veuillez saisir une remise.`
        );
        return;
      }
      if (this.bulkPromoType === 'pourcentage' && this.bulkPromoValue >= 100) {
        this.bulkPromoErrors.push('Le pourcentage doit être inférieur à 100%.');
        return;
      }
      if (this.bulkPromoType === 'fixe') {
        const invalid = sansPrixPromo.filter(
          g => this.bulkPromoValue >= (g.prix || 0)
        );
        if (invalid.length > 0) {
          this.bulkPromoErrors.push(
            `Le montant est supérieur ou égal au prix de : ${invalid.map(g => g.nom).join(', ')}.`
          );
          return;
        }
      }
    }

    const updates = gammesSelectionnees.map(gamme => {
      let prixPromo: number;

      if (gamme.prixPromo && gamme.prixPromo > 0) {
        // ✅ prixPromo déjà enregistré → on le récupère tel quel
        prixPromo = gamme.prixPromo;
      } else {
        // ⚙️ Calcul depuis la valeur saisie dans le modal
        if (this.bulkPromoType === 'pourcentage') {
          prixPromo = Math.round((gamme.prix || 0) * (1 - this.bulkPromoValue / 100));
        } else {
          prixPromo = Math.round((gamme.prix || 0) - this.bulkPromoValue);
        }
        gamme.prixPromo = prixPromo;
      }

      gamme.enPromotion = true;

      // Envoi de TOUS les champs obligatoires pour éviter le 422
      const formData = this.gammeService.buildFormData(
        {
          nom: gamme.nom,
          description: gamme.description || '',
          modeUtilisation: gamme.modeUtilisation || '',
          prix: gamme.prix,
          stock: gamme.stock,
          type_categorie_id: gamme.type_categorie_id ?? undefined,
          enPromotion: true,
          prixPromo: prixPromo
        },
        undefined
      );
      return this.gammeService.update(gamme.id!, formData);
    });

    forkJoin(updates).subscribe({
      next: () => {
        this.successMessage = `Promotion activée sur ${updates.length} gamme(s) avec succès.`;
        this.closeBulkPromoModal();
        this.clearSelection();
        this.loadGammes(this.currentPage, this.searchTerm);
        this.autoCloseAlert();
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          const messages = Object.values(err.error.errors).flat() as string[];
          this.errorMessage = messages.join(' | ');
        } else {
          this.errorMessage = 'Une erreur est survenue lors de la mise à jour groupée.';
        }
        this.loadGammes(this.currentPage, this.searchTerm);
      }
    });
  }

  // ============================================================
  // DÉSACTIVER PROMO GROUPÉE
  // - Passe enPromotion=false
  // - Conserve prixPromo existant pour réactivation future
  // - Envoie TOUS les champs obligatoires pour éviter le 422
  // ============================================================

  bulkDesactiverPromo(): void {
    const gammesSelectionnees = this.gammes.filter(g =>
      this.selectedIds.includes(g.id!)
    );

    if (gammesSelectionnees.length === 0) {
      this.errorMessage = 'Aucune gamme sélectionnée.';
      return;
    }

    const updates = gammesSelectionnees.map(gamme => {
      gamme.enPromotion = false;

      // Envoi de TOUS les champs obligatoires pour éviter le 422
      const formData = this.gammeService.buildFormData(
        {
          nom: gamme.nom,
          description: gamme.description || '',
          modeUtilisation: gamme.modeUtilisation || '',
          prix: gamme.prix,
          stock: gamme.stock,
          type_categorie_id: gamme.type_categorie_id ?? undefined,
          enPromotion: false,
          prixPromo: gamme.prixPromo || 0
        },
        undefined
      );
      return this.gammeService.update(gamme.id!, formData);
    });

    forkJoin(updates).subscribe({
      next: () => {
        this.successMessage = `Promotion désactivée sur ${updates.length} gamme(s) avec succès.`;
        this.clearSelection();
        this.loadGammes(this.currentPage, this.searchTerm);
        this.autoCloseAlert();
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          const messages = Object.values(err.error.errors).flat() as string[];
          this.errorMessage = messages.join(' | ');
        } else {
          this.errorMessage = 'Erreur lors de la désactivation groupée.';
        }
        this.loadGammes(this.currentPage, this.searchTerm);
      }
    });
  }

  // ============================================================
  // ALERTES
  // ============================================================

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  private autoCloseAlert(): void {
    setTimeout(() => { this.successMessage = null; }, 4000);
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  getStockClass(stock: number): string {
    if (stock > 10) return 'badge-stock-ok';
    if (stock > 0) return 'badge-stock-low';
    return 'badge-stock-empty';
  }
}