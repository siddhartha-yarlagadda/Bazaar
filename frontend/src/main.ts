import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { importProvidersFrom } from "@angular/core";
import { provideRouter, Routes } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { AdminComponent } from "./app/admin.component";
import { CheckoutComponent } from "./app/checkout.component";
import { StorefrontComponent } from "./app/storefront.component";

const routes: Routes = [
  { path: "", component: StorefrontComponent },
  { path: "checkout", component: CheckoutComponent },
  { path: "admin", component: AdminComponent },
  { path: "**", redirectTo: "" }
];

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes), importProvidersFrom(FormsModule)]
}).catch((error) => console.error(error));
