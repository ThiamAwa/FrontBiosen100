import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProduitSportService, ProduitSport, TypeCategorie, MediasResponse } from '../../../services/produit-sport/produit-sport.service';

interface ImagePreview {
  file: File;
  url: string;
}

interface GalleryMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  titre?: string;
}

@Component({
  selector: 'app-produit-sport',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './produit-sport.component.html',
  styleUrls: ['./produit-sport.component.css']
})
export class ProduitSportComponent implements OnInit {
  @ViewChild('fileInputCreate') fileInputCreate!: ElementRef<HTMLInputElement>;

  // Données
  produits: ProduitSport[] = [];
  typeCategories: TypeCategorie[] = [];
  total = 0;
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  firstItem = 0;
  lastItem = 0;

  // États
  loading = false;
  successMessage = '';
  errorMessage = '';
  validationErrors: string[] = [];

  // Modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showGalleryModal = false;
  showImageModal = false;

  // Produit sélectionné
  selectedProduit: ProduitSport | null = null;
  produitToDelete: ProduitSport | null = null;

  // Médias existants pour l'édition
  existingMedias: any[] = [];

  // Galerie
  galleryMedias: GalleryMedia[] = [];
  galleryProduitNom = '';
  currentMediaIndex = 0;
  currentMediaUrl: SafeResourceUrl | string | null = null;
  currentMediaType: 'image' | 'video' | null = null;

  // Aperçus images
  createImagePreviews: ImagePreview[] = [];
  editImagePreviews: ImagePreview[] = [];

  // Formulaires
  createForm: FormGroup;
  editForm: FormGroup;

  // Vidéos (form arrays)
  videosUrlsCreate: FormArray;
  videosTitresCreate: FormArray;
  videosUrlsEdit: FormArray;
  videosTitresEdit: FormArray;

  // Pour la suppression d'images existantes
  existingMediaToDelete: string[] = [];

