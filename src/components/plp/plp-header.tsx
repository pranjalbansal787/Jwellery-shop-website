import Link from "next/link";
import { Breadcrumbs } from "./listing";

export function PlpHeader({ title, kicker, description, crumbs, links }: { title: string; kicker: string; description: string; crumbs: { name: string; href: string }[]; links?: { name: string; href: string; active?: boolean }[] }) {
  return (
    <header className="container-x pb-10 pt-10 md:pt-14">
      <Breadcrumbs items={crumbs} />
      <div className="mt-10 grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="kicker text-accent">{kicker}</p>
          <h1 className="display-xl mt-4">{title}</h1>
        </div>
        <p className="lede md:col-span-4 md:col-start-9">{description}</p>
      </div>
      {links && links.length > 0 && (
        <nav aria-label="Categories" className="scrollbar-none -mx-[var(--gutter)] mt-10 flex gap-2 overflow-x-auto px-[var(--gutter)]">
          {links.map((l) => <Link key={l.href} href={l.href} data-active={l.active} className="chip shrink-0">{l.name}</Link>)}
        </nav>
      )}
    </header>
  );
}
