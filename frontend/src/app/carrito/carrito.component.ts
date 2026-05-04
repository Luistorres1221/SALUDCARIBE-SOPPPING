import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../services/cart.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Carrito de Compras</h1>

      @if (cartItems.length === 0) {
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400">shopping_cart</mat-icon>
          <h2 class="text-xl font-semibold mt-4">Tu carrito está vacío</h2>
          <p class="text-gray-600 mt-2">Agrega algunos productos para comenzar</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            @for (item of cartItems; track item.id) {
              <mat-card class="mb-4">
                <mat-card-content class="flex items-center p-4">
                  @if (item.image) {
                    <img [src]="item.image" [alt]="item.name" class="w-16 h-16 object-cover mr-4">
                  }
                  <div class="flex-1">
                    <h3 class="font-semibold">{{ item.name }}</h3>
                    <p class="text-gray-600">{{ item.price | currency:'COP':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="flex items-center">
                    <button mat-icon-button (click)="updateQuantity(item.id, item.quantity - 1)">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <mat-form-field class="w-16 mx-2">
                      <input matInput type="number" [value]="item.quantity" readonly>
                    </mat-form-field>
                    <button mat-icon-button (click)="updateQuantity(item.id, item.quantity + 1)">
                      <mat-icon>add</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="removeItem(item.id)" class="ml-4">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>

          <div>
            <mat-card>
              <mat-card-header>
                <mat-card-title>Resumen del Pedido</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{{ getSubtotal() | currency:'COP':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Envío:</span>
                    <span>{{ getShippingCost() | currency:'COP':'symbol':'1.0-0' }}</span>
                  </div>
                  <hr class="my-2">
                  <div class="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{{ getTotal() | currency:'COP':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary" class="w-full" (click)="checkout()">
                  Proceder al Pago
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class CarritoComponent implements OnInit {
  private cartService = inject(CartService);

  cartItems: CartItem[] = [];

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  }

  updateQuantity(productId: string, quantity: number) {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  getSubtotal(): number {
    return this.cartService.getTotalPrice();
  }

  getShippingCost(): number {
    return this.getSubtotal() > 100000 ? 0 : 10000; // Envío gratis sobre $100,000 COP
  }

  getTotal(): number {
    return this.getSubtotal() + this.getShippingCost();
  }

  checkout() {
    // Implementar checkout logic
    alert('Funcionalidad de checkout próximamente');
  }
}