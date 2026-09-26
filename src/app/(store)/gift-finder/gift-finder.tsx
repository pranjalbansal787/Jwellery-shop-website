"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { findGifts, type GiftAnswers } from "@/server/actions/gifts";
import { ProductCard } from "@/components/product/product-card";
import type { CardProduct } from "@/lib/card";
import { track } from "@/lib/analytics";
import { IconArrowLeft } from "@/components/ui/icons";

const Q: { key: keyof GiftAnswers; q: string; options: [string, string][] }[] = [
  { key: "recipient", q: "Who is it for?", options: [["her", "For her"], ["him", "For him"], ["couple", "For a couple"], ["self", "For myself"]] },
  { key: "occasion", q: "What’s the occasion?", options: [["anniversary", "Anniversary"], ["birthday", "Birthday"], ["festive", "Diwali & festive"], ["wedding", "Wedding"], ["engagement", "Engagement"], ["just-because", "Just because"]] },
  { key: "budget", q: "What would you like to spend?", options: [["0-100000", "Under ₹1 lakh"], ["100000-200000", "₹1 – 2 lakh"], ["200000-400000", "₹2 – 4 lakh"], ["400000-", "Above ₹4 lakh"]] },
  { key: "style", q: "Which feels most like them?", options: [["classic", "Classic diamonds"], ["minimal", "Quiet and minimal"], ["colour", "A touch of colour"], ["statement", "A statement"]] },
  { key: "metal", q: "Any metal preference?", options: [["yellow", "Yellow gold"], ["white", "White gold"], ["rose", "Rose gold"], ["platinum", "Platinum"], ["any", "No preference"]] },
];

export function GiftFinder({ initialRecipient }: { initialRecipient?: string }) {
  const [answers, setAnswers] = useState<Partial<GiftAnswers>>(initialRecipient === "her" || initialRecipient === "him" ? { recipient: initialRecipient } : {});
  const [i, setI] = useState(initialRecipient === "her" || initialRecipient === "him" ? 1 : 0);
  const [results, setResults] = useState<(CardProduct & { metal: string })[] | null>(null);
  const [pending, start] = useTransition();

  const choose = (v: string) => {
    const next = { ...answers, [Q[i].key]: v } as Partial<GiftAnswers>;
    setAnswers(next);
    if (i < Q.length - 1) setI(i + 1);
    else start(async () => { const r = await findGifts(next as GiftAnswers); setResults(r); track("gift_finder_completed", { results: r.length }); });
  };
  const restart = () => { setAnswers({}); setI(0); setResults(null); };

  return (
    <div className="container-x py-12 md:py-20">
      <p className="kicker text-accent">Gift finder</p>
      {!results ? (
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex items-center justify-between text-[12px] text-muted">
            {i > 0 ? <button onClick={() => setI(i - 1)} className="flex items-center gap-2 link-line"><IconArrowLeft size={14} /> Back</button> : <span />}
            <span>{i + 1} / {Q.length}</span>
          </div>
          <div className="mt-3 h-px bg-line"><motion.div className="h-px bg-accent" animate={{ width: `${((i + (pending ? 1 : 0)) / Q.length) * 100}%` }} /></div>
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="display-xl mt-12">{Q[i].q}</h1>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {Q[i].options.map(([v, l]) => (
                  <button key={v} onClick={() => choose(v)} disabled={pending} aria-pressed={answers[Q[i].key] === v} className="group flex items-center justify-between border border-line p-6 text-left transition-colors hover:border-fg aria-pressed:border-fg">
                    <span className="font-display text-2xl">{l}</span>
                    <span className="text-muted transition-transform group-hover:translate-x-1">→</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          {pending && <p className="mt-8 text-muted" role="status">Curating a short list…</p>}
        </div>
      ) : (
        <div>
          <h1 className="display-xl mt-4">{results.length ? "A short list, chosen for them" : "Nothing quite fits"}</h1>
          <p className="lede mt-4 max-w-xl">{results.length ? "Selected from what’s available today. Every gift arrives in signature packaging with a handwritten card." : "Try a wider budget, or let an advisor suggest something made to order."}</p>
          <div className="mt-6 flex gap-3"><button onClick={restart} className="btn btn-outline btn-sm">Start again</button><Link href="/appointments?service=stylist" className="btn btn-outline btn-sm">Ask a stylist</Link></div>
          <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3">
            {results.map((p, k) => (
              <motion.li key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.08, duration: 0.6 }}>
                <ProductCard p={{ ...p, defaultMetal: p.metal as CardProduct["defaultMetal"] }} />
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
