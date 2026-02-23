import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css'
})
export class LoginModalComponent {
  authService = inject(AuthService);
  credentials = { email: '', password: '', remember: false };
  errors: string[] = [];
  isLoading = false;

  close(): void {
    // this.authService.closeLoginModal();
    this.errors = [];
  }

  // login(): void {
  //   this.isLoading = true;
  //   this.errors = [];
  //   this.authService.login(this.credentials).subscribe({
  //     next: (res: any) => {
  //       this.authService.currentUser.set(res.user);
  //       this.isLoading = false;
  //       this.close();
  //     },
  //     error: (err) => {
  //       this.isLoading = false;
  //       if (err.error?.errors) {
  //         this.errors = Object.values(err.error.errors).flat() as string[];
  //       } else if (err.error?.message) {
  //         this.errors = [err.error.message];
  //       } else {
  //         this.errors = ['Email ou mot de passe incorrect.'];
  //       }
  //     }
  //   });
  // }
}