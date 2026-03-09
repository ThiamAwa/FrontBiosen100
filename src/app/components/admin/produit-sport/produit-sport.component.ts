import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { ProduitSport, ProduitMedia, Categorie, ProduitSportResponse } from '../../../models/produit-sport';

@Component({
  selector: 'app-produit-sport',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './produit-sport.component.html',
  styleUrls: ['./produit-sport.component.css']
})
export class ProduitSportComponent implements OnInit {
  // Données
  produits: ProduitSport[] = [];
  categories: Categorie[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // État
  loading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  // Modales (booléens)
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showGalleryModal = false;
  showImageModal = false;

  // Formulaires
  createForm: FormGroup;
  editForm: FormGroup;
  selectedProduit: ProduitSport | null = null;
  produitToDelete: ProduitSport | null = null;

  // Gestion des fichiers
  createImagePreviews: { file: File; url: string }[] = [];
  editImagePreviews: { file: File; url: string }[] = [];
  existingMediaToDelete: number[] = [];

  // Galerie
  galleryMedias: ProduitMedia[] = [];
  galleryProduitNom = '';
  currentMediaIndex = 0;
  currentMediaUrl: SafeResourceUrl | string | null = null;
  currentMediaType: 'image' | 'video' | null = null;

  constructor(
    public produitService: ProduitSportService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.createForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      prix: [0, [Validators.required, Validators.min(0)]],
      prixPromo: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
      categorie_id: [null],
      enPromotion: [false],
      videos_urls: this.fb.array([]),
      videos_titres: this.fb.array([])
    });

