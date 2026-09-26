import { CURRENCIES, type CurrencyCode } from "./brand";

/** All prices are stored in INR minor-free integers; display currency is a brand setting (demo FX). */
export function formatMoney(inr: number, currency: CurrencyCode = "INR") {
  const c = CURRENCIES[currency];
  const value = inr * c.perINR;
  const n = new Intl.NumberFormat(c.locale, { maximumFractionDigits: 0 }).format(Math.round(value));
  return `${c.symbol}${n}`;
}

export const GST_RATE = 0.03; // 3% GST on jewellery (inclusive pricing shown to customers)
