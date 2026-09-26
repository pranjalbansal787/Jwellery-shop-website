import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track an order" };

export default function TrackPage() {
  return (
    <div className="container-x grid gap-12 py-16 md:grid-cols-2 md:py-24">
      <div>
        <p className="kicker text-accent">Orders</p>
        <h1 className="display-xl mt-4">Track your order</h1>
        <p className="lede mt-5 max-w-md">From the atelier bench to your door. Made-to-order pieces show each stage of crafting, setting and polishing.</p>
      </div>
      <div className="md:pt-16"><TrackForm /></div>
    </div>
  );
}
