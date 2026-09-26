import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/server/repo/crm";
import { Card, PageHeader, Pill, Stat, ORDER_TONE, inr, when } from "@/components/admin/ui";
import { db } from "@/server/db";
import { waLink } from "@/lib/whatsapp";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await getCustomer((await params).id);
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <PageHeader kicker={<Link href="/admin/customers" className="link-line">Customers</Link>} title={c.name} description={`${c.email} · ${c.phone} · ${c.city} · client since ${new Date(c.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`} actions={<a href={waLink(c.phone, `Hello ${c.name.split(" ")[0]},`)} target="_blank" rel="noopener" className="btn btn-outline btn-sm">WhatsApp</a>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Lifetime value" value={inr(c.ltv)} />
        <Stat label="Orders" value={String(c.orders)} />
        <Stat label="Average order" value={c.aov ? inr(c.aov) : "—"} />
        <Stat label="Saved ring size" value={c.ringSize ? `IN ${c.ringSize}` : "—"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Orders" className="xl:col-span-2" pad={false}>
          <ul className="divide-y divide-line">
            {c.orderList.map((o) => (
              <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-elevated"><span>{o.number}<span className="block text-[12px] text-muted">{o.items.map((i) => i.name).join(", ")} · {when(o.createdAt)}</span></span><span className="flex items-center gap-3"><Pill tone={ORDER_TONE[o.status]}>{o.status.replace(/_/g, " ")}</Pill>{inr(o.total)}</span></Link></li>
            ))}
            {c.orderList.length === 0 && <li className="px-5 py-6 text-muted">No orders yet.</li>}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card title="Profile">
            <div className="flex flex-wrap gap-1.5">{c.segment.map((s) => <Pill key={s} tone={s === "VIP" ? "accent" : "muted"}>{s}</Pill>)}</div>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted">Preferred boutique</dt><dd>{db.stores.find((s) => s.id === c.preferredStoreId)?.name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Marketing consent</dt><dd>{c.marketingConsent ? "Yes (email, WhatsApp)" : "No"}</dd></div>
            </dl>
          </Card>
          <Card title="Appointments">
            {c.appointments.length === 0 ? <p className="text-muted">None</p> : <ul className="space-y-2 text-[13px]">{c.appointments.map((a) => <li key={a.id} className="flex justify-between"><span className="capitalize">{a.service}</span><span className="text-muted">{a.date} · {a.status}</span></li>)}</ul>}
          </Card>
        </div>
      </div>
    </div>
  );
}
