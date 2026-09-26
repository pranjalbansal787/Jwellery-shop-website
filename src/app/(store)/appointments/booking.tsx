"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bookAppointment, getAvailability } from "@/server/actions/appointments";
import { IconCheck, IconCalendar } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import type { AppointmentService } from "@/lib/types";

const SERVICES: { id: AppointmentService; title: string; desc: string; duration: string }[] = [
  { id: "store", title: "Boutique appointment", desc: "View pieces in a private room", duration: "45 min" },
  { id: "video", title: "Video consultation", desc: "A guided viewing from wherever you are", duration: "30 min" },
  { id: "bridal", title: "Bridal consultation", desc: "Engagement, wedding and the full bridal set", duration: "90 min" },
  { id: "custom", title: "Custom design", desc: "Sketch a one-of-a-kind piece with our designers", duration: "60 min" },
  { id: "stylist", title: "Jewellery stylist", desc: "Build a considered collection around you", duration: "60 min" },
];

type Store = { id: string; name: string; city: string; address: string };

export function Booking({ stores, initialService, initialStore, product }: { stores: Store[]; initialService?: string; initialStore?: string; product: { slug: string; name: string; image: string } | null }) {
  const [service, setService] = useState<AppointmentService | null>(SERVICES.some((s) => s.id === initialService) ? (initialService as AppointmentService) : product ? "store" : null);
  const [storeId, setStoreId] = useState<string | null>(stores.find((s) => s.id === initialStore)?.id ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const needsStore = service !== null && service !== "video";
  const days = useMemo(() => {
    const out: { iso: string; d: Date }[] = [];
    const base = new Date();
    for (let i = 1; out.length < 14; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      out.push({ iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, d });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!date || (needsStore && !storeId)) return;
    setSlots(null);
    setTime(null);
    getAvailability(needsStore ? storeId : null, date).then(setSlots);
  }, [date, storeId, needsStore]);

  const ready = service && (!needsStore || storeId) && date && time && form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && /^[+\d][\d\s-]{7,16}$/.test(form.phone);

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await bookAppointment({ service: service!, storeId: needsStore ? storeId : null, date: date!, time: time!, ...form, notes: form.notes || undefined, productSlug: product?.slug });
      if (r.ok) { setDone(true); track("appointment_booked", { service: service!, store: storeId ?? "video" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else setError(r.error);
    });
  };

  if (done) {
    const s = SERVICES.find((x) => x.id === service)!;
    const st = stores.find((x) => x.id === storeId);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-16 max-w-2xl border border-line bg-surface p-8 md:p-12">
        <p className="flex items-center gap-2 kicker text-accent"><IconCheck size={14} /> Request received</p>
        <p className="display-lg mt-4">We look forward to seeing you, {form.name.split(" ")[0]}.</p>
        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-[14px]">
          <dt className="text-muted">Service</dt><dd>{s.title} · {s.duration}</dd>
          <dt className="text-muted">Where</dt><dd>{st ? `${st.name}, ${st.city}` : "Video call (link sent before the session)"}</dd>
          <dt className="text-muted">When</dt><dd>{new Date(date!).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} at {time}</dd>
          {product && (<><dt className="text-muted">Piece</dt><dd>{product.name}</dd></>)}
        </dl>
        <p className="mt-8 text-[13.5px] text-muted">An advisor will confirm by email and WhatsApp, and we’ll send a reminder the day before.</p>
        <Link href="/shop" className="btn btn-primary mt-8">Continue exploring</Link>
      </motion.div>
    );
  }

  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-12">
      <div className="space-y-12 lg:col-span-8">
        <Step n={1} title="Choose a service">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
            {SERVICES.map((s) => (
              <button key={s.id} role="radio" aria-checked={service === s.id} onClick={() => { setService(s.id); setDate(null); }} className={cn("border p-5 text-left transition-colors", service === s.id ? "border-fg bg-surface" : "border-line hover:border-line-strong")}>
                <p className="flex justify-between text-[15px]">{s.title}<span className="text-[12px] text-muted">{s.duration}</span></p>
                <p className="mt-1 text-[13px] text-muted">{s.desc}</p>
              </button>
            ))}
          </div>
        </Step>
        <AnimatePresence>
          {needsStore && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Step n={2} title="Choose a boutique">
                <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
                  {stores.map((s) => (
                    <button key={s.id} role="radio" aria-checked={storeId === s.id} onClick={() => setStoreId(s.id)} className={cn("border p-5 text-left", storeId === s.id ? "border-fg bg-surface" : "border-line hover:border-line-strong")}>
                      <p className="text-[15px]">{s.name}</p><p className="mt-1 text-[12.5px] text-muted">{s.city}</p>
                    </button>
                  ))}
                </div>
              </Step>
            </motion.div>
          )}
        </AnimatePresence>
        {service && (!needsStore || storeId) && (
          <Step n={needsStore ? 3 : 2} title="Date and time">
            <div className="scrollbar-none -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1" role="radiogroup" aria-label="Date">
              {days.map(({ iso, d }) => (
                <button key={iso} role="radio" aria-checked={date === iso} onClick={() => setDate(iso)} className={cn("flex w-16 shrink-0 flex-col items-center border py-3 transition-colors", date === iso ? "border-fg bg-fg text-bg" : "border-line hover:border-line-strong")}>
                  <span className="text-[10.5px] uppercase tracking-[0.14em] opacity-70">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                  <span className="font-display text-2xl">{d.getDate()}</span>
                  <span className="text-[10.5px] opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                </button>
              ))}
            </div>
            {date && (
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Time">
                {!slots ? [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-11" />) : slots.map((s) => (
                  <button key={s.time} role="radio" aria-checked={time === s.time} disabled={!s.available} onClick={() => setTime(s.time)} className={cn("h-11 border text-[13.5px]", time === s.time ? "border-fg bg-fg text-bg" : "border-line hover:border-line-strong", !s.available && "line-through opacity-35")}>{s.time}</button>
                ))}
              </div>
            )}
          </Step>
        )}
        {time && (
          <Step n={needsStore ? 4 : 3} title="Your details">
            <div className="grid gap-5 sm:grid-cols-2">
              {([["name", "Full name", "text", "name"], ["phone", "Mobile (WhatsApp)", "tel", "tel"], ["email", "Email", "email", "email"]] as const).map(([k, l, t, ac]) => (
                <label key={k} className={k === "email" ? "sm:col-span-2" : ""}><span className="text-[11.5px] uppercase tracking-[0.14em] text-muted">{l}</span><input type={t} autoComplete={ac} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="field" /></label>
              ))}
              <label className="sm:col-span-2"><span className="text-[11.5px] uppercase tracking-[0.14em] text-muted">Anything we should prepare? (optional)</span><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field resize-none" placeholder="Occasion, budget range, pieces you’d like to see" /></label>
            </div>
            {error && <p className="mt-4 text-[13px] text-[var(--danger)]" role="alert">{error}</p>}
            <button className="btn btn-primary mt-8" disabled={!ready || pending} onClick={submit}><IconCalendar size={16} /> {pending ? "Reserving…" : "Request appointment"}</button>
          </Step>
        )}
      </div>
      <aside className="lg:col-span-4">
        <div className="border border-line p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <p className="kicker text-muted">Your appointment</p>
          {product && (
            <div className="mt-5 flex items-center gap-4 border-b border-line pb-5">
              <div className="relative h-20 w-16 stage overflow-hidden"><Image src={product.image} alt="" fill sizes="64px" className="jewel-shot-sm" /></div>
              <div><p className="text-[12px] text-muted">To view</p><p className="font-display text-lg">{product.name}</p></div>
            </div>
          )}
          <dl className="mt-5 space-y-3 text-[13.5px]">
            <div className="flex justify-between gap-4"><dt className="text-muted">Service</dt><dd className="text-right">{SERVICES.find((s) => s.id === service)?.title ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Where</dt><dd className="text-right">{service === "video" ? "Video call" : stores.find((s) => s.id === storeId)?.name ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">When</dt><dd className="text-right">{date ? `${new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${time ? ` · ${time}` : ""}` : "—"}</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`apt-${n}`}>
      <h2 id={`apt-${n}`} className="flex items-baseline gap-4"><span className="font-display text-xl text-accent">0{n}</span><span className="display-sm">{title}</span></h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
