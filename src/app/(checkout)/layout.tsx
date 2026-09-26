import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";
import { Cursor } from "@/components/motion/cursor";
import { IconShield } from "@/components/ui/icons";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="container-x grid h-[var(--header-h)] grid-cols-3 items-center">
          <Link href="/shop" className="link-line w-fit text-[12px] uppercase tracking-[0.16em] text-muted">Continue shopping</Link>
          <Wordmark compact className="justify-self-center" />
          <p className="flex items-center justify-end gap-2 text-[12px] text-muted"><IconShield size={16} className="text-accent" /> <span className="hidden sm:inline">Secure checkout</span></p>
        </div>
      </header>
      <main id="main">{children}</main>
      <Cursor />
    </>
  );
}
