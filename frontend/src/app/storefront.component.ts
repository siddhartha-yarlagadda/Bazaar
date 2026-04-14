import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CartSessionService } from "./cart-session.service";
import { LocalCartItem, Product } from "./models";
import { formatMoney } from "./money";
import { StoreApiService } from "./store-api.service";

const productImages: Record<string, string> = {
  "coffee-mug": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80",
  "desk-lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
  notebook: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=600&q=80",
  "canvas-tote": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80"
};

@Component({
  selector: "app-storefront",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./storefront.component.html"
})
export class StorefrontComponent implements OnInit {
  products: Product[] = [];
  cartItems: LocalCartItem[] = [];
  message = "";
  error = "";
  readonly formatMoney = formatMoney;

  constructor(
    private readonly api: StoreApiService,
    private readonly cartSession: CartSessionService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.cartSession.items$.subscribe((items) => (this.cartItems = items));
  }

  productImage(productId: string): string {
    return productImages[productId] ?? productImages["coffee-mug"];
  }

  addToCart(product: Product): void {
    this.clearNotice();
    this.cartSession.addProduct(product);
    this.message = `${product.name} added to cart.`;
  }

  removeFromCart(productId: string): void {
    this.cartSession.removeProduct(productId);
  }

  cartQuantity(productId: string): number {
    return this.cartItems.find((item) => item.productId === productId)?.quantity ?? 0;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => {
      const product = this.products.find((entry) => entry.id === item.productId);

      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);
  }

  cartProduct(productId: string): Product | undefined {
    return this.products.find((product) => product.id === productId);
  }

  private loadProducts(): void {
    this.api.getProducts().subscribe({
      next: ({ products }) => (this.products = products),
      error: () => {
        this.error = "Unable to load products.";
      }
    });
  }

  private clearNotice(): void {
    this.message = "";
    this.error = "";
  }
}
