/**
 * Ring size conversions derived from inner circumference (mm).
 * India ≈ circumference − 40 (common trade approximation); UK A = 37.8 mm, +1.25 mm per letter;
 * US from diameter = 11.63 + 0.8128 × size; EU = circumference in mm; Japan ≈ India scale.
 * Conversions are indicative; an advisor confirms before a sized piece is made.
 */
export interface SizeRow { india: number; circumference: number; diameter: number; uk: string; us: string; eu: number; jp: number }

const UK = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function fromCircumference(c: number): SizeRow {
  const d = c / Math.PI;
  const us = (d - 11.63) / 0.8128;
  const ukIdx = (c - 37.8) / 1.25;
  const base = Math.floor(ukIdx);
  const uk = base < 0 ? "A" : base >= UK.length ? "Z+" : `${UK[base]}${ukIdx - base >= 0.5 ? "½" : ""}`;
  return {
    india: Math.round(c - 40),
    circumference: Math.round(c * 10) / 10,
    diameter: Math.round(d * 10) / 10,
    uk,
    us: (Math.round(us * 4) / 4).toString(),
    eu: Math.round(c),
    jp: Math.max(1, Math.round(c - 40)),
  };
}

export const SIZE_TABLE: SizeRow[] = Array.from({ length: 17 }, (_, i) => fromCircumference(46 + i + 0.0)).map((r, i) => ({ ...r, india: 6 + i }));

export function indiaFromDiameter(dMm: number) {
  return fromCircumference(dMm * Math.PI).india;
}

export const RING_SIZES = ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"];
