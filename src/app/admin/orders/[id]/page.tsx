import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Card, PageHeader, Pill, ORDER_TONE, inr, when } from "@/components/admin/ui";
import { OrderControls } from "./order-controls";
import { can } from "@/server/rbac";
import { METAL_LABEL, GEM_LABEL } from "@/lib/labels";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = db.orders.find((x) => x.id === id);
  if (!o) notFound();
  const customer = db.customers.find((c) => c.id === o.customerId);
  const audit = db.audit.filter((a) => a.resource === `order:${o.number}`);
  const [canUpdate, canRefund] = await Promise.all([can("order.update"), can("order.refund")]);
  return (
    <div className="space-y-6">
      <PageHeader kicker={<Link href="/admin/orders" className="link-line">Orders</Link>} title={o.number} description={`Placed ${when(o.createdAt)} · ${o.paymentMethod}`} actions={<Pill tone={ORDER_TONE[o.status]}>{o.status.replace(/_/g, " ")}</Pill>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Items" pad={false}>
            <ul className="divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.variantId + (it.size ?? "")} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-14 w-14 shrink-0 stage"><Image src={it.image} alt="" fill sizes="56px" className="object-contain" /></div>
                  <div className="min-w-0 flex-1">
                    <p>{it.name}</p>
                    <p className="text-[12px] text-muted">{it.sku} · {it.purity} {METAL_LABEL[it.metal]}{it.gem !== "none" ? ` · ${GEM_LABEL[it.gem]}` : ""}{it.size ? ` · Size ${it.size}` : ""}{it.engraving ? ` · Engrave “${it.engraving}”` : ""}</p>
                  </div>
                  <p className="text-muted">× {it.qty}</p>
                  <p className="w-28 text-right">{inr(it.unitPrice * it.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-y-1.5 border-t border-line px-5 py-4 text-[13px]">
              <dt className="text-muted">Subtotal</dt><dd className="text-right">{inr(o.subtotal)}</dd>
              <dt className="text-muted">Discount</dt><dd className="text-right">{o.discount ? `−${inr(o.discount)}` : "—"}</dd>
              <dt className="text-muted">GST included</dt><dd className="text-right">{inr(o.tax)}</dd>
              <dt>Total</dt><dd className="text-right font-display text-xl">{inr(o.total)}</dd>
            </dl>
          </Card>
          <OrderControls id={o.id} status={o.status} canUpdate={canUpdate} canRefund={canRefund} notes={o.notes} timeline={o.timeline} />
        </div>
        <div className="space-y-6">
          <Card title="Customer">
            <p>{o.shippingAddress.name}</p>
            <p className="text-[12.5px] text-muted">{o.email}<br />{o.phone}</p>
            {customer && <Link href={`/admin/customers/${customer.id}`} className="link-line mt-3 inline-block text-[12px]">View profile · {customer.segment.join(", ")}</Link>}
          </Card>
          <Card title="Fulfilment">
            <p className="text-[13px]">{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}<br />{o.shippingAddress.city} {o.shippingAddress.pincode}</p>
            {o.gift && <p className="mt-3 text-[12.5px] text-muted">Gift packaging{o.gift.message ? ` · Card: “${o.gift.message}”` : ""}</p>}
            <p className="mt-3 text-[12.5px] text-muted">{o.madeToOrder ? "Made to order: crafting stages apply." : "Ready-to-ship stock."}</p>
          </Card>
          <Card title="Payment">
            <p className="flex items-center justify-between text-[13px]">{o.paymentMethod}<Pill tone={o.paymentStatus === "captured" ? "ok" : o.paymentStatus === "refunded" ? "danger" : "warn"}>{o.paymentStatus}</Pill></p>
            <p className="mt-2 text-[12px] text-muted">Card data is held by the payment provider only. Refunds are issued through the provider’s API.</p>
          </Card>
          <Card title="Audit trail">
            {audit.length === 0 ? <p className="text-[12.5px] text-muted">No administrative changes yet.</p> : (
              <ul className="space-y-3 text-[12.5px]">{audit.map((a) => <li key={a.id}><p>{a.action}</p><p className="text-muted">{a.actor} · {when(a.at)}</p></li>)}</ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
