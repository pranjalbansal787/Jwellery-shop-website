import type { Metadata } from "next";
import { GiftFinder } from "./gift-finder";

export const metadata: Metadata = { title: "Find the perfect gift", description: "Five questions to a short, considered list of gifts." };

export default async function GiftFinderPage({ searchParams }: { searchParams: Promise<{ recipient?: string }> }) {
  const sp = await searchParams;
  return <GiftFinder initialRecipient={sp.recipient} />;
}
