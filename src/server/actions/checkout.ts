"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "../db";
import { insertOrder, getOrderByNumber } from "../repo/orders";
import { recordAudit } from "../repo/audit";
import { applyCoupon } from "../promotions";
import { getGateway, METHOD_LABEL, type PaymentMethod } from "../payments";
import { productImage } from "@/lib/media";
import { decodeConfig, leadDaysConfig, priceConfig } from "@/lib/configurator";
import type { Product, Variant } from "@/lib/types";

const lineSchema = z.object({ variantId: z.string().max(80), qty: z.number().int().min(1).max(5), size: z.string().max(10).optional(), engraving: z.string().max(18).optional(), image: z.string().regex(/^\/renders\/[a-z0-9-]+\.webp$/).optional() });
const schema = z.object({
  email: z.string().email().max(120),
  phone: z.string().regex(/^[+\d][\d\s-]{7,16}$/),
  fulfilment: z.enum(["delivery", "pickup"]),
  storeId: z.string().max(20).optional(),
  address: z.object({ name: z.string().min(2).max(80), line1: z.string().max(120), line2: z.string().max(120).optional(), city: z.string().max(60), state: z.string().max(60), pincode: z.string().max(6) }),
  method: z.enum(["upi", "card", "netbanking", "emi", "payment_link", "store"]),
  coupon: z.string().max(20).optional(),
  gift: z.object({ wrap: z.boolean(), message: z.string().max(180).optional() }),
  lines: z.array(lineSchema).min(1).max(20),
});

export type CheckoutInput = z.infer<typeof schema>;

/** Re-prices every line from the catalogue: client-side prices are never trusted. */
function price(lines: CheckoutInput["lines"]) {
  const items: { product: Pick<Product, "id" | "name" | "slug" | "defaultMetal" | "defaultGem" | "status" | "sizes" | "visibility">; v: Variant; l: CheckoutInput["lines"][number] }[] = [];
  for (const l of lines) {
    const cfg = decodeConfig(l.variantId);
    if (cfg) {
      // Bespoke configuration: priced on the server with the same rules the configurator shows.
      const base = db.products.find((p) => p.design === cfg.setting && p.gems.includes(cfg.stone)) ?? db.products.find((p) => p.design === cfg.setting)!;
      items.push({
        product: { id: `bespoke-${cfg.setting}`, name: `Bespoke ${cfg.setting.replace("-", " ")} ring`, slug: base.slug, defaultMetal: base.defaultMetal, defaultGem: base.defaultGem, status: "made_to_order", sizes: ["x"], visibility: "published" },
        v: { id: l.variantId, sku: `SLN-BSP-${cfg.setting.slice(0, 3).toUpperCase()}-${cfg.carat}`, metal: cfg.metal, purity: cfg.metal === "platinum" ? "PT950" : "18K", gem: cfg.stone, price: priceConfig(cfg), stock: 0, weightGrams: 4, leadDays: leadDaysConfig(cfg) },
        l: { ...l, size: cfg.size },
      });
      continue;
    }
    const product = db.products.find((p) => p.variants.some((v) => v.id === l.variantId));
    const v = product?.variants.find((x) => x.id === l.variantId);
    if (!product || !v || product.visibility !== "published") throw new Error("An item in your bag is no longer available.");
    if (product.status === "out_of_stock" || product.status === "discontinued") throw new Error(`${product.name} is currently unavailable.`);
    if (product.sizes && !l.size) throw new Error(`Please choose a size for ${product.name}.`);
    items.push({ product, v, l });
  }
  return items;
}

export async function quoteCoupon(code: string, lines: CheckoutInput["lines"]) {
  try {
    const items = price(lines);
    const subtotal = items.reduce((s, i) => s + i.v.price * i.l.qty, 0);
    const r = applyCoupon(code, subtotal);
    return r.error ? { ok: false as const, error: r.error } : { ok: true as const, discount: r.discount, description: r.coupon?.description ?? "" };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function placeOrder(input: CheckoutInput): Promise<{ ok: true; number: string } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details and try again." };
  const d = parsed.data;
  if (d.fulfilment === "delivery" && (!d.address.line1 || !/^\d{6}$/.test(d.address.pincode))) return { ok: false, error: "Please enter a complete delivery address with a 6-digit PIN code." };
  if (d.method === "store" && d.fulfilment !== "pickup") return { ok: false, error: "Pay at boutique is only available for store pickup." };
  try {
    const items = price(d.lines);
    const subtotal = items.reduce((s, i) => s + i.v.price * i.l.qty, 0);
    const { discount, coupon } = applyCoupon(d.coupon, subtotal);
    const gateway = getGateway();
    const intent = await gateway.createIntent(subtotal - discount, "INR", { email: d.email });
    const ok = await gateway.verify(intent.id, {});
    if (!ok) return { ok: false, error: "Your payment couldn’t be confirmed. You have not been charged." };
    const store = d.storeId ? db.stores.find((s) => s.id === d.storeId) : null;
    const order = await insertOrder({
      email: d.email,
      phone: d.phone,
      paymentMethod: `${METHOD_LABEL[d.method as PaymentMethod]} · ${gateway.name}`,
      gift: d.gift.wrap ? { wrap: true, message: d.gift.message || undefined } : null,
      discount,
      madeToOrder: items.some((i) => i.v.stock < i.l.qty),
      address: d.fulfilment === "pickup" && store ? { name: d.address.name, line1: `Store pickup · ${store.name}`, city: store.city, state: "", pincode: "", phone: d.phone } : { ...d.address, phone: d.phone },
      items: items.map(({ product, v, l }) => ({ productId: product.id, variantId: v.id, name: product.name, sku: v.sku, metal: v.metal, purity: v.purity, gem: v.gem, size: l.size, engraving: l.engraving, qty: l.qty, unitPrice: v.price, image: l.variantId.startsWith("cfg:") ? l.image ?? productImage(product) : productImage(product, v.metal, v.gem) })),
    });
    // reserve stock (production: DB transaction with row locks; releases on payment failure)
    for (const { v, l } of items) v.stock = Math.max(0, v.stock - l.qty);
    if (coupon) coupon.used++;
    await recordAudit("order.created", `order:${order.number}`, undefined, { total: order.total, items: order.items.length }, "Storefront (customer)");
    const jar = await cookies();
    const mine = (jar.get("my-orders")?.value ?? "").split(",").filter(Boolean);
    jar.set("my-orders", [order.number, ...mine].slice(0, 10).join(","), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
    return { ok: true, number: order.number };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Something went wrong. You have not been charged." };
  }
}

/** Order lookup requires number + email; grants this browser access to the tracking page. */
export async function verifyOrderAccess(_: unknown, form: FormData): Promise<{ error?: string; number?: string }> {
  const number = String(form.get("number") ?? "").trim().toUpperCase();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const o = await getOrderByNumber(number);
  if (!o || o.email.toLowerCase() !== email) return { error: "We couldn’t find an order with those details." };
  const jar = await cookies();
  const mine = (jar.get("my-orders")?.value ?? "").split(",").filter(Boolean);
  jar.set("my-orders", [o.number, ...mine.filter((m) => m !== o.number)].slice(0, 10).join(","), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return { number: o.number };
}
