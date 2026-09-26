"use client";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, type MotionValue } from "motion/react";
import { useBrand, useMoney } from "@/components/providers/brand-provider";
import { useMotionLevel } from "@/lib/hooks";
import { Magnetic } from "@/components/motion/magnetic";
import type { MetalKey } from "@/lib/types";

const HeroScene = dynamic(() => import("@/components/three/jewel-scene").then((m) => m.HeroScene), { ssr: false });

export interface HeroData {
  slug: string;
  name: string;
  price: number;
  specs: string[];
  posters: Record<MetalKey, string>;
}

const THEME_METAL: Record<string, MetalKey> = { platinum: "platinum", sapphire: "white", rose: "rose" };

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HeroStory({ data }: { data: HeroData }) {
  const { brand, themeId } = useBrand();
  const level = useMotionLevel();
  const money = useMoney();
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { margin: "200px 0px 200px 0px" });
  const [gl, setGl] = useState(false);
  const [ready, setReady] = useState(false);
  const metal = THEME_METAL[themeId] ?? "yellow";
  const story = level > 0;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useEffect(() => {
    // Only mount WebGL on capable devices and when the brand's hero mode asks for it.
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setGl(brand.heroMode === "webgl" && !saveData && webglAvailable());
  }, [brand.heroMode]);

  return (
    <section ref={ref} className="relative" style={{ height: story ? "280vh" : "100svh" }} aria-label="Featured: the Élan Solitaire">
      <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 stage" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 50% 45%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)" }} />
        {/* poster: server-rendered LCP image, cross-fades to live WebGL once ready */}
        <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ opacity: gl && ready ? 0 : 1 }} transition={{ duration: 0.5 }}>
          <div className="relative h-[52svh] w-[min(76vw,460px)] -translate-y-[9svh]">
            <Image src={data.posters[metal]} alt={`${data.name} in ${metal} gold`} fill preload sizes="(min-width:768px) 520px, 80vw" className="jewel-shot" />
          </div>
        </motion.div>
        {gl && (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 1.4 }} data-cursor="explore">
            <HeroScene spec={{ design: "solitaire", metal, gem: "diamond", shape: "round" }} progress={story ? scrollYProgress : undefined} level={level} active={inView} onReady={() => setTimeout(() => setReady(true), 250)} />
          </motion.div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
        {story ? (
          <StoryLayers progress={scrollYProgress} data={data} price={money(data.price)} />
        ) : (
          <StaticCopy data={data} price={money(data.price)} />
        )}
      </div>
    </section>
  );
}

/** Piecewise-linear interpolation, clamped. Function transforms keep these on the JS path
 * (Motion can otherwise hand opacity to a native ScrollTimeline, which mis-maps offset ranges in some engines). */
function lerp(v: number, input: number[], output: number[]) {
  if (v <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (v <= input[i]) {
      const t = (v - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + (output[i] - output[i - 1]) * t;
    }
  }
  return output[output.length - 1];
}

function useLerp(p: MotionValue<number>, input: number[], output: number[]) {
  return useTransform(p, (v) => lerp(v, input, output));
}

function StoryLayers({ progress, data, price }: { progress: MotionValue<number>; data: HeroData; price: string }) {
  const one = { opacity: useLerp(progress, [0, 0.22, 0.3], [1, 1, 0]), y: useLerp(progress, [0, 0.3], [0, -60]) };
  const two = { opacity: useLerp(progress, [0.3, 0.38, 0.56, 0.64], [0, 1, 1, 0]), y: useLerp(progress, [0.3, 0.38, 0.56, 0.64], [40, 0, 0, -40]) };
  const three = { opacity: useLerp(progress, [0.66, 0.76], [0, 1]), y: useLerp(progress, [0.66, 0.76], [40, 0]) };
  const cue = useLerp(progress, [0, 0.08], [1, 0]);
  const bar = useTransform(progress, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);
  const hideOne = useTransform(one.opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  const hideTwo = useTransform(two.opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  const hideThree = useTransform(three.opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  return (
    <>
      <motion.div style={{ ...one, visibility: hideOne }} className="absolute inset-0 flex flex-col items-center justify-end pb-[14svh] text-center">
        <p className="kicker text-accent">The Eternal Collection</p>
        <h1 className="display-2xl mt-5 max-w-[14ch]">
          Light, held <em className="italic text-metal">in gold</em>
        </h1>
        <p className="lede mt-5 max-w-md px-6">A single brilliant, raised on six hand-shaped claws. Scroll to turn it in the light.</p>
      </motion.div>
      <motion.div style={{ ...two, visibility: hideTwo }} className="container-x absolute inset-0 grid items-center">
        <div className="max-w-sm">
          <p className="kicker text-accent">Craftsmanship</p>
          <p className="display-lg mt-4">Six claws, shaped by one hand</p>
          <p className="lede mt-4">Each claw is filed, burnished and set by a single master setter, then checked under 10× magnification before the ring leaves the atelier.</p>
        </div>
        <ul className="absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 space-y-5 text-right md:block">
          {data.specs.map((s) => (
            <li key={s} className="border-r border-accent pr-4 text-[13px] uppercase tracking-[0.18em] text-muted">{s}</li>
          ))}
        </ul>
      </motion.div>
      <motion.div style={{ ...three, visibility: hideThree }} className="absolute inset-x-0 bottom-[10svh] flex flex-col items-center text-center">
        <p className="kicker text-muted">Signature</p>
        <p className="display-xl mt-3">{data.name}</p>
        <p className="mt-3 text-muted">From {price}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 px-6">
          <Magnetic><Link href={`/products/${data.slug}`} className="btn btn-primary">Discover the ring</Link></Magnetic>
          <Magnetic><Link href="/appointments?service=bridal" className="btn btn-outline">Book a private viewing</Link></Magnetic>
        </div>
      </motion.div>
      <motion.div style={{ opacity: cue }} className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-muted">
        <span className="kicker !text-[9.5px]">Scroll</span>
        <span className="h-10 w-px overflow-hidden bg-line"><motion.span className="block h-1/2 w-px bg-accent" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} /></span>
      </motion.div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-line"><motion.div className="h-px bg-accent" style={{ width: bar }} /></div>
    </>
  );
}

function StaticCopy({ data, price }: { data: HeroData; price: string }) {
  return (
    <div className="absolute inset-x-0 bottom-[8svh] flex flex-col items-center text-center">
      <p className="kicker text-accent">The Eternal Collection</p>
      <h1 className="display-2xl mt-4 max-w-[14ch]">Light, held <em className="italic text-metal">in gold</em></h1>
      <p className="mt-4 text-muted">{data.name} · From {price}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3 px-6">
        <Link href={`/products/${data.slug}`} className="btn btn-primary">Discover the ring</Link>
        <Link href="/appointments" className="btn btn-outline">Book a private viewing</Link>
      </div>
    </div>
  );
}
