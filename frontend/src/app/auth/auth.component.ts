import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-md">
      <mat-card>
        <mat-card-header>
          <mat-card-title class="text-center">SaludCaribe</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Iniciar Sesión">
              <form (ngSubmit)="signIn()" class="mt-4">
                <mat-form-field class="w-full mb-4">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" [(ngModel)]="signInEmail" name="signInEmail" required>
                </mat-form-field>
                <mat-form-field class="w-full mb-4">
                  <mat-label>Contraseña</mat-label>
                  <input matInput type="password" [(ngModel)]="signInPassword" name="signInPassword" required>
                </mat-form-field>
                @if (signInError) {
                  <p class="text-red-600 mb-4">{{ signInError }}</p>
                }
                <button mat-raised-button color="primary" type="submit" class="w-full" [disabled]="signInLoading">
                  {{ signInLoading ? 'Cargando...' : 'Iniciar Sesión' }}
                </button>
              </form>
            </mat-tab>
            <mat-tab label="Registrarse">
              <form (ngSubmit)="signUp()" class="mt-4">
                <mat-form-field class="w-full mb-4">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" [(ngModel)]="signUpEmail" name="signUpEmail" required>
                </mat-form-field>
                <mat-form-field class="w-full mb-4">
                  <mat-label>Contraseña</mat-label>
                  <input matInput type="password" [(ngModel)]="signUpPassword" name="signUpPassword" required>
                </mat-form-field>
                <mat-form-field class="w-full mb-4">
                  <mat-label>Confirmar Contraseña</mat-label>
                  <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required>
                </mat-form-field>
                @if (signUpError) {
                  <p class="text-red-600 mb-4">{{ signUpError }}</p>
                }
                <button mat-raised-button color="primary" type="submit" class="w-full" [disabled]="signUpLoading">
                  {{ signUpLoading ? 'Cargando...' : 'Registrarse' }}
                </button>
              </form>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: []
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  signInEmail = '';
  signInPassword = '';
  signInError = '';
  signInLoading = false;

  signUpEmail = '';
  signUpPassword = '';
  confirmPassword = '';
  signUpError = '';
  signUpLoading = false;

  async signIn() {
    if (!this.signInEmail || !this.signInPassword) return;

    this.signInLoading = true;
    this.signInError = '';

    try {
      await this.authService.signIn(this.signInEmail, this.signInPassword);
      this.router.navigate(['/productos']);
    } catch (error: any) {
      this.signInError = error.message || 'Error al iniciar sesión';
    } finally {
      this.signInLoading = false;
    }
  }

  async signUp() {
    if (!this.signUpEmail || !this.signUpPassword || !this.confirmPassword) return;
    if (this.signUpPassword !== this.confirmPassword) {
      this.signUpError = 'Las contraseñas no coinciden';
      return;
    }

    this.signUpLoading = true;
    this.signUpError = '';

    try {
      await this.authService.signUp(this.signUpEmail, this.signUpPassword);
      this.router.navigate(['/productos']);
    } catch (error: any) {
      this.signUpError = error.message || 'Error al registrarse';
    } finally {
      this.signUpLoading = false;
    }
  }
}