import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { renderPath } from "@/lib/media";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Jewellery guide: the 4Cs, metals & care", description: "Understand diamond cut, colour, clarity and carat, precious metals, hallmarking, gemstones and care." };

const FOUR_C = [
  { t: "Cut", d: "How well a diamond returns light. It is the only C shaped by human hands, and the one that matters most to sparkle. We set only Excellent and Very Good cuts.", scale: ["Excellent", "Very Good", "Good", "Fair"] },
  { t: "Colour", d: "Graded D (colourless) to Z. The difference between neighbouring grades is invisible to most eyes once set. We select D to H.", scale: ["D", "E", "F", "G", "H"] },
  { t: "Clarity", d: "The presence of tiny natural inclusions, graded under 10× magnification. VS stones look flawless to the naked eye.", scale: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2"] },
  { t: "Carat", d: "Weight, not size: one carat is 0.2 grams. Price rises faster than weight because larger rough is rarer.", scale: ["0.50", "0.75", "1.00", "1.50", "2.00"] },
];

export default function EducationPage() {
  return (
    <div>
      <section className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="kicker text-accent">The jewellery guide</p>
          <h1 className="display-2xl mt-5">Know what you’re choosing</h1>
          <p className="lede mt-6 max-w-md">Diamonds, metals, hallmarks and care, explained plainly. Every certified stone we sell comes with its grading report.</p>
          <nav className="mt-8 flex flex-wrap gap-2 text-[13px]" aria-label="Guide sections">
            {[["#four-cs", "The 4Cs"], ["#metals", "Metals"], ["#hallmarking", "Hallmarking"], ["#gemstones", "Gemstones"], ["#care", "Care"]].map(([h, l]) => <a key={h} href={h} className="chip">{l}</a>)}
          </nav>
        </div>
        <div className="relative aspect-square stage"><Image src={renderPath("odette-emerald-cut-ring", "platinum", "diamond", "detail")} alt="Emerald-cut diamond in a four-claw setting" fill preload sizes="50vw" className="object-contain p-10" /></div>
      </section>
      <section id="four-cs" className="border-t border-line">
        <div className="container-x py-16 md:py-24">
          <p className="kicker text-accent">Diamonds</p>
          <h2 className="display-lg mt-4">The 4Cs</h2>
          <div className="mt-12 grid gap-px bg-line md:grid-cols-2">
            {FOUR_C.map((c, i) => (
              <Reveal key={c.t} delay={i * 0.05} className="bg-bg p-8 md:p-10">
                <p className="font-display text-5xl text-accent">{c.t}</p>
                <p className="mt-4 text-muted">{c.d}</p>
                <div className="mt-6 flex flex-wrap gap-1.5">{c.scale.map((s) => <span key={s} className="border border-line px-2.5 py-1 text-[12px]">{s}</span>)}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section id="metals" className="border-t border-line bg-surface">
        <div className="container-x grid gap-10 py-16 md:grid-cols-4 md:py-24">
          <h2 className="display-lg md:col-span-4">Precious metals</h2>
          {[["Yellow gold", "yellow", "Warm and traditional. 22K is richest in colour; 18K is harder-wearing for set stones."], ["White gold", "white", "Gold alloyed with white metals and rhodium-finished. Re-plating every few years keeps it bright."], ["Rose gold", "rose", "Copper gives the blush. Durable, and flattering on most skin tones."], ["Platinum", "platinum", "95% pure, naturally white and dense. It never fades and holds stones exceptionally securely."]].map(([t, m, d]) => (
            <div key={t}>
              <div className="relative aspect-square stage"><Image src={renderPath("eterna-court-band", m as "yellow", "none")} alt={`${t} band`} fill sizes="25vw" className="object-contain p-6" /></div>
              <p className="display-sm mt-4">{t}</p>
              <p className="mt-2 text-[13.5px] text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="hallmarking" className="container-x grid gap-10 py-16 md:grid-cols-2 md:py-24">
        <h2 className="display-lg">Hallmarking & certification</h2>
        <div className="space-y-4 text-muted">
          <p>All gold jewellery sold in India must carry a BIS hallmark with a six-digit HUID. You can verify it on the BIS CARE app in seconds.</p>
          <p>Diamonds above 0.30 ct are accompanied by a GIA or IGI grading report. The report number is laser-inscribed on the girdle of many stones and listed on your invoice.</p>
        </div>
      </section>
      <section id="gemstones" className="border-t border-line">
        <div className="container-x grid gap-8 py-16 md:grid-cols-3 md:py-24">
          <h2 className="display-lg md:col-span-3">Coloured gemstones</h2>
          {[["Emerald", "verdance-emerald-cocktail", "yellow", "emerald", "Soft by nature, with inclusions called jardin. Most emeralds are oiled to improve clarity, and we always disclose it."], ["Ruby", "maharani-ruby-cocktail", "yellow", "ruby", "The most prized show a pure, glowing red. Second only to diamond in hardness, ideal for daily wear."], ["Sapphire", "nocturne-sapphire-cocktail", "white", "sapphire", "Velvety blue, equally hard as ruby. Heat treatment is common and stable; untreated stones carry a premium."]].map(([t, slug, m, g, d]) => (
            <div key={t}>
              <div className="relative aspect-[4/3] stage"><Image src={renderPath(slug, m as "yellow", g as "ruby")} alt={t} fill sizes="33vw" className="object-contain p-6" /></div>
              <p className="display-sm mt-4">{t}</p>
              <p className="mt-2 text-[13.5px] text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="care" className="border-t border-line bg-surface">
        <div className="container-x grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div><h2 className="display-lg">Care</h2><p className="lede mt-4">A little attention keeps a piece brilliant for generations.</p><Link href="/appointments?service=store" className="btn btn-outline mt-8">Book complimentary cleaning</Link></div>
          <ul className="space-y-4 text-[14px]">
            {["Put jewellery on last, after perfume and lotions.", "Remove before swimming, the gym or gardening.", "Store pieces separately so harder stones can’t scratch softer metal.", "Clean with warm water, mild soap and a soft brush; dry with a lint-free cloth.", "Have claws checked once a year at any boutique."].map((t) => <li key={t} className="border-b border-line pb-4">{t}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
