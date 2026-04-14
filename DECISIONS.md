# Design Decisions

## Decision: Keep Business Logic Separate From HTTP

**Context:** The assignment asks for working APIs and unit tests for core business logic. Checkout and discount behavior should be easy to test without binding every test to an HTTP server.

**Options Considered:**
- Option A: Put cart and checkout logic directly inside route handlers.
- Option B: Put cart, checkout, discount, and stats rules in a service class used by the HTTP layer.

**Choice:** Option B.

**Why:** Route handlers stay small and focused on parsing requests and returning responses. The service can be unit tested directly, which makes edge cases like invalid coupons and nth-order coupon generation easier to prove.

## Decision: Use In-Memory Maps For State

**Context:** The assignment explicitly allows in-memory storage and does not require a database.

**Options Considered:**
- Option A: Add SQLite or another lightweight database.
- Option B: Store products, carts, orders, and discounts in memory.

**Choice:** Option B.

**Why:** A database would add setup overhead without improving the assignment goal. In-memory maps are enough to demonstrate API design and business rules. The trade-off is that state resets on server restart, which is documented in the README.

## Decision: Generate Coupons From Admin Endpoint Only

**Context:** The prompt says every nth order gets a coupon code, and also says the store has an admin API to generate a discount code if the condition is satisfied.

**Options Considered:**
- Option A: Automatically generate the code during checkout of every nth order.
- Option B: Mark the nth-order milestone as eligible and let the admin endpoint generate the code.

**Choice:** Option B.

**Why:** This follows the requested admin API more directly. The checkout creates the condition, while the admin endpoint enforces whether a code can be generated. The endpoint returns a graceful `generated: false` response when no milestone is available, generates the oldest ungenerated milestone first when multiple milestones are due, and prevents duplicate codes for the same nth-order milestone.

## Decision: Make Discount Codes Single-Use

**Context:** The checkout API must validate whether a discount code is valid before applying it.

**Options Considered:**
- Option A: Allow a generated code to be reused by many customers.
- Option B: Treat each generated code as active until it is successfully used once.

**Choice:** Option B.

**Why:** Single-use codes make validation unambiguous: a valid code exists, is active, and has not already been used. This also prevents one generated reward from discounting unlimited orders.

## Decision: Track Gross And Net Revenue

**Context:** The admin stats API must list revenue and total discounts given. Revenue can be interpreted as before or after discounts.

**Options Considered:**
- Option A: Return only final collected revenue.
- Option B: Return gross revenue, net revenue, and total discounts.

**Choice:** Option B.

**Why:** Returning both values removes ambiguity and gives reviewers a clearer audit trail. `grossRevenue` shows item value before discounts, `totalDiscountGiven` shows discounts applied, and `netRevenue` shows actual collected revenue.

## Decision: Keep The Frontend Thin

**Context:** Backend functionality is required and frontend is a plus. The frontend should demonstrate the APIs without becoming the center of the assignment.

**Options Considered:**
- Option A: Build a complex ecommerce UI with routing and persistent client state.
- Option B: Build a single Angular screen that exercises the main customer and admin workflows.

**Choice:** Option B.

**Why:** A focused UI is easier to review and explain. It shows products, cart, checkout, coupon generation, and stats while leaving the important business rules in the backend.

## Decision: Keep Checkout Anonymous

**Context:** The assignment does not require user accounts, identity, or per-user discounts. Adding an identifier would make the review surface larger without supporting a requirement.

**Options Considered:**
- Option A: Ask shoppers for a mobile number before placing an order.
- Option B: Keep checkout anonymous and record only order/cart/discount details.

**Choice:** Option B.

**Why:** Anonymous checkout keeps the implementation focused on cart, order, and discount rules. It also avoids unnecessary session or identity logic while still allowing the admin metrics to count purchased items, revenue, codes, and total discounts.
