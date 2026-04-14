export type Product = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

export type Cart = {
  items: CartLine[];
  subtotal: number;
};

export type DiscountCode = {
  code: string;
  percentage: number;
  active: boolean;
  used: boolean;
  generatedForOrderCount: number;
  createdAt: string;
  usedAt?: string;
};

export type GenerateDiscountCodeResult = {
  generated: boolean;
  message: string;
  discountCode?: DiscountCode;
};

export type Order = {
  id: string;
  items: CartLine[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  total: number;
  createdAt: string;
};

export type AdminStats = {
  totalItemsPurchased: number;
  grossRevenue: number;
  netRevenue: number;
  totalDiscountGiven: number;
  completedOrderCount: number;
  discountCodes: DiscountCode[];
};

export type StoreConfig = {
  nthOrderForDiscount: number;
  discountPercentage: number;
};
