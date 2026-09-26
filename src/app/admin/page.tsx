import Link from "next/link";
import Image from "next/image";
import { db } from "@/server/db";
import { Card, PageHeader, Pill, Stat, ORDER_TONE, inr, inrShort, when } from "@/components/admin/ui";
import { DailyBars, RankBars } from "@/components/admin/charts";
import { trafficBaseline } from "@/data/analytics";
import { getAdminSession } from "@/server/rbac";

export const metadata = { title: "Dashboard" };

const DAY = 86400000;

export default async function Dashboard() {
  const s = await getAdminSession();
  const now = new Date();
  const valid = db.orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const sum = (list: typeof valid) => list.reduce((n, o) => n + o.total, 0);
  const since = (d: Date) => valid.filter((o) => new Date(o.createdAt) >= d);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const last30 = since(new Date(now.getTime() - 30 * DAY));
  const prev30 = valid.filter((o) => { const t = new Date(o.createdAt).getTime(); return t < now.getTime() - 30 * DAY && t >= now.getTime() - 60 * DAY; });
  const rev30 = sum(last30), revPrev = sum(prev30);
  const aov = last30.length ? rev30 / last30.length : 0;
  const live = (name: string) => db.events.filter((e) => e.name === name).length;
  const views = trafficBaseline.reduce((n, d) => n + d.productViews, 0) + live("product_viewed");
  const sessions = trafficBaseline.reduce((n, d) => n + d.sessions, 0);
  const checkouts = trafficBaseline.reduce((n, d) => n + d.checkout, 0) + live("checkout_started");
  const conversion = (last30.length / sessions) * 100;
  const abandoned = Math.max(0, checkouts - last30.length);
  const returns = db.orders.filter((o) => o.status === "refunded").length / Math.max(1, db.orders.length) * 100;

  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(startToday.getTime() - (29 - i) * DAY);
    const e = new Date(d.getTime() + DAY);
    return { date: d.toISOString(), value: sum(valid.filter((o) => { const t = new Date(o.createdAt); return t >= d && t < e; })) };
  });

  const byProduct = new Map<string, { label: string; value: number; n: number }>();
  for (const o of last30) for (const it of o.items) {
    const r = byProduct.get(it.productId) ?? { label: it.name, value: 0, n: 0 };
    r.value += it.unitPrice * it.qty; r.n += it.qty;
    byProduct.set(it.productId, r);
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.value - a.value).slice(0, 6);
  const byCollection = db.collections.map((c) => ({ label: c.name, value: last30.reduce((n, o) => n + o.items.filter((it) => c.productIds.includes(it.productId)).reduce((m, it) => m + it.unitPrice * it.qty, 0), 0) })).sort((a, b) => b.value - a.value).slice(0, 5);
  const lowStock = db.products.flatMap((p) => p.variants.filter((v) => v.stock > 0 && v.stock <= 2 && p.status !== "made_to_order").map((v) => ({ p, v }))).slice(0, 6);
  const upcoming = db.appointments.filter((a) => a.date >= now.toISOString().slice(0, 10) && a.status !== "cancelled").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
  const aptConv = db.appointments.filter((a) => a.status === "completed").length / Math.max(1, db.appointments.filter((a) => a.date < now.toISOString().slice(0, 10)).length) * 100;
  const waOpen = db.enquiries.filter((e) => e.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <PageHeader kicker={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} title={`Good ${now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, ${s.name.split(" ")[0]}`} description="Commerce at a glance. Figures cover the last 30 days unless stated." actions={<Link href="/admin/orders" className="btn btn-outline btn-sm">All orders</Link>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Revenue today" value={inrShort(sum(since(startToday)))} sub={`${since(startToday).length} orders`} />
        <Stat label="Revenue MTD" value={inrShort(sum(since(startMonth)))} sub={`${since(startMonth).length} orders`} />
        <Stat label="Revenue YTD" value={inrShort(sum(since(startYear)))} sub="Demo history starts July" />
        <Stat label="Revenue, 30 days" value={inrShort(rev30)} trend={revPrev ? ((rev30 - revPrev) / revPrev) * 100 : undefined} sub="vs previous 30" />
        <Stat label="Orders, 30 days" value={String(last30.length)} sub={`AOV ${inrShort(aov)}`} />
        <Stat label="Conversion" value={`${conversion.toFixed(2)}%`} sub={`${sessions.toLocaleString("en-IN")} sessions`} />
        <Stat label="Abandoned checkouts" value={abandoned.toLocaleString("en-IN")} sub="Recoverable via WhatsApp" />
        <Stat label="Return rate" value={`${returns.toFixed(1)}%`} sub="Of all orders" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Daily revenue · last 30 days" className="xl:col-span-2"><DailyBars data={daily} format="inr" label="Daily revenue" /></Card>
        <Card title="Clienteling">
          <dl className="grid grid-cols-2 gap-5">
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Appointment → sale</dt><dd className="mt-1 font-display text-3xl">{aptConv.toFixed(0)}%</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Open enquiries</dt><dd className="mt-1 font-display text-3xl">{waOpen}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">WhatsApp clicks</dt><dd className="mt-1 font-display text-3xl">{(trafficBaseline.reduce((n, d) => n + d.whatsapp, 0) + live("whatsapp_clicked")).toLocaleString("en-IN")}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Product views</dt><dd className="mt-1 font-display text-3xl">{views.toLocaleString("en-IN")}</dd></div>
          </dl>
          <Link href="/admin/enquiries" className="link-line mt-6 inline-block text-[12px] text-muted">Open the enquiries inbox</Link>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Top products · revenue"><RankBars rows={topProducts.map((r) => ({ label: r.label, value: r.value, sub: `${r.n} sold` }))} format="inr" /></Card>
        <Card title="Top collections · revenue"><RankBars rows={byCollection} format="inr" /></Card>
        <Card title="Inventory warnings" action={<Link href="/admin/inventory?filter=low" className="text-[11px] text-muted hover:text-fg">View all</Link>}>
          {lowStock.length === 0 ? <p className="text-muted">No low-stock variants.</p> : (
            <ul className="divide-y divide-line">
              {lowStock.map(({ p, v }) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
                  <span className="min-w-0"><span className="block truncate">{p.name}</span><span className="text-muted">{v.sku}</span></span>
                  <Pill tone="warn">{v.stock} left</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Recent orders" className="xl:col-span-2" pad={false}>
          <ul className="divide-y divide-line">
            {db.orders.slice(0, 7).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-elevated">
                  <div className="relative h-10 w-10 shrink-0 stage"><Image src={o.items[0].image} alt="" fill sizes="40px" className="object-contain" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px]">{o.items[0].name}{o.items.length > 1 ? ` + ${o.items.length - 1}` : ""}</p><p className="text-[12px] text-muted">{o.number} · {when(o.createdAt)}</p></div>
                  <span className="hidden sm:inline"><Pill tone={ORDER_TONE[o.status]}>{o.status.replace(/_/g, " ")}</Pill></span>
                  <p className="shrink-0 text-right text-[13px] sm:w-24">{inr(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Upcoming appointments" action={<Link href="/admin/appointments" className="text-[11px] text-muted hover:text-fg">Calendar</Link>}>
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <li key={a.id} className="py-2.5 text-[12.5px]">
                <p className="flex justify-between"><span>{a.name}</span><span className="text-muted">{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {a.time}</span></p>
                <p className="text-muted capitalize">{a.service} · {db.stores.find((st) => st.id === a.storeId)?.name ?? "Video"}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
