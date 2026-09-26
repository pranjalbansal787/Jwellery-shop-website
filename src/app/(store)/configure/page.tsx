import type { Metadata } from "next";
import { listProducts } from "@/server/repo/catalog";
import { productImage } from "@/lib/media";
import { Configurator } from "./configurator";

export const metadata: Metadata = { title: "Design your engagement ring", description: "Choose a setting, metal, centre stone, shape and carat, and see it in 3D with live pricing." };

export default async function ConfigurePage() {
  // pick the closest studio render for the bag thumbnail (the 3D model is the source of truth)
  const all = await listProducts();
  const images: Record<string, string> = {};
  for (const setting of ["solitaire", "halo", "three-stone"]) {
    for (const metal of ["yellow", "white", "rose", "platinum"]) {
      for (const gem of ["diamond", "emerald", "sapphire", "ruby"]) {
        const exact = all.find((p) => p.design === setting && p.metals.includes(metal as never) && p.defaultGem === gem);
        const byGem = all.find((p) => p.design === setting && p.gems.includes(gem as never));
        const any = all.find((p) => p.design === setting)!;
        images[`${setting}|${metal}|${gem}`] = exact ? productImage(exact, metal as never, gem as never) : byGem ? productImage(byGem, byGem.defaultMetal, gem as never) : productImage(any);
      }
    }
  }
  return <Configurator images={images} />;
}
