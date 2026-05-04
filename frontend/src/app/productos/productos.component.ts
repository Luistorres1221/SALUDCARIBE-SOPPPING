import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { runtimeConfig } from '../services/runtime-config';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatGridListModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-center mb-8">Productos</h1>

      <div *ngIf="loading" class="text-center">Cargando productos...</div>
      <div *ngIf="!loading && error" class="text-center text-red-600">{{ error }}</div>

      <mat-grid-list *ngIf="!loading && !error" cols="4" rowHeight="400px" class="grid-container">
        <mat-grid-tile *ngFor="let product of products">
          <mat-card class="product-card">
            <mat-card-header>
              <mat-card-title>{{ product.name }}</mat-card-title>
              <mat-card-subtitle>{{ product.category }}</mat-card-subtitle>
            </mat-card-header>
            <img *ngIf="product.image" mat-card-image [src]="product.image" [alt]="product.name" class="product-image">
            <mat-card-content>
              <p>{{ product.description }}</p>
              <p class="price">{{ product.price | currency:'COP':'symbol':'1.0-0' }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="addToCart(product)">
                Agregar al Carrito
              </button>
            </mat-card-actions>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  styles: [`
    .grid-container {
      margin: 20px;
    }
    .product-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .product-image {
      height: 150px;
      object-fit: cover;
    }
    .price {
      font-size: 1.2em;
      font-weight: bold;
      color: #2563eb;
    }
  `]
})
export class ProductosComponent implements OnInit {
  private http = inject(HttpClient);
  private cartService = inject(CartService);

  products: Product[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<Product[]>(runtimeConfig.apiBaseUrl + '/products')
      .subscribe({
        next: (data) => {
          this.products = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar productos';
          this.loading = false;
          console.error('Error loading products:', err);
        }
      });
  }

  addToCart(product: Product) {
    this.cartService.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  }
}