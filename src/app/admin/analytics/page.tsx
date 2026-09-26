import { db } from "@/server/db";
import { trafficBaseline, searchBaseline } from "@/data/analytics";
import { Card, PageHeader, Stat, Table, Td, Pill, when } from "@/components/admin/ui";
import { DailyBars, Funnel, RankBars } from "@/components/admin/charts";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const live = (n: string) => db.events.filter((e) => e.name === n).length;
  const t = (k: keyof (typeof trafficBaseline)[number]) => trafficBaseline.reduce((s, d) => s + (d[k] as number), 0);
  const purchases = db.orders.filter((o) => Date.now() - new Date(o.createdAt).getTime() < 30 * 86400000 && o.status !== "cancelled").length;
  const funnel = [
    { label: "Sessions", value: t("sessions") },
    { label: "Product views", value: t("productViews") + live("product_viewed") },
    { label: "Add to bag", value: t("addToCart") + live("cart_added") },
    { label: "Checkout started", value: t("checkout") + live("checkout_started") },
    { label: "Purchases", value: purchases },
  ];
  const liveSearches = db.searches.reduce<Record<string, { n: number; results: number }>>((m, s) => { const k = s.q.toLowerCase(); m[k] = { n: (m[k]?.n ?? 0) + 1, results: s.results }; return m; }, {});
  const searches = [...Object.entries(liveSearches).map(([q, v]) => ({ q, ...v, live: true })), ...searchBaseline.map((s) => ({ ...s, live: false }))].sort((a, b) => b.n - a.n);
  const engagement = [
    { label: "Wishlist adds", value: t("wishlist") + live("wishlist_added") },
    { label: "3D viewer opens", value: t("viewer3d") + live("viewer_3d_opened") },
    { label: "WhatsApp clicks", value: t("whatsapp") + live("whatsapp_clicked") },
    { label: "Try-on sessions", value: t("tryOn") + live("try_on_started") },
    { label: "Appointments booked", value: db.appointments.length + live("appointment_booked") },
  ];
  return (
    <div className="space-y-6">
      <PageHeader kicker="Growth" title="Analytics" description="First-party events (product_viewed, cart_added, try_on_started, whatsapp_clicked…) combined with a 30-day demo baseline. The same event bus forwards to GA4 and Meta Pixel adapters when configured." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Sessions · 30d" value={t("sessions").toLocaleString("en-IN")} />
        <Stat label="Conversion" value={`${((purchases / t("sessions")) * 100).toFixed(2)}%`} />
        <Stat label="Live events this session" value={String(db.events.length)} sub="Recorded by /api/events" />
        <Stat label="No-result searches" value={String(searches.filter((s) => s.results === 0).length)} sub="Merchandising opportunities" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Purchase funnel · 30 days"><Funnel steps={funnel} /></Card>
        <Card title="Engagement · 30 days"><RankBars rows={engagement} format="number" /></Card>
      </div>
      <Card title="Product views per day"><DailyBars data={trafficBaseline.map((d) => ({ date: d.date, value: d.productViews }))} format="number" label="Product views per day" /></Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Search terms" pad={false}>
          <Table head={["Query", "Searches", "Results"]}>
            {searches.slice(0, 12).map((s) => <tr key={s.q}><Td>{s.q}{s.live && <span className="ml-2 text-[10px] uppercase text-accent">live</span>}</Td><Td>{s.n}</Td><Td>{s.results === 0 ? <Pill tone="danger">No results</Pill> : s.results}</Td></tr>)}
          </Table>
        </Card>
        <Card title="Latest live events" pad={false}>
          {db.events.length === 0 ? <p className="p-5 text-[13px] text-muted">Browse the storefront in another tab. Events appear here as they happen.</p> : (
            <ul className="divide-y divide-line">{db.events.slice(0, 14).map((e, i) => <li key={i} className="flex justify-between gap-4 px-5 py-2.5 text-[12.5px]"><span className="font-mono text-[12px]">{e.name}</span><span className="truncate text-muted">{Object.values(e.props).filter(Boolean).slice(0, 2).join(" · ")}</span><span className="shrink-0 text-muted">{when(e.at)}</span></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
