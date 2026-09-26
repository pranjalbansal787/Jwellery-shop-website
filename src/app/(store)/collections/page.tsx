import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCollections } from "@/server/repo/catalog";
import { Reveal } from "@/components/motion/reveal";
import { Breadcrumbs } from "@/components/plp/listing";

export const metadata: Metadata = { title: "Collections", alternates: { canonical: "/collections" } };

export default async function CollectionsPage() {
  const cols = await getCollections();
  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Collections", href: "/collections" }]} />
      <p className="kicker mt-10 text-accent">Collections</p>
      <h1 className="display-xl mt-4 max-w-3xl">Edited by occasion, stone and story</h1>
      <ul className="mt-16 grid gap-x-6 gap-y-16 md:grid-cols-2">
        {cols.map((c, i) => (
          <Reveal as="li" key={c.id} delay={(i % 2) * 0.1} className={i % 3 === 0 ? "md:col-span-2" : ""}>
            <Link href={`/collections/${c.slug}`} className="group grid items-center gap-8 md:grid-cols-2" data-cursor="explore">
              <div className={`relative overflow-hidden stage ${i % 3 === 0 ? "aspect-[16/10] md:order-2" : "aspect-[4/3] md:col-span-2"}`}>
                <Image src={c.heroImage} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="jewel-shot" />
              </div>
              <div className={i % 3 === 0 ? "" : "md:col-span-2"}>
                <p className="kicker text-muted">{c.kicker} · {c.productIds.length} pieces</p>
                <p className={i % 3 === 0 ? "display-lg mt-3" : "display-md mt-2"}>{c.name}</p>
                <p className="lede mt-3 max-w-md">{c.description}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
