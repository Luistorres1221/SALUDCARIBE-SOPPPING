import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">
              <a routerLink="/productos" class="hover:text-blue-600">SaludCaribe</a>
            </h1>
          </div>

          <nav class="hidden md:flex space-x-8">
            <a routerLink="/productos" routerLinkActive="text-blue-600" class="text-gray-700 hover:text-blue-600">Productos</a>
            <a routerLink="/carrito" routerLinkActive="text-blue-600" class="text-gray-700 hover:text-blue-600">
              Carrito ({{ cartItemCount }})
            </a>
            <ng-container *ngIf="isAuthenticated">
              <a routerLink="/pedidos" routerLinkActive="text-blue-600" class="text-gray-700 hover:text-blue-600">Mis Pedidos</a>
              <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="text-blue-600" class="text-gray-700 hover:text-blue-600">Admin</a>
            </ng-container>
          </nav>

          <div class="flex items-center space-x-4">
            <ng-container *ngIf="!isAuthenticated; else loggedIn">
              <a routerLink="/auth" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Iniciar Sesión
              </a>
            </ng-container>
            <ng-template #loggedIn>
              <span class="text-gray-700">{{ user?.email }}</span>
              <button (click)="logout()" class="text-gray-700 hover:text-red-600">
                Cerrar Sesión
              </button>
            </ng-template>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];

  isAuthenticated = false;
  user: any = null;
  isAdmin = false;
  cartItemCount = 0;

  ngOnInit() {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
        this.isAuthenticated = !!user;
        this.isAdmin = user?.user_metadata?.role === 'admin';
      })
    );

    this.subscriptions.push(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItemCount = items.reduce((count, item) => count + item.quantity, 0);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}