import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AdminStats, DiscountCode, GenerateDiscountCodeResult, LocalCartItem, Order, Product } from "./models";

@Injectable({ providedIn: "root" })
export class StoreApiService {
  constructor(private readonly http: HttpClient) {}

  getProducts(): Observable<{ products: Product[] }> {
    return this.http.get<{ products: Product[] }>("/api/products");
  }

  checkout(
    items: LocalCartItem[],
    discountCode?: string
  ): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>("/api/checkout", {
      items,
      discountCode
    });
  }

  getAvailableDiscountCodes(): Observable<{ discountCodes: DiscountCode[] }> {
    return this.http.get<{ discountCodes: DiscountCode[] }>("/api/discount-codes/available");
  }

  generateDiscountCode(): Observable<GenerateDiscountCodeResult> {
    return this.http.post<GenerateDiscountCodeResult>("/api/admin/discount-codes/generate", {});
  }

  getStats(): Observable<{ stats: AdminStats }> {
    return this.http.get<{ stats: AdminStats }>("/api/admin/stats");
  }
}
