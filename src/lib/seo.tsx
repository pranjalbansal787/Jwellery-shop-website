import type { Brand } from "./brand";
import type { Product, Store } from "./types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function JsonLd({ data }: { data: unknown }) {
  // JSON.stringify output is escaped for "<" to prevent script injection via content.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function organizationLd(brand: Brand, stores: Store[]) {
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: brand.name,
    url: SITE,
    telephone: brand.phone,
    email: brand.email,
    department: stores.map((s) => ({
      "@type": "JewelryStore",
      name: `${brand.name} ${s.name}`,
      address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.city, addressCountry: "IN" },
      geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
      telephone: s.phone,
    })),
  };
}

export function productLd(p: Product, brand: Brand, image: string) {
  const prices = p.variants.map((v) => v.price);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    description: p.description,
    image: [`${SITE}${image}`],
    brand: { "@type": "Brand", name: brand.name },
    material: p.metals.join(", "),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: p.status === "out_of_stock" ? "https://schema.org/OutOfStock" : p.status === "preorder" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      url: `${SITE}/products/${p.slug}`,
    },
    ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average.toFixed(1), reviewCount: p.rating.count } } : {}),
  };
}

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE}${it.href}` })),
  };
}
