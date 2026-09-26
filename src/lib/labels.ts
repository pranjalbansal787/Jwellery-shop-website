import type { GemKey, MetalKey, Purity, StockStatus } from "./types";

export const METAL_LABEL: Record<MetalKey, string> = { yellow: "Yellow Gold", white: "White Gold", rose: "Rose Gold", platinum: "Platinum" };
export const METAL_SWATCH: Record<MetalKey, string> = { yellow: "linear-gradient(135deg,#f3dca2,#c9a157 55%,#8f6a2c)", white: "linear-gradient(135deg,#fbfbfa,#d4d4d2 55%,#9d9d9b)", rose: "linear-gradient(135deg,#f6d2c1,#d59a82 55%,#9e6450)", platinum: "linear-gradient(135deg,#f1f2f4,#c3c6ca 55%,#8c9095)" };
export const GEM_LABEL: Record<GemKey, string> = { diamond: "Diamond", emerald: "Emerald", ruby: "Ruby", sapphire: "Sapphire", none: "No stone" };
export const GEM_SWATCH: Record<GemKey, string> = { diamond: "radial-gradient(circle at 35% 30%,#fff,#dfe6ea 45%,#9aa6ad)", emerald: "radial-gradient(circle at 35% 30%,#8fe0b5,#1e9a5e 50%,#0b4a2c)", ruby: "radial-gradient(circle at 35% 30%,#ff8fa5,#c01235 50%,#5c0619)", sapphire: "radial-gradient(circle at 35% 30%,#9db3ff,#2446b8 50%,#0e1d5c)", none: "transparent" };
export const PURITY_LABEL: Record<Purity, string> = { "14K": "14K", "18K": "18K", "22K": "22K", PT950: "PT950" };
export const STOCK_LABEL: Record<StockStatus, string> = { in_stock: "In stock", low_stock: "Only a few remaining", made_to_order: "Made to order", preorder: "Pre-order", out_of_stock: "Currently unavailable", discontinued: "Discontinued" };

export function deliveryEstimate(leadDays: number, from = new Date()) {
  const d = new Date(from);
  let added = 0;
  while (added < leadDays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
