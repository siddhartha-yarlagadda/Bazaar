import { IncomingMessage, ServerResponse } from "node:http";
import { AppError } from "../errors.js";
import { StoreService } from "../services/store.service.js";
import { readJsonBody, sendJson } from "./json.js";

type AddCartItemRequest = {
  productId?: string;
  quantity?: number;
};

type CheckoutRequest = {
  items?: Array<{
    productId?: string;
    quantity?: number;
  }>;
  discountCode?: string;
};

export function createRequestHandler(store: StoreService) {
  return async function handleRequest(request: IncomingMessage, response: ServerResponse) {
    try {
      if (request.method === "OPTIONS") {
        sendJson(response, 204, null);
        return;
      }

      const url = new URL(request.url ?? "/", "http://localhost");

      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { status: "ok" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/products") {
        sendJson(response, 200, { products: store.listProducts() });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/cart/items") {
        const body = await readJsonBody<AddCartItemRequest>(request);
        const cart = store.addItemToCart(
          requireString(body.productId, "productId"),
          requireNumber(body.quantity, "quantity")
        );
        sendJson(response, 200, { cart });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/cart") {
        sendJson(response, 200, { cart: store.getCart() });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/discount-codes/available") {
        sendJson(response, 200, { discountCodes: store.getAvailableDiscountCodes() });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/checkout") {
        const body = await readJsonBody<CheckoutRequest>(request);
        const order = store.checkout(
          requireCartItems(body.items),
          body.discountCode
        );
        sendJson(response, 201, { order });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/admin/discount-codes/generate") {
        sendJson(response, 200, store.generateDiscountCode());
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/admin/stats") {
        sendJson(response, 200, { stats: store.getStats() });
        return;
      }

      throw new AppError(404, "Route not found");
    } catch (error) {
      const appError =
        error instanceof AppError ? error : new AppError(500, "Unexpected server error");

      sendJson(response, appError.statusCode, { error: appError.message });
    }
  };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, `${field} is required`);
  }

  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number") {
    throw new AppError(400, `${field} must be a number`);
  }

  return value;
}

function requireCartItems(items: CheckoutRequest["items"]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, "items are required");
  }

  return items.map((item) => ({
    productId: requireString(item.productId, "productId"),
    quantity: requireNumber(item.quantity, "quantity")
  }));
}
