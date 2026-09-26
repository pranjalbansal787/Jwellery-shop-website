/** DEMO traffic baseline (last 30 days) so analytics read realistically before live events accumulate. */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const NOW = new Date("2026-09-26T10:00:00+05:30").getTime();

export const trafficBaseline = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(NOW - (29 - i) * 86400000);
  const weekend = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1;
  const festive = i > 20 ? 1.2 : 1; // pre-Diwali lift
  const sessions = Math.round((180 + rnd() * 60) * weekend * festive);
  const productViews = Math.round(sessions * (2.1 + rnd() * 0.3));
  const addToCart = Math.round(productViews * (0.045 + rnd() * 0.01));
  const checkout = Math.round(addToCart * (0.42 + rnd() * 0.08));
  return { date: d.toISOString().slice(0, 10), sessions, productViews, addToCart, checkout, wishlist: Math.round(productViews * 0.06), whatsapp: Math.round(sessions * 0.035), tryOn: Math.round(productViews * 0.012), viewer3d: Math.round(productViews * 0.05) };
});

export const searchBaseline: { q: string; n: number; results: number }[] = [
  { q: "solitaire ring", n: 412, results: 6 }, { q: "diamond earrings", n: 355, results: 9 }, { q: "tennis bracelet", n: 241, results: 3 },
  { q: "gold kada", n: 198, results: 1 }, { q: "emerald necklace", n: 176, results: 4 }, { q: "anniversary gift", n: 150, results: 12 },
  { q: "nose pin", n: 96, results: 0 }, { q: "mangalsutra", n: 88, results: 0 }, { q: "men's chain", n: 61, results: 0 }, { q: "pearl earrings", n: 57, results: 0 },
];
