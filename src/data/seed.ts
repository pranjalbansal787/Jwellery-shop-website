/** DEMO OPERATIONAL DATA — customers, orders, appointments and enquiries are fictional. */
import type { Appointment, AuditEvent, Customer, Enquiry, Order, OrderStatus, Store } from "@/lib/types";
import { products } from "./catalog";
import { productImage } from "@/lib/media";

export const stores: Store[] = [
  {
    id: "st-ggn", slug: "gurugram-flagship", name: "Gurugram Flagship", city: "Gurugram",
    address: "Ground Floor, 42 Golf Course Road, Sector 54, Gurugram 122002",
    phone: "+91 124 400 0000", whatsapp: "919000000001",
    hours: [{ days: "Mon – Sat", time: "11:00 – 20:30" }, { days: "Sunday", time: "12:00 – 19:00" }],
    lat: 28.4412, lng: 77.1036, services: ["Bridal suite", "Custom design", "Ring sizing", "Cleaning & polishing"], image: "halo",
  },
  {
    id: "st-del", slug: "new-delhi-khan-market", name: "New Delhi Salon", city: "New Delhi",
    address: "18 Middle Lane, Khan Market, New Delhi 110003",
    phone: "+91 11 4000 0000", whatsapp: "919000000002",
    hours: [{ days: "Mon – Sun", time: "11:00 – 20:00" }],
    lat: 28.6002, lng: 77.2270, services: ["Private viewing room", "Ring sizing", "Repairs"], image: "riviere",
  },
  {
    id: "st-bom", slug: "mumbai-bandra", name: "Mumbai Atelier", city: "Mumbai",
    address: "7 Pali Hill Road, Bandra West, Mumbai 400050",
    phone: "+91 22 4000 0000", whatsapp: "919000000003",
    hours: [{ days: "Tue – Sun", time: "11:30 – 20:30" }, { days: "Monday", time: "By appointment" }],
    lat: 19.0680, lng: 72.8264, services: ["Atelier workshop", "Custom design", "Bridal suite"], image: "tennis",
  },
];

const FIRST = ["Aanya", "Rhea", "Kabir", "Ishaan", "Meera", "Tara", "Arjun", "Zoya", "Naina", "Vihaan", "Sara", "Dev", "Anika", "Rohan", "Kiara", "Aditi"];
const LAST = ["Kapoor", "Malhotra", "Sethi", "Khanna", "Oberoi", "Bhatia", "Menon", "Rao", "Singhania", "Chopra", "Mehra", "Iyer", "Bajaj", "Suri", "Vohra", "Grover"];
const CITIES = ["Gurugram", "New Delhi", "Mumbai", "Bengaluru", "Noida", "Pune", "Chandigarh", "Jaipur"];

let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const NOW = new Date("2026-09-26T10:00:00+05:30").getTime();
const DAY = 86400000;

export const customers: Customer[] = FIRST.map((f, i) => ({
  id: `cus-${String(i + 1).padStart(3, "0")}`,
  name: `${f} ${LAST[i]}`,
  email: `${f.toLowerCase()}.${LAST[i].toLowerCase()}@example.com`,
  phone: `+91 98${String(10000000 + Math.floor(rnd() * 89999999)).slice(0, 8)}`,
  city: pick(CITIES),
  segment: ([["VIP", "Repeat Buyer"], ["Bridal", "High Intent"], ["Repeat Buyer"], ["Appointment Lead"], ["Dormant"], ["High Intent"], ["VIP"], ["Bridal"]] as Customer["segment"][])[i % 8],
  preferredStoreId: pick(stores).id,
  ringSize: i % 3 === 0 ? String(10 + (i % 7)) : null,
  marketingConsent: i % 4 !== 0,
  createdAt: new Date(NOW - (40 + i * 23) * DAY).toISOString(),
}));

