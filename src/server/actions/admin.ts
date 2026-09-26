"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "../db";
import { can, ROLE_COOKIE, ROLES, type Permission, type RoleId } from "../rbac";
import { recordAudit } from "../repo/audit";
import { setOrderStatus, addOrderNote } from "../repo/orders";
import { setAppointmentStatus, updateEnquiry } from "../repo/crm";
import { saveHomeSections } from "../repo/content";
import { coupons } from "../promotions";
import { BRAND_COOKIE, brandSchema, parseBrand, serializeBrand, DEFAULT_BRAND } from "@/lib/brand";
import type { OrderStatus, Product, Visibility, StockStatus, Badge } from "@/lib/types";

type Result = { ok: true; message?: string } | { ok: false; error: string };

async function guard(p: Permission): Promise<Result | null> {
  return (await can(p)) ? null : { ok: false, error: `Your role doesn’t have the “${p}” permission.` };
}

/* ------------------------------------------------------------------ session (demo) */
export async function switchRole(role: RoleId) {
  if (!(role in ROLES)) return;
  const jar = await cookies();
  jar.set(ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/admin", "layout");
}

/* ------------------------------------------------------------------ orders */
const ORDER_STATUSES: OrderStatus[] = ["placed", "payment_confirmed", "quality_check", "packaged", "dispatched", "out_for_delivery", "delivered", "cancelled", "refunded"];

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Result> {
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: "Unknown status" };
  const denied = await guard(status === "refunded" ? "order.refund" : "order.update");
  if (denied) return denied;
  const r = await setOrderStatus(id, status, note?.slice(0, 300));
  if (!r) return { ok: false, error: "Order not found" };
  await recordAudit(status === "refunded" ? "order.refunded" : "order.status_changed", `order:${r.order.number}`, { status: r.before }, { status, note });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Status updated. The customer is notified on WhatsApp and email (queued)." };
}

export async function addNote(id: string, note: string): Promise<Result> {
  const denied = await guard("order.update");
  if (denied) return denied;
  const text = note.trim().slice(0, 500);
  if (!text) return { ok: false, error: "Note is empty" };
  const o = await addOrderNote(id, text);
  if (!o) return { ok: false, error: "Order not found" };
  await recordAudit("order.note_added", `order:${o.number}`, undefined, { note: text });
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true };
}

/* ------------------------------------------------------------------ products */
const productSchema = z.object({
  name: z.string().min(2).max(80),
  subtitle: z.string().max(120),
  description: z.string().max(2000),
  categoryId: z.string(),
  collectionIds: z.array(z.string()).max(12),
  visibility: z.enum(["draft", "scheduled", "published", "archived"]),
  status: z.enum(["in_stock", "low_stock", "made_to_order", "preorder", "out_of_stock", "discontinued"]),
  badges: z.array(z.enum(["NEW", "EXCLUSIVE", "LIMITED", "BESTSELLER", "MADE TO ORDER"])).max(3),
  variants: z.array(z.object({ id: z.string(), price: z.number().int().min(1000).max(50000000), stock: z.number().int().min(0).max(9999) })),
});

