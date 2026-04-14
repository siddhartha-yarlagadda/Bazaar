import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { AdminStats, DiscountCode } from "./models";
import { formatMoney } from "./money";
import { StoreApiService } from "./store-api.service";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./admin.component.html"
})
export class AdminComponent implements OnInit {
  stats?: AdminStats;
  lastGeneratedCode?: DiscountCode;
  message = "";
  error = "";
  readonly formatMoney = formatMoney;

  constructor(private readonly api: StoreApiService) {}

  ngOnInit(): void {
    this.refreshStats();
  }

  generateDiscountCode(): void {
    this.clearNotice();
    this.api.generateDiscountCode().subscribe({
      next: (result) => {
        this.lastGeneratedCode = result.discountCode;
        this.message = result.discountCode
          ? `${result.message} Code: ${result.discountCode.code}.`
          : result.message;
        this.refreshStats();
      },
      error: (error: HttpErrorResponse) => this.setError(error)
    });
  }

  refreshStats(): void {
    this.api.getStats().subscribe({
      next: ({ stats }) => (this.stats = stats),
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
