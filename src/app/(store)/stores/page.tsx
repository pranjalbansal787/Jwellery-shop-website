import type { Metadata } from "next";
import { listStores } from "@/server/repo/crm";
import { StoreLocator } from "./store-locator";

export const metadata: Metadata = { title: "Boutiques", description: "Visit our boutiques for private appointments, sizing and aftercare." };

export default async function StoresPage() {
  const stores = await listStores();
  return (
    <div className="container-x py-12 md:py-20">
      <p className="kicker text-accent">Boutiques</p>
      <h1 className="display-xl mt-4">Visit the maison</h1>
      <StoreLocator stores={stores} />
    </div>
  );
}