export async function saveProduct(id: string, input: z.infer<typeof productSchema>): Promise<Result> {
  const denied = await guard("product.update");
  if (denied) return denied;
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const p = db.products.find((x) => x.id === id);
  if (!p) return { ok: false, error: "Product not found" };
  const d = parsed.data;
  if (d.visibility !== p.visibility && d.visibility === "published") {
    const deny = await guard("product.publish");
    if (deny) return deny;
  }
  const priceChanges = d.variants.filter((v) => p.variants.find((x) => x.id === v.id)?.price !== v.price);
  const stockChanges = d.variants.filter((v) => p.variants.find((x) => x.id === v.id)?.stock !== v.stock);
  if (priceChanges.length) { const deny = await guard("pricing.modify"); if (deny) return deny; }
  if (stockChanges.length) { const deny = await guard("inventory.modify"); if (deny) return deny; }

  const before = { name: p.name, visibility: p.visibility, status: p.status, badges: p.badges, collectionIds: p.collectionIds };
  Object.assign(p, { name: d.name, subtitle: d.subtitle, description: d.description, categoryId: d.categoryId, collectionIds: d.collectionIds, visibility: d.visibility as Visibility, status: d.status as StockStatus, badges: d.badges as Badge[] });
  for (const c of db.collections) {
    const has = c.productIds.includes(p.id);
    if (d.collectionIds.includes(c.id) && !has) c.productIds.push(p.id);
    if (!d.collectionIds.includes(c.id) && has) c.productIds = c.productIds.filter((x) => x !== p.id);
  }
  for (const v of priceChanges) {
    const t = p.variants.find((x) => x.id === v.id)!;
    await recordAudit("product.price_changed", `variant:${t.sku}`, { price: t.price }, { price: v.price });
    t.price = v.price;
  }
  for (const v of stockChanges) {
    const t = p.variants.find((x) => x.id === v.id)!;
    await recordAudit("inventory.adjusted", `variant:${t.sku}`, { stock: t.stock }, { stock: v.stock });
    t.stock = v.stock;
  }
  await recordAudit("product.updated", `product:${p.id}`, before, { name: p.name, visibility: p.visibility, status: p.status, badges: p.badges, collectionIds: p.collectionIds });
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. Changes are live on the storefront." };
}

export async function createProduct(input: { name: string; categoryId: string; design: Product["design"]; basePrice: number }): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await can("product.create"))) return { ok: false, error: "Your role doesn’t have the “product.create” permission." };
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2 || !(input.basePrice >= 1000)) return { ok: false, error: "Enter a name and a base price of at least ₹1,000." };
  const template = db.products.find((p) => p.design === input.design) ?? db.products[0];
  const n = db.products.length + 1;
  const id = `prd-${String(n).padStart(3, "0")}-${Date.now().toString(36).slice(-3)}`;
  const slug = `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-4)}`;
  const ratio = input.basePrice / Math.min(...template.variants.map((v) => v.price));
  const product: Product = {
    ...structuredClone(template),
    id, slug, name, sku: `SLN-NEW-${1000 + n}`, subtitle: "Draft: add a subtitle", categoryId: input.categoryId, collectionIds: [], badges: ["NEW"], visibility: "draft", rating: null, createdAt: new Date().toISOString(),
    variants: template.variants.map((v, i) => ({ ...v, id: `${id}-v${i}`, sku: `SLN-NEW-${1000 + n}-${i + 1}`, price: Math.round((v.price * ratio) / 500) * 500, stock: 0 })),
  };
  // Draft reuses the template's studio renders until its own media is uploaded.
  product.mediaSlug = template.mediaSlug ?? template.slug;
  db.products.push(product);
  await recordAudit("product.created", `product:${id}`, undefined, { name, basePrice: input.basePrice, visibility: "draft" });
  revalidatePath("/admin/products");
  return { ok: true, id };
}

