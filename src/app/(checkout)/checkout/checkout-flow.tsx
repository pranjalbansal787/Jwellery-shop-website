"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCart, cartSubtotal } from "@/stores/cart";
import { useHydrated } from "@/lib/hooks";
import { useMoney } from "@/components/providers/brand-provider";
import { placeOrder, quoteCoupon, type CheckoutInput } from "@/server/actions/checkout";
import { METAL_LABEL, GEM_LABEL, deliveryEstimate } from "@/lib/labels";
import { IconCheck, IconGift, IconShield } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

type Step = 1 | 2 | 3;
const METHODS: { id: CheckoutInput["method"]; label: string; note: string }[] = [
  { id: "upi", label: "UPI", note: "Google Pay, PhonePe, Paytm or any UPI app" },
  { id: "card", label: "Credit or debit card", note: "Visa, Mastercard, RuPay, Amex · 3-D Secure" },
  { id: "netbanking", label: "Net banking", note: "All major Indian banks" },
  { id: "emi", label: "EMI", note: "3 to 24 months on eligible cards" },
  { id: "payment_link", label: "Payment link", note: "We’ll send a secure link on WhatsApp" },
];

export function CheckoutFlow({ stores }: { stores: { id: string; name: string; city: string; address: string }[] }) {
  const hydrated = useHydrated();
  const { lines, giftWrap, giftMessage, clear } = useCart();
  const money = useMoney();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ email: "", phone: "", consent: true, fulfilment: "delivery" as "delivery" | "pickup", storeId: stores[0]?.id ?? "", name: "", line1: "", line2: "", city: "", state: "", pincode: "", method: "upi" as CheckoutInput["method"] });
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState<{ amount: number; code: string; description: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const cartKey = lines.map((l) => `${l.key}:${l.qty}`).join("|");
  useEffect(() => { if (hydrated && lines.length) track("checkout_started", { items: lines.length, value: cartSubtotal(lines) }); }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!discount?.code) return;
    const code = discount.code;
    const next = lines.map((l) => ({ variantId: l.variantId, qty: l.qty, size: l.size, engraving: l.engraving, image: l.variantId.startsWith("cfg:") ? l.image : undefined }));
    let cancelled = false;
    (async () => {
      const r = await quoteCoupon(code, next);
      if (cancelled) return;
      if (r.ok) setDiscount({ amount: r.discount, code, description: r.description });
      else { setDiscount(null); setCouponMsg(r.error); }
    })();
    return () => { cancelled = true; };
    // Re-quote only when the bag changes, not when the quote itself updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  if (!hydrated) return <div className="container-x py-24"><div className="skeleton h-96 w-full" /></div>;
  if (lines.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="display-lg">Your bag is empty</p>
        <p className="mt-3 text-muted">Add a piece to begin checkout.</p>
        <Link href="/shop" className="btn btn-primary mt-8">Explore jewellery</Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const total = subtotal - (discount?.amount ?? 0);
  const payload = lines.map((l) => ({ variantId: l.variantId, qty: l.qty, size: l.size, engraving: l.engraving, image: l.variantId.startsWith("cfg:") ? l.image : undefined }));
  const contactOk = /\S+@\S+\.\S+/.test(f.email) && /^[+\d][\d\s-]{7,16}$/.test(f.phone);
  const deliveryOk = f.name.trim().length > 1 && (f.fulfilment === "pickup" ? !!f.storeId : f.line1.trim() && f.city.trim() && f.state.trim() && /^\d{6}$/.test(f.pincode));
  const methods = f.fulfilment === "pickup" ? [...METHODS, { id: "store" as const, label: "Pay at the boutique", note: "Settle when you collect your piece" }] : METHODS;
  const maxLead = Math.max(...lines.map((l) => l.leadDays));

  const applyCode = () => {
    setCouponMsg(null);
    start(async () => {
      const r = await quoteCoupon(coupon, payload);
      if (r.ok) { setDiscount({ amount: r.discount, code: coupon.toUpperCase(), description: r.description }); setCouponMsg(null); }
      else { setDiscount(null); setCouponMsg(r.error); }
    });
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await placeOrder({
        email: f.email, phone: f.phone, fulfilment: f.fulfilment, storeId: f.fulfilment === "pickup" ? f.storeId : undefined,
        address: { name: f.name, line1: f.line1, line2: f.line2 || undefined, city: f.city, state: f.state, pincode: f.pincode },
        method: f.method, coupon: discount?.code, gift: { wrap: giftWrap, message: giftMessage || undefined }, lines: payload,
      });
      if (r.ok) {
        track("purchase_completed", { value: total, number: r.number });
        clear();
        router.push(`/order/${r.number}?new=1`);
      } else setError(r.error);
    });
  };

  return (
    <div className="container-x grid gap-12 py-10 lg:grid-cols-12 lg:gap-16 lg:py-16">
      <div className="lg:col-span-7">
        <h1 className="display-lg">Checkout</h1>
        <ol className="mt-6 flex gap-6 text-[11.5px] uppercase tracking-[0.18em]" aria-label="Checkout steps">
          {["Contact", "Delivery", "Payment"].map((s, i) => (
            <li key={s} className={cn("flex items-center gap-2", step === i + 1 ? "text-fg" : "text-muted")} aria-current={step === i + 1 ? "step" : undefined}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[10px]", step > i + 1 ? "border-accent bg-accent text-on-accent" : step === i + 1 ? "border-fg" : "border-line-strong")}>{step > i + 1 ? <IconCheck size={11} /> : i + 1}</span>{s}
            </li>
          ))}
        </ol>

        <Section n={1} title="Contact" step={step} summary={`${f.email} · ${f.phone}`} onEdit={() => setStep(1)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={(v) => set("email", v)} />
            <Field label="Mobile (for delivery & WhatsApp updates)" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(v) => set("phone", v)} placeholder="+91" />
          </div>
          <label className="mt-5 flex items-start gap-3 text-[13px] text-muted"><input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 accent-[var(--accent)]" /> Send me order updates on WhatsApp. (Marketing messages are opt-in separately.)</label>
          <p className="mt-4 text-[12.5px] text-muted">Checking out as a guest. You can create an account after your order to track it and save certificates.</p>
          <button className="btn btn-primary mt-6" disabled={!contactOk} onClick={() => setStep(2)}>Continue to delivery</button>
        </Section>

        <Section n={2} title="Delivery" step={step} summary={f.fulfilment === "pickup" ? `Pickup · ${stores.find((s) => s.id === f.storeId)?.name}` : `${f.name}, ${f.line1}, ${f.city} ${f.pincode}`} onEdit={() => setStep(2)}>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Fulfilment">
            {([["delivery", "Insured home delivery", `Complimentary · by ${deliveryEstimate(maxLead)}`], ["pickup", "Collect from a boutique", "Try it on before you take it home"]] as const).map(([id, t, d]) => (
              <button key={id} role="radio" aria-checked={f.fulfilment === id} onClick={() => { set("fulfilment", id); if (id === "delivery" && f.method === "store") set("method", "upi"); }} className={cn("border p-4 text-left transition-colors", f.fulfilment === id ? "border-fg" : "border-line hover:border-line-strong")}>
                <p className="text-[14px]">{t}</p><p className="mt-1 text-[12.5px] text-muted">{d}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" autoComplete="name" value={f.name} onChange={(v) => set("name", v)} className="sm:col-span-2" />
            {f.fulfilment === "delivery" ? (
              <>
                <Field label="Address" autoComplete="address-line1" value={f.line1} onChange={(v) => set("line1", v)} className="sm:col-span-2" />
                <Field label="Apartment, landmark (optional)" autoComplete="address-line2" value={f.line2} onChange={(v) => set("line2", v)} className="sm:col-span-2" />
                <Field label="PIN code" inputMode="numeric" autoComplete="postal-code" value={f.pincode} onChange={(v) => set("pincode", v.replace(/\D/g, "").slice(0, 6))} />
                <Field label="City" autoComplete="address-level2" value={f.city} onChange={(v) => set("city", v)} />
                <Field label="State" autoComplete="address-level1" value={f.state} onChange={(v) => set("state", v)} className="sm:col-span-2" />
              </>
            ) : (
              <div className="grid gap-2 sm:col-span-2" role="radiogroup" aria-label="Boutique">
                {stores.map((s) => (
                  <button key={s.id} role="radio" aria-checked={f.storeId === s.id} onClick={() => set("storeId", s.id)} className={cn("border p-4 text-left", f.storeId === s.id ? "border-fg" : "border-line")}>
                    <p className="text-[14px]">{s.name}</p><p className="text-[12.5px] text-muted">{s.address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary mt-6" disabled={!deliveryOk} onClick={() => setStep(3)}>Continue to payment</button>
        </Section>

        <Section n={3} title="Payment" step={step} onEdit={() => setStep(3)}>
          <div className="divide-y divide-line border border-line" role="radiogroup" aria-label="Payment method">
            {methods.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-4 p-4">
                <input type="radio" name="method" checked={f.method === m.id} onChange={() => set("method", m.id)} className="accent-[var(--accent)]" />
                <span className="flex-1"><span className="block text-[14px]">{m.label}</span><span className="text-[12.5px] text-muted">{m.note}</span></span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted">Cash on delivery isn’t offered for fine jewellery, for your security. You’ll complete payment on the provider’s secure page; we never see or store card details.</p>
          <p className="mt-2 border-l border-accent pl-3 text-[12px] text-muted">Demo mode: payments are simulated and no money moves.</p>
          {error && <p className="mt-5 border border-[var(--danger)] p-4 text-[13.5px]" role="alert">{error}</p>}
          <button className="btn btn-primary mt-6 w-full sm:w-auto" disabled={pending} onClick={submit}>
            {pending ? "Confirming securely…" : `Pay ${money(total)}`}
          </button>
        </Section>
      </div>

      <aside className="lg:col-span-5">
        <div className="border border-line bg-surface p-6 lg:sticky lg:top-8">
          <p className="kicker">Order summary</p>
          <ul className="mt-5 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 stage overflow-hidden"><Image src={l.image} alt="" fill sizes="64px" className="jewel-shot-sm" /><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-fg text-[10px] text-bg">{l.qty}</span></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]">{l.name}</p>
                  <p className="text-[12px] text-muted">{l.purity} {METAL_LABEL[l.metal]}{l.gem !== "none" ? ` · ${GEM_LABEL[l.gem]}` : ""}{l.size ? ` · Size ${l.size}` : ""}</p>
                  {l.engraving && <p className="text-[12px] text-muted">“{l.engraving}”</p>}
                </div>
                <p className="text-[13.5px]">{money(l.unitPrice * l.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Gift card or promo code" className="field-box" aria-label="Promo code" />
            <button onClick={applyCode} disabled={!coupon || pending} className="btn btn-outline btn-sm shrink-0">Apply</button>
          </div>
          <AnimatePresence>{couponMsg && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[12.5px] text-[var(--danger)]">{couponMsg}</motion.p>}</AnimatePresence>
          {discount && <p className="mt-2 flex items-center gap-2 text-[12.5px] text-muted"><IconCheck size={14} className="text-accent" /> {discount.code}: {discount.description}</p>}
          <dl className="mt-6 space-y-2.5 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(subtotal)}</dd></div>
            {discount && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>−{money(discount.amount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Insured delivery</dt><dd>Complimentary</dd></div>
            {giftWrap && <div className="flex justify-between"><dt className="flex items-center gap-1.5 text-muted"><IconGift size={14} /> Gift packaging</dt><dd>Included</dd></div>}
            <div className="flex justify-between border-t border-line pt-4 text-[15px]"><dt>Total</dt><dd className="font-display text-2xl">{money(total)}</dd></div>
            <p className="text-[11.5px] text-muted">Includes {money(Math.round(total - total / 1.03))} GST (3%)</p>
          </dl>
          <p className="mt-6 flex items-center gap-2 text-[12px] text-muted"><IconShield size={15} className="text-accent" /> Encrypted payment · Insured until signed for · 15-day returns</p>
        </div>
      </aside>
    </div>
  );
}

function Section({ n, title, step, summary, onEdit, children }: { n: Step; title: string; step: Step; summary?: string; onEdit: () => void; children: React.ReactNode }) {
  const done = step > n;
  return (
    <section className="mt-8 border-t border-line pt-8" aria-labelledby={`step-${n}`}>
      <div className="flex items-baseline justify-between">
        <h2 id={`step-${n}`} className={cn("display-sm", step < n && "text-muted")}>{n}. {title}</h2>
        {done && <button onClick={onEdit} className="link-line text-[12px] text-muted">Edit</button>}
      </div>
      {done && summary && <p className="mt-2 text-[13.5px] text-muted">{summary}</p>}
      <AnimatePresence initial={false}>
        {step === n && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="pt-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Field({ label, value, onChange, className, ...rest }: { label: string; value: string; onChange: (v: string) => void; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11.5px] uppercase tracking-[0.14em] text-muted">{label}</span>
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="field" />
    </label>
  );
}
