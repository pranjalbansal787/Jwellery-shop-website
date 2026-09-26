"use client";
import Link from "next/link";
import { useState } from "react";
import { useBrand } from "@/components/providers/brand-provider";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { THEMES } from "@/lib/brand";

export function Footer() {
  const { brand, preview } = useBrand();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const cols = [
    { title: "Jewellery", links: [["Engagement rings", "/shop/engagement-rings"], ["Wedding bands", "/shop/wedding-bands"], ["Earrings", "/shop/earrings"], ["Necklaces", "/shop/necklaces"], ["Bracelets", "/shop/bracelets"], ["Men's", "/shop/mens-jewellery"]] },
    { title: "Services", links: [["Book an appointment", "/appointments"], ["Design your ring", "/configure"], ["Ring size guide", "/ring-size"], ["Gift finder", "/gift-finder"], ["Track an order", "/track"]] },
    { title: "The Maison", links: [["Boutiques", "/stores"], ["Collections", "/collections"], ["The 4Cs", "/education"], ["Care & hallmarking", "/education#care"]] },
  ];
  return (
    <footer className="border-t border-line bg-bg">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker text-accent">Private client list</p>
          <p className="mt-4 display-md max-w-md">First sight of new collections, and invitations to private viewings.</p>
          {done ? (
            <p className="mt-8 flex items-center gap-3 text-[14px]" role="status"><IconCheck className="text-accent" /> Thank you. You’ll hear from us only when there’s something worth seeing.</p>
          ) : (
            <form className="mt-8 flex max-w-md items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(email)) setDone(true); }}>
              <label className="flex-1">
                <span className="sr-only">Email address</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="field" autoComplete="email" />
              </label>
              <button className="flex h-12 w-12 items-center justify-center border border-line-strong hover:border-fg" aria-label="Subscribe"><IconArrow size={18} /></button>
            </form>
          )}
          <p className="mt-3 text-[11.5px] text-muted">We ask for consent separately for WhatsApp updates. Unsubscribe anytime.</p>
        </div>
        <nav className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7" aria-label="Footer">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="kicker text-muted">{c.title}</p>
              <ul className="mt-5 space-y-3 text-[13.5px]">
                {c.links.map(([l, h]) => <li key={h + l}><Link className="link-line" href={h}>{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-x flex flex-col gap-4 border-t border-line py-6 text-[11.5px] text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {brand.name}. {brand.phone} · {brand.email}</p>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <span>BIS hallmarked gold</span><span>Certified diamonds</span><span>Insured delivery</span>
          {preview && <Link href="?previewTheme=off" className="link-line text-accent">Previewing {THEMES[preview].label} · exit</Link>}
        </p>
      </div>
    </footer>
  );
}
