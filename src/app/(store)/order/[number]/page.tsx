import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getOrderByNumber } from "@/server/repo/orders";
import { OrderTimeline } from "@/components/order/timeline";
import { TrackForm } from "../../track/track-form";
import { formatMoney } from "@/lib/money";
import { BRAND_COOKIE, parseBrand } from "@/lib/brand";
import { METAL_LABEL, GEM_LABEL } from "@/lib/labels";
import { MaskText } from "@/components/motion/reveal";
import { IconCheck, IconWhatsApp } from "@/components/ui/icons";
import { waLink, waMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const jar = await cookies();
  const brand = parseBrand(jar.get(BRAND_COOKIE)?.value);
  const allowed = (jar.get("my-orders")?.value ?? "").split(",").includes(number.toUpperCase());
  const order = allowed ? await getOrderByNumber(number) : null;
  const money = (n: number) => formatMoney(n, brand.currency);

  if (!order) {
    return (
      <div className="container-x max-w-xl py-24">
        <p className="kicker text-accent">Order {number}</p>
        <h1 className="display-lg mt-4">Verify to view this order</h1>
        <p className="mt-3 text-muted">For your privacy, enter the email used at checkout.</p>
        <div className="mt-8"><TrackForm defaultNumber={number} /></div>
      </div>
    );
  }

  const isNew = sp.new === "1";
  return (
    <div className="container-x py-12 md:py-20">
      <div className="max-w-3xl">
        {isNew && <p className="flex items-center gap-2 kicker text-accent"><IconCheck size={14} /> Payment confirmed</p>}
        <MaskText as="h1" lines={isNew ? ["Thank you.", "It’s being prepared."] : [`Order ${order.number}`]} className="display-xl mt-4" />
        <p className="lede mt-5">{isNew ? `A confirmation has been sent to ${order.email}. We’ll keep you updated on WhatsApp at every stage.` : `Placed on ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`}</p>
        {isNew && <p className="mt-2 text-[13px] text-muted">Order number <span className="text-fg">{order.number}</span></p>}
      </div>
      <div className="mt-14 grid gap-12 lg:grid-cols-12">
        <section className="lg:col-span-5" aria-label="Progress">
          <p className="kicker text-muted">{order.madeToOrder ? "Made-to-order progress" : "Progress"}</p>
          <div className="mt-6"><OrderTimeline order={order} /></div>
        </section>
        <section className="lg:col-span-6 lg:col-start-7" aria-label="Order details">
          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((it) => (
              <li key={it.variantId + (it.size ?? "")} className="flex gap-5 py-5">
                <div className="relative h-24 w-20 shrink-0 stage overflow-hidden"><Image src={it.image} alt="" fill sizes="80px" className="jewel-shot-sm" /></div>
                <div className="flex-1">
                  <p className="font-display text-xl">{it.name}</p>
                  <p className="text-[12.5px] text-muted">{it.purity} {METAL_LABEL[it.metal]}{it.gem !== "none" ? ` · ${GEM_LABEL[it.gem]}` : ""}{it.size ? ` · Size ${it.size}` : ""} · Qty {it.qty}</p>
                  {it.engraving && <p className="text-[12.5px] text-muted">Engraving “{it.engraving}”</p>}
                  <p className="text-[12px] text-muted">SKU {it.sku}</p>
                </div>
                <p className="text-[14px]">{money(it.unitPrice * it.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid grid-cols-2 gap-y-2 text-[13.5px]">
            <dt className="text-muted">Subtotal</dt><dd className="text-right">{money(order.subtotal)}</dd>
            {order.discount > 0 && (<><dt className="text-muted">Discount</dt><dd className="text-right">−{money(order.discount)}</dd></>)}
            <dt className="text-muted">Delivery</dt><dd className="text-right">Complimentary</dd>
            <dt className="text-[15px]">Total paid</dt><dd className="text-right font-display text-2xl">{money(order.total)}</dd>
          </dl>
          <div className="mt-8 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
            <div><p className="kicker text-muted">Delivering to</p><p className="mt-2 text-[13.5px]">{order.shippingAddress.name}<br />{order.shippingAddress.line1}<br />{[order.shippingAddress.city, order.shippingAddress.pincode].filter(Boolean).join(" ")}</p></div>
            <div><p className="kicker text-muted">Payment</p><p className="mt-2 text-[13.5px]">{order.paymentMethod}</p>{order.gift && <p className="mt-3 text-[13px] text-muted">Gift packaged{order.gift.message ? `, with card: “${order.gift.message}”` : ""}</p>}</div>
          </div>
          <div className="mt-8 border-t border-line pt-8">
            <p className="kicker text-muted">After delivery</p>
            <p className="mt-2 text-[13.5px] text-muted">Your invoice, diamond certificate and warranty appear here once the order is dispatched. Resizing, polishing and repairs can be booked from any boutique.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-outline btn-sm" target="_blank" rel="noopener" href={waLink(brand.whatsapp, waMessage(`I have a question about order ${order.number}`, brand.name))}><IconWhatsApp size={15} /> Ask about this order</a>
              <Link href="/appointments?service=store" className="btn btn-outline btn-sm">Book a service appointment</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