    this.editForm = this.fb.group({
      id: [null],
      nom: ['', Validators.required],
      description: [''],
      prix: [0, [Validators.required, Validators.min(0)]],
      prixPromo: [null],
      stock: [0, [Validators.required, Validators.min(0)]],
      categorie_id: [null],
      enPromotion: [false],
      medias_a_supprimer: [[]],
      media_principal_id: [null],
      videos_urls: this.fb.array([]),
      videos_titres: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProduits();
  }

  // -------------------- Chargement des données --------------------
  loadCategories(): void {
    this.produitService.getCategories().subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => console.error('Erreur chargement catégories', err)
    });
  }

  loadProduits(page: number = this.currentPage): void {
    this.loading = true;
    this.produitService.getProduits(page).subscribe({
      next: (res: ProduitSportResponse) => {
        this.produits = res.produits.data;
        this.currentPage = res.produits.current_page;
        this.lastPage = res.produits.last_page;
        this.total = res.produits.total;
        this.firstItem = (this.currentPage - 1) * res.produits.per_page + 1;
        this.lastItem = Math.min(this.currentPage * res.produits.per_page, this.total);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits', err);
        this.errorMessage = 'Impossible de charger les produits.';
        this.loading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadProduits(page);
    }
  }

  // -------------------- Gestion des modales --------------------
  openCreateModal(): void {
    this.createForm.reset({
      nom: '',
      description: '',
      prix: 0,
      prixPromo: null,
      stock: 0,
      categorie_id: null,
      enPromotion: false
    });
    this.clearVideosArray(this.createForm);
    this.createImagePreviews = [];
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openEditModal(produit: ProduitSport): void {
    this.selectedProduit = produit;
    this.editForm.patchValue({
      id: produit.id,
      nom: produit.nom,
      description: produit.description,
      prix: produit.prix,
      prixPromo: produit.prixPromo,
      stock: produit.stock,
      categorie_id: produit.categorie_id,
      enPromotion: produit.enPromotion,
      medias_a_supprimer: [],
      media_principal_id: produit.medias?.find(m => m.est_principal)?.id || null
    });

    this.clearVideosArray(this.editForm);
    if (produit.medias) {
      produit.medias.filter(m => m.type === 'video_url').forEach(video => {
        this.addVideoUrlToForm(this.editForm, video.url_externe || '', video.titre || '');
      });
    }

    this.editImagePreviews = [];
    this.existingMediaToDelete = [];
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProduit = null;
  }

  openDeleteModal(produit: ProduitSport): void {
    this.produitToDelete = produit;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.produitToDelete = null;
  }

  openGalleryModal(produitId: number, produitNom: string): void {
    this.produitService.getMedias(produitId).subscribe({
      next: (data) => {
        this.galleryProduitNom = data.produit.nom;
        this.galleryMedias = data.medias;
        this.currentMediaIndex = 0;
        this.updateCurrentMedia();
        this.showGalleryModal = true;
      },
      error: (err) => console.error('Erreur chargement médias', err)
    });
  }

  closeGalleryModal(): void {
    this.showGalleryModal = false;
    this.galleryMedias = [];
  }

  openImageModal(imageUrl: string, title: string): void {
    this.currentMediaUrl = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.currentMediaUrl = null;
  }

  // -------------------- Gestion des tableaux de vidéos --------------------
  get videosUrlsCreate(): FormArray {
    return this.createForm.get('videos_urls') as FormArray;
  }
  get videosTitresCreate(): FormArray {
    return this.createForm.get('videos_titres') as FormArray;
  }
  get videosUrlsEdit(): FormArray {
    return this.editForm.get('videos_urls') as FormArray;
  }
  get videosTitresEdit(): FormArray {
    return this.editForm.get('videos_titres') as FormArray;
  }

  private clearVideosArray(form: FormGroup): void {
    (form.get('videos_urls') as FormArray).clear();
    (form.get('videos_titres') as FormArray).clear();
  }

  addVideoUrlToForm(form: FormGroup, url: string = '', titre: string = ''): void {
    (form.get('videos_urls') as FormArray).push(this.fb.control(url));
    (form.get('videos_titres') as FormArray).push(this.fb.control(titre));
  }

  addVideoRow(form: FormGroup): void {
    this.addVideoUrlToForm(form);
  }

  removeVideoRow(form: FormGroup, index: number): void {
    (form.get('videos_urls') as FormArray).removeAt(index);
    (form.get('videos_titres') as FormArray).removeAt(index);
  }

  // -------------------- Création d'un produit --------------------
  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formData = this.buildFormData(this.createForm, this.createImagePreviews);
    this.produitService.createProduit(formData).subscribe({
      next: () => {
        this.successMessage = 'Produit créé avec succès.';
        this.closeCreateModal();
        this.loadProduits(this.currentPage);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  // -------------------- Mise à jour d'un produit --------------------
  onUpdateSubmit(): void {
    if (this.editForm.invalid || !this.selectedProduit) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formData = this.buildFormData(this.editForm, this.editImagePreviews);
    this.existingMediaToDelete.forEach(id => formData.append('medias_a_supprimer[]', id.toString()));

    this.produitService.updateProduit(this.selectedProduit.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Produit mis à jour avec succès.';
        this.closeEditModal();
        this.loadProduits(this.currentPage);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  // -------------------- Suppression d'un produit --------------------
  confirmDelete(): void {
    if (!this.produitToDelete) return;
    this.produitService.deleteProduit(this.produitToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Produit supprimé.';
        this.closeDeleteModal();
        this.loadProduits(this.currentPage);
        this.produitToDelete = null;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // -------------------- Construction FormData --------------------
  private buildFormData(form: FormGroup, imagePreviews: { file: File }[]): FormData {
    const formData = new FormData();
    formData.append('nom', form.get('nom')?.value);
    formData.append('description', form.get('description')?.value || '');
    formData.append('prix', form.get('prix')?.value);
    if (form.get('prixPromo')?.value) formData.append('prixPromo', form.get('prixPromo')?.value);
    formData.append('stock', form.get('stock')?.value);
    if (form.get('categorie_id')?.value) formData.append('categorie_id', form.get('categorie_id')?.value);
    formData.append('enPromotion', form.get('enPromotion')?.value ? '1' : '0');

    imagePreviews.forEach(item => {
      formData.append('images[]', item.file);
    });

    const urls = form.get('videos_urls') as FormArray;
    const titres = form.get('videos_titres') as FormArray;
    urls.controls.forEach((ctrl, index) => {
      if (ctrl.value) {
        formData.append('videos_urls[]', ctrl.value);
        formData.append('videos_titres[]', titres.at(index)?.value || '');
      }
    });

    return formData;
  }

  // -------------------- Gestion des erreurs --------------------
  private handleError(err: any): void {
    if (err.status === 422 && err.error?.errors) {
      this.validationErrors = Object.values(err.error.errors).flat() as string[];
    } else {
      this.errorMessage = err.error?.message || 'Une erreur est survenue.';
    }
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
    this.validationErrors = [];
  }

  // -------------------- Prévisualisation des images --------------------
  onFileChange(event: any, type: 'create' | 'edit'): void {
    const files = event.target.files;
    if (!files) return;

    const previews = type === 'create' ? this.createImagePreviews : this.editImagePreviews;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        previews.push({ file, url: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  removePreview(index: number, type: 'create' | 'edit'): void {
    if (type === 'create') {
      this.createImagePreviews.splice(index, 1);
    } else {
      this.editImagePreviews.splice(index, 1);
    }
  }

  // -------------------- Gestion des médias existants dans edit --------------------
  onCheckboxChange(event: any, mediaId: number): void {
    if (event.target.checked) {
      this.existingMediaToDelete.push(mediaId);
    } else {
      this.existingMediaToDelete = this.existingMediaToDelete.filter(id => id !== mediaId);
    }
    this.editForm.patchValue({ medias_a_supprimer: this.existingMediaToDelete });
  }

  setPrincipal(mediaId: number): void {
    this.editForm.patchValue({ media_principal_id: mediaId });
  }

  // -------------------- Galerie --------------------
  updateCurrentMedia(): void {
    const media = this.galleryMedias[this.currentMediaIndex];
    if (!media) return;

    if (media.type === 'image') {
      this.currentMediaType = 'image';
      this.currentMediaUrl = media.url || null;
    } else if (media.type === 'video_url') {
      this.currentMediaType = 'video';
      this.currentMediaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(media.embed_url || '');
    }
  }

  galleryNav(direction: number): void {
    const newIndex = this.currentMediaIndex + direction;
    if (newIndex >= 0 && newIndex < this.galleryMedias.length) {
      this.currentMediaIndex = newIndex;
      this.updateCurrentMedia();
    }
  }

  selectGalleryMedia(index: number): void {
    this.currentMediaIndex = index;
    this.updateCurrentMedia();
  }

  getThumbnail(media: ProduitMedia): string {
    if (media.type === 'image') return media.url || 'assets/images/placeholder.jpg';
    if (media.type === 'video_url') return media.youtube_thumbnail || 'assets/images/video-placeholder.jpg';
    return 'assets/images/placeholder.jpg';
  }

  // -------------------- Helpers pour l'affichage --------------------
  getMediaPrincipal(produit: ProduitSport): ProduitMedia | undefined {
    return produit.medias?.find(m => m.est_principal) ||
      produit.medias?.find(m => m.type === 'image') ||
      produit.medias?.[0];
  }

  getMediaCount(produit: ProduitSport): number {
    return produit.medias?.length || 0;
  }
}