/* ------------------------------------------------------------------ taxonomy */
export async function moveCategory(id: string, dir: -1 | 1): Promise<Result> {
  const denied = await guard("product.update");
  if (denied) return denied;
  const c = db.categories.find((x) => x.id === id);
  if (!c) return { ok: false, error: "Not found" };
  const sibs = db.categories.filter((x) => x.parentId === c.parentId).sort((a, b) => a.position - b.position);
  const i = sibs.findIndex((x) => x.id === id);
  const j = i + dir;
  if (j < 0 || j >= sibs.length) return { ok: true };
  [sibs[i].position, sibs[j].position] = [sibs[j].position, sibs[i].position];
  await recordAudit("category.reordered", `category:${c.slug}`, undefined, { direction: dir });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleCategory(id: string): Promise<Result> {
  const denied = await guard("product.publish");
  if (denied) return denied;
  const c = db.categories.find((x) => x.id === id);
  if (!c) return { ok: false, error: "Not found" };
  c.published = !c.published;
  await recordAudit(c.published ? "category.published" : "category.unpublished", `category:${c.slug}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleCollection(id: string): Promise<Result> {
  const denied = await guard("product.publish");
  if (denied) return denied;
  const c = db.collections.find((x) => x.id === id);
  if (!c) return { ok: false, error: "Not found" };
  c.published = !c.published;
  await recordAudit(c.published ? "collection.published" : "collection.unpublished", `collection:${c.slug}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------------------------------------------ inventory */
export async function adjustStock(variantId: string, stock: number): Promise<Result> {
  const denied = await guard("inventory.modify");
  if (denied) return denied;
  if (!Number.isInteger(stock) || stock < 0 || stock > 9999) return { ok: false, error: "Stock must be 0 – 9999" };
  for (const p of db.products) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) {
      await recordAudit("inventory.adjusted", `variant:${v.sku}`, { stock: v.stock }, { stock });
      v.stock = stock;
      revalidatePath("/admin/inventory");
      return { ok: true };
    }
  }
  return { ok: false, error: "Variant not found" };
}

/* ------------------------------------------------------------------ CRM */
export async function updateAppointment(id: string, status: "confirmed" | "completed" | "no_show" | "cancelled"): Promise<Result> {
  const denied = await guard("appointment.manage");
  if (denied) return denied;
  const r = await setAppointmentStatus(id, status);
  if (!r) return { ok: false, error: "Not found" };
  await recordAudit("appointment.status_changed", `appointment:${id}`, { status: r.before }, { status });
  revalidatePath("/admin/appointments");
  return { ok: true };
}

export async function updateEnquiryAction(id: string, patch: { status?: "open" | "assigned" | "resolved"; assignee?: string }): Promise<Result> {
  const denied = await guard("enquiry.manage");
  if (denied) return denied;
  const e = await updateEnquiry(id, { ...patch, unread: 0 });
  if (!e) return { ok: false, error: "Not found" };
  await recordAudit("enquiry.updated", `enquiry:${id}`, undefined, patch);
  revalidatePath("/admin/enquiries");
  return { ok: true };
}

/* ------------------------------------------------------------------ promotions */
export async function toggleCoupon(code: string): Promise<Result> {
  const denied = await guard("promotion.publish");
  if (denied) return denied;
  const c = coupons.find((x) => x.code === code);
  if (!c) return { ok: false, error: "Not found" };
  c.active = !c.active;
  await recordAudit(c.active ? "coupon.activated" : "coupon.deactivated", `coupon:${code}`);
  revalidatePath("/admin/promotions");
  return { ok: true };
}

/* ------------------------------------------------------------------ content */
export async function saveHomeLayout(order: { id: string; enabled: boolean }[]): Promise<Result> {
  const denied = await guard("content.edit");
  if (denied) return denied;
  const before = db.homeSections.map((s) => `${s.id}${s.enabled ? "" : " (hidden)"}`);
  await saveHomeSections(order.slice(0, 20));
  await recordAudit("content.homepage_updated", "page:home", before, db.homeSections.map((s) => `${s.id}${s.enabled ? "" : " (hidden)"}`));
  revalidatePath("/");
  return { ok: true, message: "Homepage updated." };
}

/* ------------------------------------------------------------------ brand */
export async function saveBrand(input: unknown): Promise<Result> {
  const denied = await guard("brand.manage");
  if (denied) return denied;
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  const jar = await cookies();
  const before = parseBrand(jar.get(BRAND_COOKIE)?.value);
  jar.set(BRAND_COOKIE, serializeBrand(parsed.data), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  jar.delete("preview-theme");
  const changed = Object.fromEntries(Object.entries(parsed.data).filter(([k, v]) => before[k as keyof typeof before] !== v));
  await recordAudit("brand.updated", "brand:current", Object.fromEntries(Object.keys(changed).map((k) => [k, before[k as keyof typeof before]])), changed);
  revalidatePath("/", "layout");
  return { ok: true, message: "Brand saved. Every page now uses the new identity." };
}

export async function resetBrand(): Promise<Result> {
  return saveBrand(DEFAULT_BRAND);
}
