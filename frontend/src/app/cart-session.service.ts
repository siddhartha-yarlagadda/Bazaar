import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { LocalCartItem, Product } from "./models";

const cartKey = "bazaar.cart";

@Injectable({ providedIn: "root" })
export class CartSessionService {
  private readonly itemsSubject = new BehaviorSubject<LocalCartItem[]>(this.readCart());
  readonly items$ = this.itemsSubject.asObservable();

  get items(): LocalCartItem[] {
    return this.itemsSubject.value;
  }

  addProduct(product: Product): void {
    const items = [...this.items];
    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ productId: product.id, quantity: 1 });
    }

    this.saveCart(items);
  }

  removeProduct(productId: string): void {
    this.saveCart(this.items.filter((item) => item.productId !== productId));
  }

  clearCart(): void {
    this.saveCart([]);
  }

  private readCart(): LocalCartItem[] {
    const raw = sessionStorage.getItem(cartKey);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as LocalCartItem[];

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveCart(items: LocalCartItem[]): void {
    sessionStorage.setItem(cartKey, JSON.stringify(items));
    this.itemsSubject.next(items);
  }
}
