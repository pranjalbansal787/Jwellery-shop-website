import Link from "next/link";
import { listEnquiries } from "@/server/repo/crm";
import { Card, PageHeader, Pill, when } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { updateEnquiryAction } from "@/server/actions/admin";
import { db } from "@/server/db";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

export const metadata = { title: "Enquiries & WhatsApp" };

const TEMPLATES = [
  ["Availability confirmed", "Good news, the piece is available. Would you like us to reserve it for 48 hours or book a private viewing?"],
  ["Appointment options", "We’d love to host you. We have openings tomorrow at 13:00 and 16:00. Which suits you best?"],
  ["Custom quote follow-up", "Thank you for sharing your idea. Our designer will send sketches and an indicative quote within two working days."],
];

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const list = await listEnquiries();
  const cur = list.find((e) => e.id === id) ?? list[0];
  const product = cur?.productId ? db.products.find((p) => p.id === cur.productId) : null;
  const orders = cur ? db.orders.filter((o) => o.shippingAddress.name === cur.name) : [];
  return (
    <div className="space-y-6">
      <PageHeader kicker="Clients" title="Enquiries & WhatsApp" description="Conversations from WhatsApp, web and phone in one queue, with product and order context. Live messaging connects through the WhatsApp Cloud API adapter." />
      <div className="grid gap-0 border border-line bg-surface lg:grid-cols-[340px_1fr]">
        <ul className="divide-y divide-line border-b border-line lg:border-b-0 lg:border-r">
          {list.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/enquiries?id=${e.id}`} className={cn("block px-5 py-4 hover:bg-elevated", cur?.id === e.id && "bg-elevated")}>
                <p className="flex items-center justify-between gap-2"><span className="truncate">{e.name}</span>{e.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-on-accent">{e.unread}</span>}</p>
                <p className="truncate text-[12.5px] text-muted">{e.subject}</p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-muted"><span className="uppercase tracking-[0.12em]">{e.channel}</span> · {when(e.createdAt)} · {e.status}</p>
              </Link>
            </li>
          ))}
        </ul>
        {cur && (
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div><p className="text-[15px]">{cur.name}</p><p className="text-[12px] text-muted">{cur.phone} · via {cur.channel}</p></div>
              <div className="flex items-center gap-2">
                <Pill tone={cur.status === "resolved" ? "ok" : cur.status === "assigned" ? "accent" : "warn"}>{cur.status}</Pill>
                {cur.status !== "assigned" && cur.status !== "resolved" && <ActionButton action={async () => { "use server"; return updateEnquiryAction(cur.id, { status: "assigned", assignee: "Priya (Gurugram)" }); }} className="btn btn-outline btn-sm">Assign to me</ActionButton>}
                {cur.status !== "resolved" && <ActionButton action={async () => { "use server"; return updateEnquiryAction(cur.id, { status: "resolved" }); }} className="btn btn-primary btn-sm">Resolve</ActionButton>}
              </div>
            </div>
            <div className="grid flex-1 gap-6 p-6 xl:grid-cols-[1fr_280px]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{cur.subject}</p>
                <div className="mt-3 max-w-lg border border-line bg-bg p-4 text-[14px]">{cur.message}<p className="mt-2 text-right text-[11px] text-muted">{when(cur.createdAt)}</p></div>
                {cur.assignee && <p className="mt-3 text-[12px] text-muted">Assigned to {cur.assignee}</p>}
                <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-muted">Reply with a template</p>
                <div className="mt-3 grid gap-2">
                  {TEMPLATES.map(([t, body]) => (
                    <a key={t} href={waLink(cur.phone, `Hello ${cur.name.split(" ")[0]}, ${body}`)} target="_blank" rel="noopener" className="border border-line p-3 text-[13px] hover:border-fg">
                      <span className="block">{t}</span><span className="text-[12px] text-muted">{body}</span>
                    </a>
                  ))}
                </div>
                <p className="mt-3 text-[11.5px] text-muted">In the MVP replies open WhatsApp with the text prefilled. With the Cloud API connected they send from here and appear in the thread.</p>
              </div>
              <aside className="space-y-4">
                {product && <Card title="Related product"><Link href={`/admin/products/${product.id}`} className="link-line">{product.name}</Link><p className="text-[12px] text-muted">{product.sku}</p></Card>}
                <Card title="Orders">{orders.length ? orders.slice(0, 3).map((o) => <Link key={o.id} href={`/admin/orders/${o.id}`} className="block text-[13px] link-line">{o.number}</Link>) : <p className="text-[12.5px] text-muted">No orders on file.</p>}</Card>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
