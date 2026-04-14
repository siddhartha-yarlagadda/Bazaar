import assert from "node:assert/strict";
import test from "node:test";
import { StoreService } from "./store.service.js";

const products = [
  { id: "a", name: "Product A", price: 100 },
  { id: "b", name: "Product B", price: 50 }
];

function createStore(): StoreService {
  return new StoreService(products, { nthOrderForDiscount: 3, discountPercentage: 10 });
}

function placeOrder(store: StoreService): void {
  store.checkout([{ productId: "a", quantity: 1 }]);
}

test("adds items to a cart and calculates subtotal", () => {
  const store = createStore();

  const cart = store.addItemToCart("a", 2);

  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0]?.quantity, 2);
  assert.equal(cart.subtotal, 200);
});

test("returns a graceful no-code response before the nth order", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);

  const result = store.generateDiscountCode();

  assert.equal(result.generated, false);
  assert.equal(result.discountCode, undefined);
  assert.match(result.message, /Complete 1 more order/);
});

test("generates one coupon when nth-order condition is satisfied", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);
  placeOrder(store);

  const firstResult = store.generateDiscountCode();
  const secondResult = store.generateDiscountCode();

  assert.equal(firstResult.generated, true);
  assert.equal(firstResult.discountCode?.percentage, 10);
  assert.equal(firstResult.discountCode?.generatedForOrderCount, 3);
  assert.equal(secondResult.generated, false);
  assert.equal(secondResult.discountCode, undefined);
});

test("generates the missed milestone coupon after later orders", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  placeOrder(store);

  const result = store.generateDiscountCode();

  assert.equal(result.generated, true);
  assert.equal(result.discountCode?.generatedForOrderCount, 3);
});

test("generates outstanding milestone coupons in order", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  placeOrder(store);

  const firstResult = store.generateDiscountCode();
  const secondResult = store.generateDiscountCode();
  const thirdResult = store.generateDiscountCode();

  assert.equal(firstResult.generated, true);
  assert.equal(firstResult.discountCode?.generatedForOrderCount, 3);
  assert.equal(secondResult.generated, true);
  assert.equal(secondResult.discountCode?.generatedForOrderCount, 6);
  assert.equal(thirdResult.generated, false);
});

test("applies a valid discount code once during checkout", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  const discount = store.generateDiscountCode().discountCode;

  const order = store.checkout([{ productId: "a", quantity: 1 }], discount?.code);

  assert.equal(order.discountAmount, 10);
  assert.equal(order.total, 90);

  assert.throws(
    () => store.checkout([{ productId: "a", quantity: 1 }], discount?.code),
    Error
  );
});

test("rejects checkout with an invalid discount code", () => {
  const store = createStore();

  assert.throws(
    () => store.checkout([{ productId: "a", quantity: 1 }], "MISSING-CODE"),
    Error
  );
});

test("rejects empty checkout and invalid cart items", () => {
  const store = createStore();

  assert.throws(() => store.checkout([]), /Cart is empty/);
  assert.throws(() => store.checkout([{ productId: "a", quantity: 0 }]), /Quantity/);
  assert.throws(() => store.checkout([{ productId: "missing", quantity: 1 }]), /Product/);
});

test("reports purchased item count, revenue, codes, and discounts", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  const discount = store.generateDiscountCode().discountCode;

  store.checkout(
    [
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 1 }
    ],
    discount?.code
  );

  const stats = store.getStats();

  assert.equal(stats.completedOrderCount, 4);
  assert.equal(stats.totalItemsPurchased, 6);
  assert.equal(stats.grossRevenue, 550);
  assert.equal(stats.totalDiscountGiven, 25);
  assert.equal(stats.netRevenue, 525);
  assert.equal(stats.discountCodes.length, 1);
});

test("lists only available discount codes", () => {
  const store = createStore();

  placeOrder(store);
  placeOrder(store);
  placeOrder(store);
  const discount = store.generateDiscountCode().discountCode;

  assert.equal(store.getAvailableDiscountCodes().length, 1);

  store.checkout([{ productId: "a", quantity: 1 }], discount?.code);

  assert.equal(store.getAvailableDiscountCodes().length, 0);
});
