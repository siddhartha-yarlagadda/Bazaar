# Bazaar

Full-stack TypeScript ecommerce assignment with a Node backend, Angular frontend, in-memory storage, checkout flow, coupons, admin reporting, and unit tests for the core business rules.

## What is included

- Backend APIs for products, cart management, checkout, available discount codes, discount generation, and admin stats.
- In-memory store only. Restarting the backend resets carts, orders, and discount codes.
- Angular frontend for adding products to a cart, checking out with an optional code, generating eligible discount codes, and viewing admin stats.
- Unit tests for coupon generation, checkout validation, revenue, item counts, and discount totals.
- `DECISIONS.md` with design decisions and trade-offs.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
```

## Run the backend

```bash
npm run dev:backend
```

The API runs on `http://localhost:3000`.

## Run the frontend

In a second terminal:

```bash
npm run dev:frontend
```

The Angular app runs on `http://localhost:4200` and proxies `/api` calls to the backend.

The storefront is available at `/`, checkout is available at `/checkout`, and admin metrics plus discount code generation are available at `/admin`.

## Run tests

```bash
npm test
```

## Build everything

```bash
npm run build
```

## API Summary

### Get Products

```http
GET /api/products
```

### Add Item To Cart

```http
POST /api/cart/items
Content-Type: application/json

{
  "productId": "coffee-mug",
  "quantity": 2
}
```

### Get Cart

```http
GET /api/cart
```

The Angular UI keeps the shopper's cart in browser session storage until checkout. The backend also exposes cart APIs for assignment coverage.

### Available Discount Codes

```http
GET /api/discount-codes/available
```

### Checkout

```http
POST /api/checkout
Content-Type: application/json

{
  "items": [
    {
      "productId": "coffee-mug",
      "quantity": 2
    }
  ],
  "discountCode": "BAZAAR-3-ABC123"
}
```

`discountCode` is optional. If provided, it must exist, be active, and be unused.

### Generate Discount Code

```http
POST /api/admin/discount-codes/generate
```

A code is generated only when the total completed order count is a positive multiple of the configured interval. This project uses every 3rd order and a 10% discount. If the condition is not met, the endpoint still returns `200` with `generated: false` and a message explaining how many orders are needed.

### Admin Stats

```http
GET /api/admin/stats
```

Returns total items purchased, gross revenue before discounts, net revenue after discounts, all discount codes, and total discounts given.

## Example Flow

1. Add products to the browser cart.
2. Go to `/checkout` and checkout without a discount code.
3. Repeat until the 3rd successful order.
4. Call `POST /api/admin/discount-codes/generate`.
5. Use the returned code during a later checkout from `/checkout`.

## Notes For Reviewers

The core business logic lives in `backend/src/services/store.service.ts` and is tested without starting an HTTP server. The HTTP layer is intentionally thin so the discount and checkout rules remain easy to inspect during an interview.
