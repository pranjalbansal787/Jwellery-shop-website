import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCollection } from "@/server/repo/catalog";
import { Listing, Breadcrumbs } from "@/components/plp/listing";
import { MaskText } from "@/components/motion/reveal";
import { JsonLd, breadcrumbLd } from "@/lib/seo";
import type { SearchParams } from "@/lib/filters";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.description, alternates: { canonical: `/collections/${c.slug}` }, openGraph: { images: [c.heroImage] } };
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const c = await getCollection(slug);
  if (!c) notFound();
  const crumbs = [{ name: "Home", href: "/" }, { name: "Collections", href: "/collections" }, { name: c.name, href: `/collections/${c.slug}` }];
  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pb-16 pt-10 md:grid-cols-12 md:pt-14">
          <div className="md:col-span-6">
            <Breadcrumbs items={crumbs} />
            <p className="kicker mt-12 text-accent">{c.kicker}</p>
            <MaskText as="h1" lines={[c.name]} className="display-2xl mt-5" />
            <p className="lede mt-6 max-w-md">{c.description}</p>
          </div>
          <div className="relative aspect-[4/3] stage md:col-span-6">
            <Image src={c.heroImage} alt="" fill preload sizes="(min-width:768px) 50vw, 100vw" className="jewel-shot" />
          </div>
        </div>
      </section>
      <Listing base={{ collection: c.slug }} searchParams={sp} basePath={`/collections/${c.slug}`} />
    </>
  );
}
