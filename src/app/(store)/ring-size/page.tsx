import type { Metadata } from "next";
import { RingSizer } from "@/components/pdp/ring-sizer";

export const metadata: Metadata = { title: "Ring size guide", description: "Find your ring size with a conversion chart, an existing ring, on-screen calibration or a printable sizer." };

export default function RingSizePage() {
  return (
    <div className="container-x grid gap-12 py-12 md:py-20 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="kicker text-accent">Sizing</p>
        <h1 className="display-xl mt-4">Find your ring size</h1>
        <p className="lede mt-5">Five ways to measure, from a ring you already own to a printable sizer. Your size is saved and pre-selected on every ring.</p>
        <p className="mt-6 text-[13px] text-muted">Still unsure? Every ring includes one complimentary resize within 60 days, at any boutique.</p>
      </div>
      <div className="lg:col-span-8"><RingSizer /></div>
    </div>
  );
}
