/**
 * Engagement ring configurator — pure pricing/ETA rules shared by client (live preview)
 * and server (authoritative re-pricing at checkout). Demo rules; production pulls
 * stone prices from the diamond inventory feed and metal prices from the daily rate table.
 */
import type { DesignKey, GemKey, GemShape, MetalKey } from "./jewels/builders";

export const SETTINGS = [
  { id: "solitaire", label: "Solitaire", desc: "Six claws, nothing else", base: 62000 },
  { id: "halo", label: "Halo", desc: "A frame of micro-pavé", base: 98000 },
  { id: "three-stone", label: "Three-stone", desc: "Past, present, future", base: 115000 },
] as const satisfies readonly { id: DesignKey; label: string; desc: string; base: number }[];

export const CFG_METALS: { id: MetalKey; factor: number }[] = [
  { id: "yellow", factor: 1 }, { id: "white", factor: 1.02 }, { id: "rose", factor: 1 }, { id: "platinum", factor: 1.35 },
];
export const CFG_STONES: { id: Exclude<GemKey, "none">; perCarat: number }[] = [
  { id: "diamond", perCarat: 520000 }, { id: "emerald", perCarat: 165000 }, { id: "sapphire", perCarat: 140000 }, { id: "ruby", perCarat: 185000 },
];
export const CFG_SHAPES: { id: GemShape; label: string; factor: number }[] = [
  { id: "round", label: "Round", factor: 1 }, { id: "oval", label: "Oval", factor: 0.94 }, { id: "pear", label: "Pear", factor: 0.9 }, { id: "cushion", label: "Cushion", factor: 0.88 }, { id: "emerald", label: "Emerald", factor: 0.86 },
];
export const CFG_CARATS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface RingConfig { setting: DesignKey; metal: MetalKey; stone: Exclude<GemKey, "none">; shape: GemShape; carat: number; size: string; engraving?: string }

export function priceConfig(c: RingConfig) {
  const s = SETTINGS.find((x) => x.id === c.setting) ?? SETTINGS[0];
  const m = CFG_METALS.find((x) => x.id === c.metal) ?? CFG_METALS[0];
  const st = CFG_STONES.find((x) => x.id === c.stone) ?? CFG_STONES[0];
  const sh = CFG_SHAPES.find((x) => x.id === c.shape) ?? CFG_SHAPES[0];
  // price per carat rises with size (rarity curve)
  const stone = st.perCarat * c.carat * (1 + Math.max(0, c.carat - 0.5) * 0.55) * sh.factor;
  return Math.round((s.base * m.factor + stone) / 500) * 500;
}

export function leadDaysConfig(c: RingConfig) {
  return 18 + (c.carat >= 1.5 ? 5 : 0) + (c.engraving ? 2 : 0);
}

export function encodeConfig(c: RingConfig) {
  return `cfg:${[c.setting, c.metal, c.stone, c.shape, c.carat, c.size].join("|")}`;
}

export function decodeConfig(id: string): RingConfig | null {
  if (!id.startsWith("cfg:")) return null;
  const [setting, metal, stone, shape, carat, size] = id.slice(4).split("|");
  const cfg = { setting, metal, stone, shape, carat: Number(carat), size } as RingConfig;
  if (!SETTINGS.some((s) => s.id === cfg.setting) || !CFG_METALS.some((m) => m.id === cfg.metal) || !CFG_STONES.some((s) => s.id === cfg.stone) || !CFG_SHAPES.some((s) => s.id === cfg.shape) || !CFG_CARATS.includes(cfg.carat)) return null;
  return cfg;
}

export function gemSizeFor(carat: number) {
  // visual radius scales with cube root of weight
  return Math.cbrt(carat) * 0.95;
}
