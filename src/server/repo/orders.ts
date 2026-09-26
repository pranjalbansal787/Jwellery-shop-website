import "server-only";
import { db } from "../db";
import type { Address, Order, OrderItem, OrderStatus } from "@/lib/types";

export async function listOrders() {
  return db.orders;
}

export async function getOrder(id: string) {
  return db.orders.find((o) => o.id === id) ?? null;
}

export async function getOrderByNumber(number: string) {
  return db.orders.find((o) => o.number.toLowerCase() === number.toLowerCase()) ?? null;
}

export async function insertOrder(input: {
  items: OrderItem[];
  email: string;
  phone: string;
  address: Address;
  paymentMethod: string;
  gift: Order["gift"];
  discount: number;
  madeToOrder: boolean;
}) {
  const subtotal = input.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const now = new Date().toISOString();
  const existing = db.customers.find((c) => c.email.toLowerCase() === input.email.toLowerCase());
  const order: Order = {
    id: `ord-${Date.now().toString(36)}`,
    number: `SLN-${String(Math.floor(270000 + Math.random() * 29999))}`,
    customerId: existing?.id ?? null,
    email: input.email,
    phone: input.phone,
    items: input.items,
    subtotal,
    discount: input.discount,
    shipping: 0,
    tax: Math.round((subtotal - input.discount) - (subtotal - input.discount) / 1.03),
    total: subtotal - input.discount,
    currency: "INR",
    status: "payment_confirmed",
    paymentStatus: "captured",
    paymentMethod: input.paymentMethod,
    shippingAddress: input.address,
    gift: input.gift,
    timeline: [
      { status: "placed", at: now },
      { status: "payment_confirmed", at: now, note: "Captured via demo payment adapter" },
    ],
    madeToOrder: input.madeToOrder,
    notes: [],
    createdAt: now,
    isDemo: false,
  };
  db.orders.unshift(order);
  return order;
}

export async function setOrderStatus(id: string, status: OrderStatus, note?: string) {
  const o = db.orders.find((x) => x.id === id);
  if (!o) return null;
  const before = o.status;
  o.status = status;
  if (status === "refunded") o.paymentStatus = "refunded";
  o.timeline.push({ status, at: new Date().toISOString(), note });
  return { order: o, before };
}

export async function addOrderNote(id: string, note: string) {
  const o = db.orders.find((x) => x.id === id);
  if (!o) return null;
  o.notes.unshift(note);
  return o;
}