  constructor(
    private fb: FormBuilder,
    public produitService: ProduitSportService,
    private sanitizer: DomSanitizer
  ) {
    this.createForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      prix: ['', [Validators.required, Validators.min(0)]],
      prixPromo: [null],
      stock: ['', [Validators.required, Validators.min(0)]],
      enPromotion: [false],
      type_categorie_id: [null, Validators.required],
    });

    this.editForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      prix: ['', [Validators.required, Validators.min(0)]],
      prixPromo: [null],
      stock: ['', [Validators.required, Validators.min(0)]],
      enPromotion: [false],
      type_categorie_id: [null],
    });

    this.videosUrlsCreate = this.fb.array([]);
    this.videosTitresCreate = this.fb.array([]);
    this.videosUrlsEdit = this.fb.array([]);
    this.videosTitresEdit = this.fb.array([]);
  }

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(page: number = 1): void {
    this.loading = true;
    this.produitService.getProduitsWithFilters({ page }).subscribe({
      next: (res) => {
        this.produits = res.produits.data;
        this.typeCategories = res.typeCategories;
        this.currentPage = res.produits.current_page;
        this.lastPage = res.produits.last_page;
        this.perPage = res.produits.per_page;
        this.total = res.produits.total;
        this.firstItem = (this.currentPage - 1) * this.perPage + 1;
        this.lastItem = Math.min(this.currentPage * this.perPage, this.total);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des produits.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) this.loadProduits(page);
  }

  closeAlert(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.validationErrors = [];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers pour la liste
  // ──────────────────────────────────────────────────────────────────────────

  getMediaPrincipal(produit: ProduitSport): { type: 'image' | 'video', url: string, thumbnail?: string } | null {
    if (produit.imageUrls && produit.imageUrls.length > 0) {
      return { type: 'image', url: produit.imageUrls[0] };
    }
    if (produit.video) {
      const embedUrl = this.produitService.getEmbedUrl(produit.video);
      const thumbnail = this.produitService.getYouTubeThumbnail(produit.video);
      return { type: 'video', url: embedUrl || produit.video, thumbnail: thumbnail || undefined };
    }
    return null;
  }

  getMediaCount(produit: ProduitSport): number {
    let count = produit.imageUrls?.length || 0;
    if (produit.video) count++;
    return count;
  }

  getTypeCategorie(produit: ProduitSport): string {
    return produit.typeCategorie?.nom || 'Non défini';
  }

  openImageModal(url: string, nom: string): void {
    this.currentMediaUrl = url;
    this.currentMediaType = 'image';
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.currentMediaUrl = null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD Création
  // ──────────────────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetCreateForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetCreateForm();
  }

  resetCreateForm(): void {
    this.createForm.reset({
      nom: '',
      description: '',
      prix: '',
      prixPromo: null,
      stock: '',
      enPromotion: false,
      type_categorie_id: null
    });
    this.createImagePreviews = [];
    this.videosUrlsCreate.clear();
    this.videosTitresCreate.clear();
    if (this.fileInputCreate) this.fileInputCreate.nativeElement.value = '';
  }

  onFileChange(event: Event, mode: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const previews = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    if (mode === 'create') this.createImagePreviews = [...this.createImagePreviews, ...previews];
    else this.editImagePreviews = [...this.editImagePreviews, ...previews];
    input.value = '';
  }

  removePreview(index: number, mode: 'create' | 'edit'): void {
    if (mode === 'create') {
      URL.revokeObjectURL(this.createImagePreviews[index].url);
      this.createImagePreviews.splice(index, 1);
    } else {
      URL.revokeObjectURL(this.editImagePreviews[index].url);
      this.editImagePreviews.splice(index, 1);
    }
  }

  addVideoRow(form: 'create' | 'edit'): void {
    if (form === 'create') {
      this.videosUrlsCreate.push(this.fb.control('', Validators.pattern(/^https?:\/\//)));
      this.videosTitresCreate.push(this.fb.control(''));
    } else {
      this.videosUrlsEdit.push(this.fb.control('', Validators.pattern(/^https?:\/\//)));
      this.videosTitresEdit.push(this.fb.control(''));
    }
  }

  removeVideoRow(index: number, form: 'create' | 'edit'): void {
    if (form === 'create') {
      this.videosUrlsCreate.removeAt(index);
      this.videosTitresCreate.removeAt(index);
    } else {
      this.videosUrlsEdit.removeAt(index);
      this.videosTitresEdit.removeAt(index);
    }
  }

  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.createForm.value.nom);
    if (this.createForm.value.description) {
      formData.append('description', this.createForm.value.description);
    }
    formData.append('prix', this.createForm.value.prix);
    if (this.createForm.value.prixPromo) {
      formData.append('prixPromo', this.createForm.value.prixPromo);
    }
    formData.append('stock', this.createForm.value.stock);
    formData.append('enPromotion', this.createForm.value.enPromotion ? '1' : '0');

    // ✅ Envoyer type_categorie_id seulement s'il a une valeur
    const typeCategorieId = this.createForm.value.type_categorie_id;
    if (typeCategorieId != null) {
      formData.append('type_categorie_id', typeCategorieId);
    }

    // Images
    this.createImagePreviews.forEach(preview => {
      formData.append('images[]', preview.file);
    });

    // Vidéo (une seule URL)
    if (this.videosUrlsCreate.length > 0 && this.videosUrlsCreate.at(0).value) {
      formData.append('video', this.videosUrlsCreate.at(0).value);
    }

    this.produitService.createProduit(formData).subscribe({
      next: () => {
        this.successMessage = 'Produit créé avec succès.';
        this.closeCreateModal();
        this.loadProduits();
      },
      error: (err) => {
        if (err.status === 422 && err.error.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = 'Erreur lors de la création.';
        }
        console.error(err);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD Édition
  // ──────────────────────────────────────────────────────────────────────────

  openEditModal(produit: ProduitSport): void {
    this.selectedProduit = produit;
    this.showEditModal = true;
    this.existingMediaToDelete = [];
    this.existingMedias = [];
    this.editForm.patchValue({
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      prixPromo: produit.prixPromo,
      stock: produit.stock,
      enPromotion: produit.enPromotion,
      type_categorie_id: produit.type_categorie_id
    });
    this.loadExistingMedias(produit.id);
    this.editImagePreviews = [];
    this.videosUrlsEdit.clear();
    this.videosTitresEdit.clear();
  }

  loadExistingMedias(produitId: number): void {
    this.produitService.getMedias(produitId).subscribe({
      next: (data: MediasResponse) => {
        this.existingMedias = data.medias.map(m => ({
          ...m,
          id: m.path || m.url,
          titre: '',
          est_principal: false
        }));
      },
      error: (err) => console.error('Erreur chargement médias', err)
    });
  }

  onCheckboxChange(event: Event, path: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.existingMediaToDelete.push(path);
    else this.existingMediaToDelete = this.existingMediaToDelete.filter(p => p !== path);
  }

  setPrincipal(mediaId: string): void { } // non implémenté

  onUpdateSubmit(): void {
    if (this.editForm.invalid || !this.selectedProduit) return;

    const formData = new FormData();
    formData.append('nom', this.editForm.value.nom);
    if (this.editForm.value.description) {
      formData.append('description', this.editForm.value.description);
    }
    formData.append('prix', this.editForm.value.prix);
    if (this.editForm.value.prixPromo) {
      formData.append('prixPromo', this.editForm.value.prixPromo);
    }
    formData.append('stock', this.editForm.value.stock);
    formData.append('enPromotion', this.editForm.value.enPromotion ? '1' : '0');

    // ✅ Envoyer type_categorie_id seulement s'il a une valeur
    const typeCategorieId = this.editForm.value.type_categorie_id;
    if (typeCategorieId != null) {
      formData.append('type_categorie_id', typeCategorieId);
    }

    // Images à supprimer
    this.existingMediaToDelete.forEach(path => {
      formData.append('images_a_supprimer[]', path);
    });

    // Nouvelles images
    this.editImagePreviews.forEach(preview => {
      formData.append('images[]', preview.file);
    });

    // Nouvelle vidéo (une seule)
    if (this.videosUrlsEdit.length > 0 && this.videosUrlsEdit.at(0).value) {
      formData.append('video', this.videosUrlsEdit.at(0).value);
    }

    this.produitService.updateProduit(this.selectedProduit.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Produit mis à jour.';
        this.closeEditModal();
        this.loadProduits();
      },
      error: (err) => {
        if (err.status === 422 && err.error.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = 'Erreur lors de la mise à jour.';
        }
        console.error(err);
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProduit = null;
    this.existingMedias = [];
    this.existingMediaToDelete = [];
    this.editImagePreviews = [];
    this.videosUrlsEdit.clear();
    this.videosTitresEdit.clear();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CRUD Suppression
  // ──────────────────────────────────────────────────────────────────────────

  openDeleteModal(produit: ProduitSport): void {
    this.produitToDelete = produit;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.produitToDelete = null;
  }

  confirmDelete(): void {
    if (!this.produitToDelete) return;
    this.produitService.deleteProduit(this.produitToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'Produit supprimé.';
        this.closeDeleteModal();
        this.loadProduits();
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la suppression.';
        console.error(err);
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Galerie
  // ──────────────────────────────────────────────────────────────────────────

  openGalleryModal(produitId: number, nom: string): void {
    this.galleryProduitNom = nom;
    this.showGalleryModal = true;
    this.currentMediaIndex = 0;
    this.produitService.getMedias(produitId).subscribe({
      next: (data: MediasResponse) => {
        this.galleryMedias = data.medias.map(m => ({
          type: m.type,
          url: m.url,
          thumbnail: m.type === 'video' ? this.produitService.getYouTubeThumbnail(m.url) || undefined : m.url,
          titre: ''
        }));
        if (this.galleryMedias.length > 0) this.selectGalleryMedia(0);
      },
      error: (err) => {
        console.error(err);
        this.closeGalleryModal();
      }
    });
  }

  selectGalleryMedia(index: number): void {
    const media = this.galleryMedias[index];
    if (!media) return;
    this.currentMediaIndex = index;
    this.currentMediaType = media.type;
    if (media.type === 'image') {
      this.currentMediaUrl = media.url;
    } else {
      const embedUrl = this.produitService.getEmbedUrl(media.url);
      this.currentMediaUrl = embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : media.url;
    }
  }

  galleryNav(direction: number): void {
    const newIndex = this.currentMediaIndex + direction;
    if (newIndex >= 0 && newIndex < this.galleryMedias.length) this.selectGalleryMedia(newIndex);
  }

  closeGalleryModal(): void {
    this.showGalleryModal = false;
    this.galleryMedias = [];
    this.currentMediaUrl = null;
  }

  getThumbnail(media: GalleryMedia): string {
    return media.thumbnail || 'assets/images/video-placeholder.jpg';
  }
}