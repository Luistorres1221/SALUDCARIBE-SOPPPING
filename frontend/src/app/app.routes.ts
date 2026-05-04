import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/productos', pathMatch: 'full' },
  { path: 'productos', loadComponent: () => import('./productos/productos.component').then(m => m.ProductosComponent) },
  { path: 'carrito', loadComponent: () => import('./carrito/carrito.component').then(m => m.CarritoComponent) },
  { path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) },
  { path: 'pedidos/:orderId', loadComponent: () => import('./pedidos/pedido-detail.component').then(m => m.PedidoDetailComponent) },
  { path: 'pedidos', loadComponent: () => import('./pedidos/pedidos.component').then(m => m.PedidosComponent) },
  { path: '**', redirectTo: '/productos' }
];