import { randomUUID } from "node:crypto";
import { AppError } from "../errors.js";
import {
  AdminStats,
  Cart,
  CartItem,
  CartLine,
  DiscountCode,
  GenerateDiscountCodeResult,
  Order,
  Product,
  StoreConfig
} from "../domain/types.js";
import { roundMoney } from "../utils/money.js";

const DEFAULT_PRODUCTS: Product[] = [
  { id: "coffee-mug", name: "Ceramic Coffee Mug", price: 499 },
  { id: "desk-lamp", name: "Minimal Desk Lamp", price: 1499 },
  { id: "notebook", name: "Hardcover Notebook", price: 249 },
  { id: "canvas-tote", name: "Canvas Tote Bag", price: 699 }
];

export class StoreService {
  private readonly products = new Map<string, Product>();
  private readonly cartItems: CartItem[] = [];
  private readonly orders: Order[] = [];
  private readonly discountCodes = new Map<string, DiscountCode>();

  constructor(
    products: Product[] = DEFAULT_PRODUCTS,
    private readonly config: StoreConfig = {
      nthOrderForDiscount: 3,
      discountPercentage: 10
    }
  ) {
    if (config.nthOrderForDiscount <= 0) {
      throw new Error("nthOrderForDiscount must be greater than zero");
    }

    for (const product of products) {
      this.products.set(product.id, product);
    }
  }

  listProducts(): Product[] {
    return Array.from(this.products.values());
  }

  addItemToCart(productId: string, quantity: number): Cart {
    this.assertValidCartItem({ productId, quantity });

    const existing = this.cartItems.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cartItems.push({ productId, quantity });
    }

    return this.getCart();
  }

  getCart(): Cart {
    return this.buildCart(this.cartItems);
  }

  getAvailableDiscountCodes(): DiscountCode[] {
    return Array.from(this.discountCodes.values()).filter((code) => code.active && !code.used);
  }

  checkout(items: CartItem[], discountCode?: string): Order {
    const cart = this.buildCart(items);

    if (cart.items.length === 0) {
      throw new AppError(400, "Cart is empty");
    }

    const normalizedCode = discountCode?.trim().toUpperCase();
    const code = normalizedCode ? this.getValidDiscountCode(normalizedCode) : undefined;
    const discountAmount = code ? roundMoney(cart.subtotal * (code.percentage / 100)) : 0;
    const total = roundMoney(cart.subtotal - discountAmount);
    const now = new Date().toISOString();

    if (code) {
      code.used = true;
      code.active = false;
      code.usedAt = now;
    }

    const order: Order = {
      id: randomUUID(),
      items: cart.items,
      subtotal: cart.subtotal,
      discountCode: code?.code,
      discountAmount,
      total,
      createdAt: now
    };

    this.orders.push(order);
    this.cartItems.splice(0, this.cartItems.length);

    return order;
  }

  generateDiscountCode(): GenerateDiscountCodeResult {
    const eligibleOrderCount = this.nextUngeneratedEligibleOrderCount();

    if (!eligibleOrderCount) {
      return {
        generated: false,
        message: `No discount code is available yet. Complete ${this.ordersUntilNextDiscount()} more order(s) to unlock the next code.`
      };
    }

    const existing = Array.from(this.discountCodes.values()).find(
      (code) => code.generatedForOrderCount === eligibleOrderCount
    );

    if (existing) {
      return {
        generated: false,
        message: `A discount code was already generated for order ${eligibleOrderCount}.`,
        discountCode: existing
      };
    }

    const code: DiscountCode = {
      code: this.buildCouponCode(eligibleOrderCount),
      percentage: this.config.discountPercentage,
      active: true,
      used: false,
      generatedForOrderCount: eligibleOrderCount,
      createdAt: new Date().toISOString()
    };

    this.discountCodes.set(code.code, code);

    return {
      generated: true,
      message: `Generated a ${code.percentage}% discount code.`,
      discountCode: code
    };
  }

  getStats(): AdminStats {
    const grossRevenue = roundMoney(this.orders.reduce((sum, order) => sum + order.subtotal, 0));
    const totalDiscountGiven = roundMoney(
      this.orders.reduce((sum, order) => sum + order.discountAmount, 0)
    );

    return {
      totalItemsPurchased: this.orders.reduce(
        (sum, order) => sum + order.items.reduce((lineSum, item) => lineSum + item.quantity, 0),
        0
      ),
      grossRevenue,
      netRevenue: roundMoney(grossRevenue - totalDiscountGiven),
      totalDiscountGiven,
      completedOrderCount: this.orders.length,
      discountCodes: Array.from(this.discountCodes.values())
    };
  }

  private buildCart(rawItems: CartItem[]): Cart {
    const mergedItems = this.mergeCartItems(rawItems);
    const items = mergedItems.map((item) => this.toCartLine(item));
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));

    return { items, subtotal };
  }

  private mergeCartItems(items: CartItem[]): CartItem[] {
    const merged = new Map<string, CartItem>();

    for (const item of items) {
      this.assertValidCartItem(item);
      const existing = merged.get(item.productId);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.set(item.productId, { ...item });
      }
    }

    return Array.from(merged.values());
  }

  private assertValidCartItem(item: CartItem): void {
    if (!this.products.has(item.productId)) {
      throw new AppError(404, "Product not found");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new AppError(400, "Quantity must be a positive whole number");
    }
  }

  private toCartLine(item: CartItem): CartLine {
    const product = this.products.get(item.productId);

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    return {
      product,
      quantity: item.quantity,
      lineTotal: roundMoney(product.price * item.quantity)
    };
  }

  private getValidDiscountCode(discountCode: string): DiscountCode {
    const code = this.discountCodes.get(discountCode);

    if (!code || !code.active || code.used) {
      throw new AppError(400, "Discount code is invalid or already used");
    }

    return code;
  }

  private buildCouponCode(orderCount: number): string {
    return `BAZAAR-${orderCount}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private nextUngeneratedEligibleOrderCount(): number | undefined {
    for (
      let orderCount = this.config.nthOrderForDiscount;
      orderCount <= this.orders.length;
      orderCount += this.config.nthOrderForDiscount
    ) {
      const alreadyGenerated = Array.from(this.discountCodes.values()).some(
        (code) => code.generatedForOrderCount === orderCount
      );

      if (!alreadyGenerated) {
        return orderCount;
      }
    }

    return undefined;
  }

  private ordersUntilNextDiscount(): number {
    const generatedMilestones = new Set(
      Array.from(this.discountCodes.values()).map((code) => code.generatedForOrderCount)
    );

    let nextMilestone = this.config.nthOrderForDiscount;

    while (generatedMilestones.has(nextMilestone)) {
      nextMilestone += this.config.nthOrderForDiscount;
    }

    return Math.max(nextMilestone - this.orders.length, 0);
  }
}
