import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatTabsModule, MatCardModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Panel de Administración</h1>

      <mat-tab-group>
        <mat-tab label="Productos">
          <mat-card class="mt-4">
            <mat-card-content>
              <p>Gestión de productos próximamente...</p>
            </mat-card-content>
          </mat-card>
        </mat-tab>
        <mat-tab label="Categorías">
          <mat-card class="mt-4">
            <mat-card-content>
              <p>Gestión de categorías próximamente...</p>
            </mat-card-content>
          </mat-card>
        </mat-tab>
        <mat-tab label="Pedidos">
          <mat-card class="mt-4">
            <mat-card-content>
              <p>Gestión de pedidos próximamente...</p>
            </mat-card-content>
          </mat-card>
        </mat-tab>
        <mat-tab label="Usuarios">
          <mat-card class="mt-4">
            <mat-card-content>
              <p>Gestión de usuarios próximamente...</p>
            </mat-card-content>
          </mat-card>
        </mat-tab>
        <mat-tab label="Roles">
          <mat-card class="mt-4">
            <mat-card-content>
              <p>Gestión de roles próximamente...</p>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: []
})
export class AdminComponent {}