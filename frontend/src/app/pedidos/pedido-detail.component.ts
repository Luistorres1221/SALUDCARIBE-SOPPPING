import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pedido-detail',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Detalle del Pedido</h1>

      <mat-card>
        <mat-card-content>
          <p>Detalle del pedido próximamente...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: []
})
export class PedidoDetailComponent {}