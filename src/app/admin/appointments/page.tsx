import { listAppointments } from "@/server/repo/crm";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { updateAppointment } from "@/server/actions/admin";
import { db } from "@/server/db";

export const metadata = { title: "Appointments" };
const TONE = { requested: "warn", confirmed: "accent", completed: "ok", no_show: "danger", cancelled: "muted" } as const;

export default async function AppointmentsAdmin() {
  const all = await listAppointments();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter((a) => a.date >= today);
  const past = all.filter((a) => a.date < today).reverse();
  const days = [...new Set(upcoming.map((a) => a.date))];
  return (
    <div className="space-y-6">
      <PageHeader kicker="Clients" title="Appointments" description="Requests from the storefront arrive as ‘requested’. Confirming sends email + WhatsApp confirmations and schedules a reminder (queued jobs)." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {days.map((d) => (
            <Card key={d} title={new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} pad={false}>
              <ul className="divide-y divide-line">
                {upcoming.filter((a) => a.date === d).map((a) => (
                  <li key={a.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p><span className="font-display text-lg">{a.time}</span> · {a.name} <span className="text-muted capitalize">· {a.service}</span></p>
                      <p className="text-[12.5px] text-muted">{db.stores.find((s) => s.id === a.storeId)?.name ?? "Video consultation"} · {a.phone}{a.productId ? ` · ${db.products.find((p) => p.id === a.productId)?.name}` : ""}</p>
                      {a.notes && <p className="mt-1 text-[12.5px] text-muted">“{a.notes}”</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={TONE[a.status]}>{a.status.replace("_", " ")}</Pill>
                      {a.status === "requested" && <ActionButton action={async () => { "use server"; return updateAppointment(a.id, "confirmed"); }} className="btn btn-primary btn-sm">Confirm</ActionButton>}
                      {a.status !== "cancelled" && <ActionButton action={async () => { "use server"; return updateAppointment(a.id, "cancelled"); }} className="btn btn-outline btn-sm">Cancel</ActionButton>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <Card title="Recent outcomes">
          <ul className="divide-y divide-line text-[13px]">
            {past.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                <span>{a.name}<span className="block text-[12px] text-muted capitalize">{a.service} · {a.date}</span></span>
                <span className="flex items-center gap-2">
                  <Pill tone={TONE[a.status]}>{a.status.replace("_", " ")}</Pill>
                  {a.status === "confirmed" && <ActionButton action={async () => { "use server"; return updateAppointment(a.id, "completed"); }} className="text-[11px] uppercase text-accent">Done</ActionButton>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
