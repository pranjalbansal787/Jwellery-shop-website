import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getStore } from "@/server/repo/crm";
import { listProducts } from "@/server/repo/catalog";
import { productImage } from "@/lib/media";
import { JsonLd } from "@/lib/seo";
import { BRAND_COOKIE, parseBrand } from "@/lib/brand";
import { Breadcrumbs } from "@/components/plp/listing";
import { IconCalendar, IconWhatsApp, IconPin } from "@/components/ui/icons";
import { waLink } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getStore((await params).slug);
  return s ? { title: s.name, description: `${s.address}. ${s.services.join(", ")}.` } : {};
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getStore((await params).slug);
  if (!s) notFound();
  const brand = parseBrand((await cookies()).get(BRAND_COOKIE)?.value);
  const sample = (await listProducts()).find((p) => p.design === s.image);
  return (
    <div className="container-x py-10 md:py-14">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "JewelryStore", name: `${brand.name} ${s.name}`, address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.city, addressCountry: "IN" }, telephone: s.phone, geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng }, openingHours: s.hours.map((h) => `${h.days} ${h.time}`) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Boutiques", href: "/stores" }, { name: s.name, href: `/stores/${s.slug}` }]} />
      <div className="mt-10 grid gap-12 md:grid-cols-2">
        <div>
          <p className="kicker text-accent flex items-center gap-2"><IconPin size={14} /> {s.city}</p>
          <h1 className="display-xl mt-4">{s.name}</h1>
          <p className="lede mt-5">{s.address}</p>
          <dl className="mt-8 space-y-2 text-[14px]">
            {s.hours.map((h) => <div key={h.days} className="flex max-w-xs justify-between"><dt className="text-muted">{h.days}</dt><dd>{h.time}</dd></div>)}
            <div className="flex max-w-xs justify-between pt-2"><dt className="text-muted">Telephone</dt><dd><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="link-line">{s.phone}</a></dd></div>
          </dl>
          <p className="kicker mt-10 text-muted">Services</p>
          <ul className="mt-3 flex flex-wrap gap-2">{s.services.map((x) => <li key={x} className="chip">{x}</li>)}</ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/appointments?store=${s.id}&service=store`} className="btn btn-primary"><IconCalendar size={16} /> Book an appointment</Link>
            <a href={waLink(s.whatsapp, `Hello, I'd like to visit the ${s.name}.`)} target="_blank" rel="noopener" className="btn btn-outline"><IconWhatsApp size={16} /> WhatsApp the boutique</a>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noopener" className="btn btn-outline">Directions</a>
          </div>
        </div>
        <div className="relative aspect-square stage">{sample && <Image src={productImage(sample)} alt="" fill sizes="50vw" className="jewel-shot" />}</div>
      </div>
    </div>
  );
}
