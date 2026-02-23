import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html'
})
export class LoginModalComponent {
  // authService = inject(AuthService);

  credentials = { email: '', password: '', remember: false };
  errors: string[] = [];
  isLoading = false;

  close() {
    // this.authService.closeLoginModal();
  }

  async login() {
    this.isLoading = true;
    this.errors = [];
    try {
      // await this.authService.login(this.credentials);
      this.close();
    } catch (err: any) {
      this.errors = err.errors || ['Identifiants incorrects'];
    } finally {
      this.isLoading = false;
    }
  }
}