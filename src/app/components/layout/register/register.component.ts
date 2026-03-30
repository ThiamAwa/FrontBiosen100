import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private http   = inject(HttpClient);
  authService    = inject(AuthService);
  private router = inject(Router);

  isLoading      = false;
  showPassword   = false;
  showConfirm    = false;
  errors: { [key: string]: string[] } = {};

  formData = {
    nom:                   '',
    prenom:                '',
    email:                 '',
    telephone:             '',
    password:              '',
    password_confirmation: '',
  };

  async register() {
    this.isLoading = true;
    this.errors    = {};

    try {
      const response: any = await this.http
        .post(`${environment.apiUrl}/register`, this.formData)
        .toPromise();

      if (response.statut && response.token) {
        const user = {
          ...response.user,
          hasAdminAccess: false,
          isAdmin: false,
        };

        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(user));
        this.authService.currentUser.set(user);

        this.router.navigate(['/']);
      }
    } catch (err: any) {
      if (err.status === 422) {
        this.errors = err.error.errors || {};
      } else {
        this.errors = {
          general: [err.error?.message || 'Une erreur est survenue. Veuillez réessayer.'],
        };
      }
    } finally {
      this.isLoading = false;
    }
  }

  getError(field: string): string {
    return this.errors[field]?.[0] || '';
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  togglePassword()  { this.showPassword = !this.showPassword; }
  toggleConfirm()   { this.showConfirm  = !this.showConfirm; }
}