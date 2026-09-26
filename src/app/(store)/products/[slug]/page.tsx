import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { getProduct, getCategories, getCollections, relatedProducts, completeTheSet } from "@/server/repo/catalog";
import { ProductExperience } from "@/components/pdp/product-experience";
import { Breadcrumbs } from "@/components/plp/listing";
import { ProductRail } from "@/components/home/sections";
import { MaskText, Reveal } from "@/components/motion/reveal";
import { toCard } from "@/lib/card";
import { productImage } from "@/lib/media";
import { JsonLd, breadcrumbLd, productLd } from "@/lib/seo";
import { BRAND_COOKIE, parseBrand } from "@/lib/brand";
import type { MetalKey } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Not found" };
  const img = productImage(p);
  return {
    title: p.name,
    description: `${p.subtitle}. ${p.description.slice(0, 120)}…`,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description: p.subtitle, images: [{ url: img, width: 800, height: 1000 }] },
    twitter: { card: "summary_large_image", title: p.name, images: [img] },
  };
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ metal?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const p = await getProduct(slug);
  if (!p) notFound();
  const [cats, cols, related, set] = await Promise.all([getCategories(), getCollections(), relatedProducts(p, 8), completeTheSet(p, 6)]);
  const brand = parseBrand((await cookies()).get(BRAND_COOKIE)?.value);
  const cat = cats.find((c) => c.id === p.categoryId);
  const parent = cat?.parentId ? cats.find((c) => c.id === cat.parentId) : null;
  const collection = cols.find((c) => p.collectionIds.includes(c.id));
  const initialMetal = (p.metals as string[]).includes(sp.metal ?? "") ? (sp.metal as MetalKey) : p.defaultMetal;
  const crumbs = [{ name: "Home", href: "/" }, ...(parent ? [{ name: parent.name, href: `/shop/${parent.slug}` }] : []), ...(cat ? [{ name: cat.name, href: `/shop/${cat.slug}` }] : []), { name: p.name, href: `/products/${p.slug}` }];

  return (
    <>
      <JsonLd data={productLd(p, brand, productImage(p))} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <div className="container-x py-6"><Breadcrumbs items={crumbs} /></div>
      <ProductExperience p={p} collectionName={collection?.name ?? null} initialMetal={initialMetal} />

      <section className="border-y border-line bg-surface">
        <div className="container-x grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div className="relative aspect-square stage">
            <Image src={productImage(p, p.defaultMetal, p.defaultGem, "detail")} alt={`${p.name} craftsmanship detail`} fill sizes="(min-width:768px) 50vw, 100vw" className="object-contain p-10" />
          </div>
          <div>
            <Reveal><p className="kicker text-accent">The making</p></Reveal>
            <MaskText lines={["Made slowly,", "by hand"]} className="display-lg mt-4" />
            <Reveal delay={0.1}><p className="lede mt-6 max-w-md">{p.story}</p></Reveal>
          </div>
        </div>
      </section>

      {set.length > 0 && <ProductRail kicker="Complete the set" title={["Worn together"]} href={collection ? `/collections/${collection.slug}` : "/collections"} cta={collection ? `Explore ${collection.name}` : "Collections"} products={set.map(toCard)} />}
      <ProductRail kicker="You may also admire" title={["Related pieces"]} href={cat ? `/shop/${cat.slug}` : "/shop"} cta={cat ? `All ${cat.name.toLowerCase()}` : "Shop all"} products={related.map(toCard)} />
    </>
  );
}
