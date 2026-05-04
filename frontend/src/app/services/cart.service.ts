import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  addToCart(product: Omit<CartItem, 'quantity'>) {
    const currentItems = this.cartItemsSubject.value;
    const existingItem = currentItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentItems.push({ ...product, quantity: 1 });
    }

    this.cartItemsSubject.next([...currentItems]);
    this.saveCartToLocalStorage();
  }

  removeFromCart(productId: string) {
    const currentItems = this.cartItemsSubject.value.filter(item => item.id !== productId);
    this.cartItemsSubject.next(currentItems);
    this.saveCartToLocalStorage();
  }

  updateQuantity(productId: string, quantity: number) {
    const currentItems = this.cartItemsSubject.value;
    const item = currentItems.find(item => item.id === productId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.cartItemsSubject.next([...currentItems]);
        this.saveCartToLocalStorage();
      }
    }
  }

  clearCart() {
    this.cartItemsSubject.next([]);
    localStorage.removeItem('cart');
  }

  getCartItemCount(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartItemsSubject.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  private saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cartItemsSubject.value));
  }

  private loadCartFromLocalStorage() {
    const cart = localStorage.getItem('cart');
    if (cart) {
      this.cartItemsSubject.next(JSON.parse(cart));
    }
  }

  constructor() {
    this.loadCartFromLocalStorage();
  }
}