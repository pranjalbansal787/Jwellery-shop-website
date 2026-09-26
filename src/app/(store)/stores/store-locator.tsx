"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Store } from "@/lib/types";
import { IconPin, IconWhatsApp, IconCalendar } from "@/components/ui/icons";
import { waLink } from "@/lib/whatsapp";

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function StoreLocator({ stores }: { stores: Store[] }) {
  const [q, setQ] = useState("");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [active, setActive] = useState(stores[0]?.id);
  const list = useMemo(() => {
    const f = stores.filter((s) => `${s.city} ${s.name} ${s.address}`.toLowerCase().includes(q.toLowerCase()));
    return me ? [...f].sort((a, b) => km(me, a) - km(me, b)) : f;
  }, [stores, q, me]);
  const current = stores.find((s) => s.id === active) ?? stores[0];
  const locate = () => {
    if (!navigator.geolocation) { setGeoMsg("Location isn’t available in this browser."); return; }
    setGeoMsg("Finding you…");
    navigator.geolocation.getCurrentPosition((p) => { setMe({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoMsg(null); }, () => setGeoMsg("We couldn’t access your location. Search by city instead."));
  };
  const bbox = `${current.lng - 0.02},${current.lat - 0.012},${current.lng + 0.02},${current.lat + 0.012}`;
  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="flex items-end gap-3">
          <label className="flex-1"><span className="sr-only">Search by city</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by city" className="field" /></label>
          <button onClick={locate} className="btn btn-outline btn-sm"><IconPin size={15} /> Near me</button>
        </div>
        {geoMsg && <p className="mt-2 text-[12.5px] text-muted" role="status">{geoMsg}</p>}
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {list.map((s) => (
            <li key={s.id}>
              <div className={`p-5 transition-colors ${active === s.id ? "bg-surface" : ""}`}>
                <button onClick={() => setActive(s.id)} className="w-full text-left">
                  <p className="flex justify-between gap-4"><span className="display-sm">{s.name}</span>{me && <span className="text-[12px] text-muted">{Math.round(km(me, s))} km</span>}</p>
                  <p className="mt-1 text-[13px] text-muted">{s.address}</p>
                  <p className="mt-2 text-[12.5px]">{s.hours.map((h) => `${h.days} ${h.time}`).join(" · ")}</p>
                </button>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/stores/${s.slug}`} className="chip !min-h-9">Details</Link>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noopener" className="chip !min-h-9">Directions</a>
                  <a href={waLink(s.whatsapp, `Hello, I'd like to visit the ${s.name}.`)} target="_blank" rel="noopener" className="chip !min-h-9"><IconWhatsApp size={13} /> WhatsApp</a>
                  <Link href={`/appointments?store=${s.id}&service=store`} className="chip !min-h-9"><IconCalendar size={13} /> Book</Link>
                </div>
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="p-5 text-muted">No boutique in “{q}” yet. A video consultation works anywhere in India.</li>}
        </ul>
      </div>
      <div className="lg:col-span-7">
        <div className="relative aspect-[4/3] overflow-hidden border border-line lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <iframe
            key={current.id}
            title={`Map of ${current.name}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${current.lat},${current.lng}`}
            className="h-full w-full grayscale-[0.9] invert-[0.88] hue-rotate-180 contrast-[0.9]"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
