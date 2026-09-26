import Link from "next/link";
import { db } from "@/server/db";
import { FilterLinks, PageHeader, Pill, Table, Td, ORDER_TONE, inr, when } from "@/components/admin/ui";

export const metadata = { title: "Orders" };

const GROUPS: Record<string, string[]> = {
  "": [],
  open: ["placed", "payment_confirmed", "quality_check", "packaged"],
  transit: ["dispatched", "out_for_delivery"],
  delivered: ["delivered"],
  closed: ["cancelled", "refunded"],
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = sp.status && sp.status in GROUPS ? sp.status : "";
  const q = (sp.q ?? "").toLowerCase().trim();
  const list = db.orders.filter((o) => (!status || GROUPS[status].includes(o.status)) && (!q || `${o.number} ${o.email} ${o.shippingAddress.name} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(q)));
  const count = (k: string) => (k ? db.orders.filter((o) => GROUPS[k].includes(o.status)).length : db.orders.length);
  return (
    <div className="space-y-6">
      <PageHeader kicker="Commerce" title="Orders" description="Every status change is recorded in the audit log and triggers customer notifications." />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterLinks base="/admin/orders" param="status" current={status} options={[["", "All", count("")], ["open", "To fulfil", count("open")], ["transit", "In transit", count("transit")], ["delivered", "Delivered", count("delivered")], ["closed", "Cancelled & refunded", count("closed")]]} />
        <form className="flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Order, customer or piece" className="field-box w-64" />{status && <input type="hidden" name="status" value={status} />}<button className="btn btn-outline btn-sm">Search</button></form>
      </div>
      <div className="border border-line bg-surface">
        <Table head={["Order", "Placed", "Customer", "Items", "Payment", "Status", "Total"]}>
          {list.map((o) => (
            <tr key={o.id} className="hover:bg-elevated">
              <Td><Link href={`/admin/orders/${o.id}`} className="link-line">{o.number}</Link>{!o.isDemo && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-accent">Live</span>}</Td>
              <Td className="text-muted">{when(o.createdAt)}</Td>
              <Td>{o.shippingAddress.name}<span className="block text-[12px] text-muted">{o.email}</span></Td>
              <Td className="max-w-[240px] truncate">{o.items.map((i) => i.name).join(", ")}</Td>
              <Td className="text-muted">{o.paymentMethod.split(" · ")[0]}</Td>
              <Td><Pill tone={ORDER_TONE[o.status]}>{o.status.replace(/_/g, " ")}</Pill>{o.madeToOrder && <span className="ml-2 text-[10.5px] text-muted">MTO</span>}</Td>
              <Td className="text-right">{inr(o.total)}</Td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <p className="p-8 text-center text-muted">No orders match.</p>}
      </div>
    </div>
  );
}
