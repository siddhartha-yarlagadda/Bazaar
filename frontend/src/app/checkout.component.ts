import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { CartSessionService } from "./cart-session.service";
import { DiscountCode, LocalCartItem, Product } from "./models";
import { formatMoney } from "./money";
import { StoreApiService } from "./store-api.service";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./checkout.component.html"
})
export class CheckoutComponent implements OnInit {
  discountCode = "";
  products: Product[] = [];
  cartItems: LocalCartItem[] = [];
  availableDiscountCodes: DiscountCode[] = [];
  message = "";
  error = "";
  readonly formatMoney = formatMoney;

  constructor(
    private readonly api: StoreApiService,
    private readonly cartSession: CartSessionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.cartSession.items$.subscribe((items) => (this.cartItems = items));
    this.loadProducts();
    this.loadDiscountCodes();
  }

  chooseCode(code: string): void {
    this.discountCode = code;
    this.clearNotice();
    this.message = `${code} applied to this checkout.`;
  }

  removeCode(): void {
    this.discountCode = "";
    this.clearNotice();
    this.message = "Discount code removed.";
  }

  placeOrder(): void {
    this.clearNotice();

    if (this.cartItems.length === 0) {
      this.error = "Your cart is empty.";
      return;
    }

    const code = this.discountCode.trim().toUpperCase() || undefined;

    this.api.checkout(this.cartItems, code).subscribe({
      next: () => {
        this.cartSession.clearCart();
        this.router.navigateByUrl("/");
      },
      error: (error: HttpErrorResponse) => this.setError(error)
    });
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => {
      const product = this.cartProduct(item.productId);

      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);
  }

  get appliedCode(): DiscountCode | undefined {
    const normalizedCode = this.discountCode.trim().toUpperCase();

    return this.availableDiscountCodes.find((code) => code.code === normalizedCode);
  }

  get discountAmount(): number {
    return this.appliedCode ? Math.round(this.subtotal * (this.appliedCode.percentage / 100)) : 0;
  }

  get total(): number {
    return this.subtotal - this.discountAmount;
  }

  cartProduct(productId: string): Product | undefined {
    return this.products.find((product) => product.id === productId);
  }

  private loadProducts(): void {
    this.api.getProducts().subscribe({
      next: ({ products }) => (this.products = products),
      error: (error: HttpErrorResponse) => this.setError(error)
    });
  }

  private loadDiscountCodes(): void {
    this.api.getAvailableDiscountCodes().subscribe({
      next: ({ discountCodes }) => (this.availableDiscountCodes = discountCodes),
      error: (error: HttpErrorResponse) => this.setError(error)
    });
  }

  private setError(error: HttpErrorResponse): void {
    this.message = "";
    this.error = error.error?.error ?? "Something went wrong.";
  }

  private clearNotice(): void {
    this.message = "";
    this.error = "";
  }
}
