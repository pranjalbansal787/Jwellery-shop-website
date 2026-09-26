/**
 * Domain types. These mirror the Laravel API resources described in docs/ARCHITECTURE.md
 * so the storefront can move from the demo repository to the real API without UI changes.
 */
import type { DesignKey, GemKey, GemShape, MetalKey } from "./jewels/builders";

export type { DesignKey, GemKey, GemShape, MetalKey };

export type Purity = "14K" | "18K" | "22K" | "PT950";
export type StockStatus = "in_stock" | "low_stock" | "made_to_order" | "preorder" | "out_of_stock" | "discontinued";
export type Badge = "NEW" | "EXCLUSIVE" | "LIMITED" | "BESTSELLER" | "MADE TO ORDER";
export type Visibility = "draft" | "scheduled" | "published" | "archived";
export type Gender = "women" | "men" | "unisex";
export type Occasion = "engagement" | "wedding" | "anniversary" | "festive" | "everyday" | "gifting" | "birthday";

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  position: number;
  published: boolean;
  description: string;
  heroDesign: DesignKey;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  kicker: string;
  description: string;
  published: boolean;
  position: number;
  heroImage: string;
  productIds: string[];
}

export interface DiamondSpec {
  totalCarat: number;
  shape: GemShape;
  colour: string;
  clarity: string;
  cut: string;
  certificate: "GIA" | "IGI" | "SGL" | "HRD";
  certificateNo: string;
}

export interface Variant {
  id: string;
  sku: string;
  metal: MetalKey;
  purity: Purity;
  gem: GemKey;
  price: number;
  compareAt?: number;
  stock: number;
  weightGrams: number;
  leadDays: number;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  subtitle: string;
  description: string;
  story: string;
  categoryId: string;
  collectionIds: string[];
  gender: Gender;
  occasions: Occasion[];
  design: DesignKey;
  defaultMetal: MetalKey;
  defaultGem: GemKey;
  shape: GemShape;
  gemSize: number;
  metals: MetalKey[];
  purities: Purity[];
  gems: GemKey[];
  sizes: string[] | null; // Indian ring sizes, or null if not sized
  engravable: boolean;
  variants: Variant[];
  diamond: DiamondSpec | null;
  gemstoneNote: string | null;
  badges: Badge[];
  status: StockStatus;
  visibility: Visibility;
  hallmark: string;
  rating: { average: number; count: number } | null;
  createdAt: string;
  /** Media set to use when different from slug (e.g. a draft borrowing a template's renders). */
  mediaSlug?: string;
  isDemo: true;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: { days: string; time: string }[];
  lat: number;
  lng: number;
  services: string[];
  image: string;
}

export type OrderStatus =
  | "placed" | "payment_confirmed" | "quality_check" | "packaged" | "dispatched" | "out_for_delivery" | "delivered"
  | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "authorised" | "captured" | "failed" | "refunded";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  metal: MetalKey;
  purity: Purity;
  gem: GemKey;
  size?: string;
  engraving?: string;
  qty: number;
  unitPrice: number;
  image: string;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface OrderEvent {
  status: OrderStatus | string;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  number: string;
  customerId: string | null;
  email: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: Address;
  gift: { wrap: boolean; message?: string } | null;
  timeline: OrderEvent[];
  madeToOrder: boolean;
  notes: string[];
  createdAt: string;
  isDemo: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  segment: ("VIP" | "Repeat Buyer" | "High Intent" | "Bridal" | "Dormant" | "Appointment Lead")[];
  preferredStoreId: string | null;
  ringSize: string | null;
  marketingConsent: boolean;
  createdAt: string;
}

export type AppointmentService = "store" | "video" | "stylist" | "bridal" | "custom";
export interface Appointment {
  id: string;
  service: AppointmentService;
  storeId: string | null;
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  productId?: string;
  status: "requested" | "confirmed" | "completed" | "no_show" | "cancelled";
  createdAt: string;
}

export interface Enquiry {
  id: string;
  channel: "whatsapp" | "web" | "phone";
  name: string;
  phone: string;
  subject: string;
  message: string;
  productId?: string;
  status: "open" | "assigned" | "resolved";
  assignee?: string;
  unread: number;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  before?: unknown;
  after?: unknown;
  ip: string;
  userAgent: string;
  at: string;
}
