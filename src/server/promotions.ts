import "server-only";
/** Promotions engine (MVP subset): coupon codes with thresholds, dates and scope. */
export interface Coupon { code: string; type: "percentage" | "fixed"; value: number; minOrder: number; startsAt: string; endsAt: string; description: string; usageLimit: number; used: number; active: boolean }

export const coupons: Coupon[] = [
  { code: "DIWALI26", type: "percentage", value: 5, minOrder: 100000, startsAt: "2026-09-15", endsAt: "2026-11-15", description: "5% off orders above ₹1,00,000", usageLimit: 500, used: 37, active: true },
  { code: "WELCOME", type: "fixed", value: 5000, minOrder: 50000, startsAt: "2026-01-01", endsAt: "2026-12-31", description: "₹5,000 off your first order above ₹50,000", usageLimit: 2000, used: 412, active: true },
];

export function applyCoupon(code: string | undefined, subtotal: number, now = new Date()): { discount: number; coupon: Coupon | null; error?: string } {
  if (!code) return { discount: 0, coupon: null };
  const c = coupons.find((x) => x.code === code.trim().toUpperCase());
  if (!c || !c.active) return { discount: 0, coupon: null, error: "This code isn’t valid." };
  const d = now.toISOString().slice(0, 10);
  if (d < c.startsAt || d > c.endsAt) return { discount: 0, coupon: null, error: "This code has expired." };
  if (c.used >= c.usageLimit) return { discount: 0, coupon: null, error: "This code is no longer available." };
  if (subtotal < c.minOrder) return { discount: 0, coupon: null, error: `Applies to orders above ₹${c.minOrder.toLocaleString("en-IN")}.` };
  const discount = c.type === "percentage" ? Math.round((subtotal * c.value) / 100) : c.value;
  return { discount: Math.min(discount, subtotal), coupon: c };
}