const FLOW: OrderStatus[] = ["placed", "payment_confirmed", "quality_check", "packaged", "dispatched", "out_for_delivery", "delivered"];
const METHODS = ["UPI · Razorpay", "Card · Razorpay", "Net Banking · Razorpay", "EMI · Razorpay", "Payment link"];

export const orders: Order[] = Array.from({ length: 64 }, (_, i): Order => {
  const daysAgo = Math.floor(Math.pow(rnd(), 1.4) * 88);
  const created = NOW - daysAgo * DAY - Math.floor(rnd() * DAY * 0.6);
  const cust = pick(customers);
  const itemCount = rnd() > 0.8 ? 2 : 1;
  const items = Array.from({ length: itemCount }, () => {
    // weight towards lower-priced items for realistic mix
    const p = products[Math.floor(Math.pow(rnd(), 1.1) * products.length)];
    const v = p.variants[Math.floor(rnd() * p.variants.length)];
    return {
      productId: p.id, variantId: v.id, name: p.name, sku: v.sku, metal: v.metal, purity: v.purity, gem: v.gem,
      size: p.sizes ? pick(p.sizes) : undefined, qty: 1, unitPrice: v.price, image: productImage(p, v.metal, v.gem),
    };
  });
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const progress = daysAgo > 9 ? 6 : Math.min(6, Math.floor((9 - daysAgo) / 1.5) === 0 ? 0 : Math.max(0, 6 - Math.floor(daysAgo / 1.5)));
  const cancelled = i % 29 === 7;
  const refunded = i % 31 === 12;
  const status: OrderStatus = cancelled ? "cancelled" : refunded ? "refunded" : FLOW[progress];
  const timeline = FLOW.slice(0, cancelled ? 1 : progress + 1).map((s, k) => ({ status: s, at: new Date(created + k * DAY * 0.8).toISOString() }));
  if (cancelled) timeline.push({ status: "cancelled", at: new Date(created + DAY * 0.3).toISOString(), note: "Customer requested cancellation before dispatch" } as never);
  if (refunded) timeline.push({ status: "refunded", at: new Date(created + DAY * 12).toISOString(), note: "Returned within 15-day window" } as never);
  return {
    id: `ord-${String(i + 1).padStart(4, "0")}`,
    number: `SLN-${String(260400 + i * 7)}`,
    customerId: cust.id,
    email: cust.email,
    phone: cust.phone,
    items,
    subtotal,
    discount: i % 6 === 0 ? Math.round(subtotal * 0.05) : 0,
    shipping: 0,
    tax: Math.round(subtotal - subtotal / 1.03),
    total: subtotal - (i % 6 === 0 ? Math.round(subtotal * 0.05) : 0),
    currency: "INR",
    status,
    paymentStatus: cancelled ? "refunded" : refunded ? "refunded" : "captured",
    paymentMethod: pick(METHODS),
    shippingAddress: { name: cust.name, line1: `${10 + Math.floor(rnd() * 200)}, ${pick(["Aralias", "Magnolias", "Park Place", "Vasant Vihar", "Worli Sea Face", "Indiranagar"])}`, city: cust.city, state: "—", pincode: "1220" + String(Math.floor(rnd() * 90) + 10), phone: cust.phone },
    gift: i % 5 === 0 ? { wrap: true, message: "Happy anniversary, with all my love." } : null,
    timeline,
    madeToOrder: items.some((it) => products.find((p) => p.id === it.productId)?.status === "made_to_order"),
    notes: [],
    createdAt: new Date(created).toISOString(),
    isDemo: true,
  };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const SERVICES: Appointment["service"][] = ["bridal", "store", "video", "custom", "stylist"];
export const appointments: Appointment[] = Array.from({ length: 14 }, (_, i) => {
  const c = customers[(i * 5) % customers.length];
  const offset = i - 5; // some past, most upcoming
  const d = new Date(NOW + offset * DAY);
  return {
    id: `apt-${String(i + 1).padStart(3, "0")}`,
    service: SERVICES[i % SERVICES.length],
    storeId: i % 5 === 2 ? null : stores[i % 3].id,
    name: c.name, email: c.email, phone: c.phone,
    date: d.toISOString().slice(0, 10),
    time: ["11:30", "13:00", "15:30", "17:00", "18:30"][i % 5],
    notes: i % 3 === 0 ? "Looking at oval solitaires around 1 ct, budget flexible." : undefined,
    productId: i % 2 === 0 ? products[(i * 3) % products.length].id : undefined,
    status: offset < 0 ? (i % 4 === 0 ? "no_show" : "completed") : i % 3 === 0 ? "requested" : "confirmed",
    createdAt: new Date(NOW - (8 - i) * DAY).toISOString(),
  };
});

export const enquiries: Enquiry[] = [
  { id: "enq-001", channel: "whatsapp", name: "Rhea Malhotra", phone: "+91 98111 20394", subject: "Ask about this jewellery", message: "Is the Aurore Oval Solitaire available in 1.5 ct? Would like to see it this weekend.", productId: products[1].id, status: "open", unread: 2, createdAt: new Date(NOW - 0.1 * DAY).toISOString() },
  { id: "enq-002", channel: "whatsapp", name: "Kabir Sethi", phone: "+91 98220 11873", subject: "Request customisation", message: "Can the Trinity ring be made with an emerald centre?", productId: products[7].id, status: "assigned", assignee: "Priya (Gurugram)", unread: 0, createdAt: new Date(NOW - 0.4 * DAY).toISOString() },
  { id: "enq-003", channel: "web", name: "Tara Bhatia", phone: "+91 99100 55412", subject: "Ask about delivery", message: "Can I get the tennis bracelet delivered before 4 October?", productId: products[37].id, status: "open", unread: 1, createdAt: new Date(NOW - 1.2 * DAY).toISOString() },
  { id: "enq-004", channel: "whatsapp", name: "Meera Khanna", phone: "+91 98730 66120", subject: "Book appointment", message: "Bridal consultation for December wedding, two people.", status: "resolved", assignee: "Ananya (Delhi)", unread: 0, createdAt: new Date(NOW - 2 * DAY).toISOString() },
  { id: "enq-005", channel: "phone", name: "Arjun Menon", phone: "+91 98450 71231", subject: "Check availability", message: "Surya Kada in size 2.6 at Mumbai atelier?", productId: products[40].id, status: "open", unread: 0, createdAt: new Date(NOW - 2.5 * DAY).toISOString() },
  { id: "enq-006", channel: "whatsapp", name: "Zoya Rao", phone: "+91 99870 33218", subject: "Share wishlist", message: "Sharing my wishlist, which of these would you recommend for an anniversary?", status: "assigned", assignee: "Priya (Gurugram)", unread: 3, createdAt: new Date(NOW - 3 * DAY).toISOString() },
];

export const auditLog: AuditEvent[] = [
  { id: "aud-003", actor: "Aarav Mehta (Super Admin)", action: "coupon.created", resource: "coupon:DIWALI26", after: { type: "percentage", value: 5, minOrder: 100000 }, ip: "10.0.4.21", userAgent: "Chrome 140 / macOS", at: new Date(NOW - 0.8 * DAY).toISOString() },
  { id: "aud-002", actor: "Neha Kaul (Catalog Manager)", action: "product.price_changed", resource: "product:prd-022", before: { price: 119000 }, after: { price: 125000 }, ip: "10.0.4.33", userAgent: "Safari 19 / macOS", at: new Date(NOW - 1.5 * DAY).toISOString() },
  { id: "aud-001", actor: "Rahul Das (Inventory Manager)", action: "inventory.adjusted", resource: "variant:prd-036-wg18k-d", before: { stock: 4 }, after: { stock: 2 }, ip: "10.0.4.40", userAgent: "Chrome 140 / Windows", at: new Date(NOW - 3 * DAY).toISOString() },
];
