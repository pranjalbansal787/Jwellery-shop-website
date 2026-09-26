"use client";
/**
 * Virtual try-on: camera or photo + a piece that sits on the right part of the body.
 * Rings wrap a finger, bangles/bracelets a wrist, earrings the ears, pendants/necklaces the neck.
 * Studio whites are knocked out so the metal composites onto skin. All processing is on-device.
 */
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { IconCamera, IconCheck, IconRotate } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import type { DesignKey } from "@/lib/types";

type Phase = "intro" | "starting" | "live" | "photo" | "denied" | "unsupported" | "captured";
type Kind = "ring" | "bangle" | "bracelet" | "earring" | "pendant" | "necklace";

type Preset = {
  kind: Kind;
  pose: string;
  hint: string;
  camera: "environment" | "user";
  width: string;
  top: string;
  left: string;
  tilt: number;
  scale: number;
  scaleMin: number;
  scaleMax: number;
  pair?: { left: string; top: string }[];
};

const PRESETS: Record<Kind, Preset> = {
  ring: {
    kind: "ring",
    pose: "Show the back of your hand, fingers slightly apart.",
    hint: "Drag the ring onto a finger. Size it until the band wraps the finger — not the tip, not the knuckle.",
    camera: "environment",
    width: "28%",
    top: "38%",
    left: "52%",
    tilt: 62,
    scale: 1,
    scaleMin: 0.45,
    scaleMax: 1.7,
  },
  bangle: {
    kind: "bangle",
    pose: "Show your wrist and lower arm, palm facing you or turned slightly.",
    hint: "Place the bangle around the wrist — the opening should be wrist-sized, never finger-sized.",
    camera: "environment",
    width: "82%",
    top: "68%",
    left: "50%",
    tilt: 66,
    scale: 1,
    scaleMin: 0.7,
    scaleMax: 1.45,
  },
  bracelet: {
    kind: "bracelet",
    pose: "Show your wrist from the side, as if you were fastening a clasp.",
    hint: "Stretch the bracelet along the wrist so it follows the arm, not the fingers.",
    camera: "environment",
    width: "88%",
    top: "62%",
    left: "50%",
    tilt: 22,
    scale: 1,
    scaleMin: 0.65,
    scaleMax: 1.5,
  },
  earring: {
    kind: "earring",
    pose: "Use the front camera and keep both ears in frame.",
    hint: "Place each earring on an earlobe. Size them together so they match.",
    camera: "user",
    width: "16%",
    top: "34%",
    left: "28%",
    tilt: 8,
    scale: 1,
    scaleMin: 0.5,
    scaleMax: 2.1,
    pair: [
      { left: "28%", top: "34%" },
      { left: "72%", top: "34%" },
    ],
  },
  pendant: {
    kind: "pendant",
    pose: "Use the front camera. Keep collarbones and the base of the neck in frame.",
    hint: "Rest the pendant on the chest, just below the collarbones.",
    camera: "user",
    width: "32%",
    top: "52%",
    left: "50%",
    tilt: 12,
    scale: 1,
    scaleMin: 0.55,
    scaleMax: 1.9,
  },
  necklace: {
    kind: "necklace",
    pose: "Use the front camera. Show the neck and upper chest.",
    hint: "Span the necklace across the collarbones so it sits on the skin, not in mid-air.",
    camera: "user",
    width: "92%",
    top: "42%",
    left: "50%",
    tilt: 18,
    scale: 1,
    scaleMin: 0.7,
    scaleMax: 1.35,
  },
};

export function tryOnKind(design: DesignKey): Kind {
  if (design === "bangle") return "bangle";
  if (design === "tennis") return "bracelet";
  if (design === "studs" || design === "drops" || design === "hoops") return "earring";
  if (design === "pendant") return "pendant";
  if (design === "riviere") return "necklace";
  return "ring";
}

export function TryOn({
  image,
  name,
  design,
  onAddToBag,
  optionsSlot,
}: {
  image: string;
  name: string;
  design: DesignKey;
  onAddToBag: () => void;
  optionsSlot?: React.ReactNode;
}) {
  const preset = PRESETS[tryOnKind(design)];
  const slots = useMemo(() => preset.pair ?? [{ left: preset.left, top: preset.top }], [preset]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [cutout, setCutout] = useState<string | null>(null);
  const [scale, setScale] = useState(preset.scale);
  const [rot, setRot] = useState(0);
  const [facing, setFacing] = useState<"environment" | "user">(preset.camera);
  const [ready, setReady] = useState(false);
  const [guide, setGuide] = useState(true);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const jewels = useRef<(HTMLDivElement | null)[]>([]);
  const a = useLayer();
  const b = useLayer();
  const layers = slots.length > 1 ? [a, b] : [a];

  useEffect(() => {
    setScale(preset.scale);
    setRot(0);
    setFacing(preset.camera);
    setGuide(true);
    a.x.set(0); a.y.set(0);
    b.x.set(0); b.y.set(0);
  }, [preset, a.x, a.y, b.x, b.y]);

  useEffect(() => {
    let live = true;
    loadImg(image)
      .then((img) => {
        if (!live) return;
        setCutout(knockWhite(img).toDataURL("image/png"));
      })
      .catch(() => { if (live) setCutout(image); });
    return () => { live = false; };
  }, [image]);

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => stop, []);
  useEffect(() => () => { if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo); }, [photo]);

  const start = useCallback(async (mode = facing) => {
    track("try_on_started", { product: name, kind: preset.kind });
    if (!navigator.mediaDevices?.getUserMedia) { setPhase("unsupported"); return; }
    setPhase("starting");
    setReady(false);
    setCaptureError(null);
    try {
      stop();
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      stream.current = s;
      setPhase("live");
      requestAnimationFrame(() => { if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); } });
    } catch (e) {
      setPhase((e as DOMException)?.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }, [facing, name, preset.kind]);

  const onPhoto = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhoto(url);
    stop();
    setReady(true);
    setCaptureError(null);
    setPhase("photo");
    track("try_on_started", { product: name, mode: "photo", kind: preset.kind });
  };

  const capture = async () => {
    const st = stage.current;
    if (!st) return;
    if (phase === "starting" || (phase === "live" && !ready)) return;
    setCaptureError(null);
    try {
      const r = st.getBoundingClientRect();
      const c = document.createElement("canvas");
      const k = Math.min(2, window.devicePixelRatio || 1);
      c.width = r.width * k; c.height = r.height * k;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.scale(k, k);
      const bg: CanvasImageSource | null = phase === "live" ? video.current : photo ? await loadImg(photo) : null;
      if (bg) {
        const bw = bg instanceof HTMLVideoElement ? bg.videoWidth : (bg as HTMLImageElement).naturalWidth;
        const bh = bg instanceof HTMLVideoElement ? bg.videoHeight : (bg as HTMLImageElement).naturalHeight;
        if (bw && bh) {
          const s = Math.max(r.width / bw, r.height / bh);
          ctx.save();
          if (phase === "live" && facing === "user") { ctx.translate(r.width, 0); ctx.scale(-1, 1); }
          ctx.drawImage(bg, (r.width - bw * s) / 2, (r.height - bh * s) / 2, bw * s, bh * s);
          ctx.restore();
        }
      }
      const jewel = await loadImg(cutout ?? image);
      for (const el of jewels.current) {
        if (!el) continue;
        const jr = el.getBoundingClientRect();
        ctx.save();
        ctx.translate(jr.left - r.left + jr.width / 2, jr.top - r.top + jr.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.scale(1, Math.cos((preset.tilt * Math.PI) / 180));
        const w = el.offsetWidth * scale, h = el.offsetHeight * scale;
        ctx.drawImage(jewel, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      setShot(c.toDataURL("image/jpeg", 0.9));
      setPhase("captured");
      track("try_on_completed", { product: name, kind: preset.kind });
    } catch {
      setCaptureError("We couldn’t capture that frame. Try again, or use a photo instead.");
    }
  };

  const share = async () => {
    if (!shot) return;
    const blob = await (await fetch(shot)).blob();
    const file = new File([blob], `${name.replace(/\s+/g, "-").toLowerCase()}-try-on.jpg`, { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: name }).catch(() => {});
    else { const a = document.createElement("a"); a.href = shot; a.download = file.name; a.click(); }
  };

  const pinch = useRef<{ d: number; s: number } | null>(null);
  const onPinch = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (!pinch.current) pinch.current = { d, s: scale };
    else setScale(clamp(pinch.current.s * (d / pinch.current.d), preset.scaleMin, preset.scaleMax));
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => clamp(s + (e.deltaY > 0 ? -0.04 : 0.04), preset.scaleMin, preset.scaleMax));
  };

  if (phase === "intro" || phase === "denied" || phase === "unsupported") {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square stage"><Image src={image} alt={name} fill sizes="400px" className="jewel-shot" /></div>
        <div className="flex flex-col justify-center">
          {phase === "intro" && (
            <>
              <p className="kicker text-accent">Virtual try-on</p>
              <p className="display-md mt-3">{introTitle(preset.kind)}</p>
              <p className="mt-3 text-muted">{preset.pose} Then place and size the piece. Everything happens on this device; nothing is uploaded.</p>
              <PoseHint kind={preset.kind} />
            </>
          )}
          {phase === "denied" && (<><p className="display-sm">Camera access was declined</p><p className="mt-3 text-muted">You can allow it in your browser’s site settings, or use a photo instead.</p></>)}
          {phase === "unsupported" && (<><p className="display-sm">Camera isn’t available here</p><p className="mt-3 text-muted">This browser or device doesn’t offer camera access. A photo works just as well.</p></>)}
          <div className="mt-8 flex flex-wrap gap-3">
            {phase !== "unsupported" && <button onClick={() => start(preset.camera)} className="btn btn-primary"><IconCamera size={16} /> {phase === "denied" ? "Try again" : preset.camera === "user" ? "Open front camera" : "Open camera"}</button>}
            <label className="btn btn-outline cursor-pointer">Use a photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "captured" && shot) {
    return (
      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shot} alt={`Try-on of ${name}`} className="w-full" />
        <div className="flex flex-col justify-center gap-3">
          <p className="display-sm flex items-center gap-2"><IconCheck className="text-accent" /> Captured</p>
          <p className="text-muted">Save or share it, then add this exact configuration to your bag.</p>
          <button onClick={onAddToBag} className="btn btn-primary mt-3">Add to bag</button>
          <button onClick={share} className="btn btn-outline">Save / share image</button>
          <button onClick={() => setPhase(photo ? "photo" : "live")} className="link-line mt-2 w-fit text-[12px] text-muted">Retake</button>
        </div>
      </div>
    );
  }

  const src = cutout ?? image;

  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <div
        ref={stage}
        onWheel={onWheel}
        onTouchStart={onPinch}
        onTouchMove={onPinch}
        onTouchEnd={() => { pinch.current = null; }}
        className="try-on-stage relative isolate aspect-[3/4] touch-none overflow-hidden bg-black md:aspect-[4/3]"
        data-cursor="drag"
      >
        {phase === "photo" && photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video ref={video} playsInline muted onLoadedData={() => setReady(true)} className="absolute inset-0 h-full w-full object-cover" style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }} />
        )}
        {phase === "starting" && <p className="absolute inset-0 flex items-center justify-center text-[13px] text-white/70">Starting camera…</p>}
        {guide && <Guide kind={preset.kind} onDismiss={() => setGuide(false)} />}
        {slots.map((slot, i) => (
          <motion.div
            key={`${preset.kind}-${i}`}
            ref={(el) => { jewels.current[i] = el; }}
            drag
            dragMomentum={false}
            dragConstraints={stage}
            onDragStart={() => setGuide(false)}
            style={{ x: layers[i].x, y: layers[i].y, left: slot.left, top: slot.top, width: preset.width }}
            className="absolute aspect-square -translate-x-1/2 -translate-y-1/2 cursor-grab [perspective:900px] active:cursor-grabbing"
            data-cursor="drag"
          >
            <div className="relative h-full w-full" style={{ transform: `scale(${scale}) rotate(${rot}deg) rotateX(${preset.tilt}deg)`, transformOrigin: "center" }}>
              <Image src={src} alt="" fill sizes="420px" className="pointer-events-none object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.28)]" draggable={false} />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <p className="kicker text-accent">{labelFor(preset.kind)}</p>
          <p className="mt-2 text-[13.5px] text-muted">{preset.hint}</p>
        </div>
        <label className="block"><span className="kicker text-muted">How it sits</span><input type="range" min={preset.scaleMin} max={preset.scaleMax} step={0.01} value={scale} onChange={(e) => setScale(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <label className="block"><span className="kicker text-muted">Angle</span><input type="range" min={-40} max={40} value={rot} onChange={(e) => setRot(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
        {optionsSlot}
        <div className="mt-auto grid gap-3">
          {captureError && <p className="text-[12.5px] text-[var(--danger)]" role="alert">{captureError}</p>}
          <button onClick={capture} disabled={phase === "starting" || (phase === "live" && !ready)} className="btn btn-primary"><IconCamera size={16} /> {phase === "starting" || (phase === "live" && !ready) ? "Preparing…" : "Capture"}</button>
          {phase === "live" && <button onClick={() => { const f = facing === "user" ? "environment" : "user"; setFacing(f); start(f); }} className="btn btn-outline"><IconRotate size={16} /> Switch camera</button>}
          <button
            onClick={() => { setScale(preset.scale); setRot(0); a.x.set(0); a.y.set(0); b.x.set(0); b.y.set(0); setGuide(true); }}
            className="link-line w-fit text-[12px] text-muted"
          >
            Reset placement
          </button>
        </div>
      </div>
    </div>
  );
}

function useLayer() {
  return { x: useMotionValue(0), y: useMotionValue(0) };
}

function labelFor(kind: Kind) {
  return { ring: "On the finger", bangle: "On the wrist", bracelet: "On the wrist", earring: "On the ears", pendant: "At the collarbone", necklace: "On the neck" }[kind];
}

function introTitle(kind: Kind) {
  return { ring: "See it on your finger", bangle: "See it on your wrist", bracelet: "See it on your wrist", earring: "See it on your ears", pendant: "See it at your neck", necklace: "See it on you" }[kind];
}

function PoseHint({ kind }: { kind: Kind }) {
  const copy = {
    ring: "Best photo: back of the hand, natural daylight, one finger slightly forward.",
    bangle: "Best photo: wrist and forearm, bangle-height, not a close-up of the fingers.",
    bracelet: "Best photo: the side of the wrist, as you would wear a tennis line.",
    earring: "Best photo: a straight-on portrait with hair tucked behind both ears.",
    pendant: "Best photo: from the collarbones up, in a simple neckline.",
    necklace: "Best photo: neck and upper chest, shoulders relaxed.",
  }[kind];
  return <p className="mt-5 border-l border-accent pl-4 text-[13px] text-muted">{copy}</p>;
}

function Guide({ kind, onDismiss }: { kind: Kind; onDismiss: () => void }) {
  return (
    <button type="button" onClick={onDismiss} className="absolute inset-0 z-[1] flex flex-col items-center justify-end bg-gradient-to-t from-black/55 via-transparent to-transparent pb-5 text-center">
      <svg viewBox="0 0 160 120" className="pointer-events-none mb-3 h-24 w-32 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.2">
        {kind === "ring" && <g><path d="M70 118c-18-28-20-52-8-70 8-12 28-12 36 0 12 18 10 42-8 70" /><ellipse cx="84" cy="58" rx="16" ry="7" /><path d="M68 58c6-10 26-10 32 0" /></g>}
        {(kind === "bangle" || kind === "bracelet") && <g><path d="M18 88c22-40 102-40 124 0" /><ellipse cx="80" cy="78" rx="46" ry="16" /><path d="M36 78c10 14 78 14 88 0" /></g>}
        {kind === "earring" && <g><ellipse cx="46" cy="44" rx="10" ry="16" /><ellipse cx="114" cy="44" rx="10" ry="16" /><circle cx="46" cy="58" r="3" /><circle cx="114" cy="58" r="3" /></g>}
        {(kind === "pendant" || kind === "necklace") && <g><path d="M28 36c16 28 88 28 104 0" /><path d="M80 58v22" /><circle cx="80" cy="86" r="8" /></g>}
      </svg>
      <p className="max-w-[28ch] px-6 text-[12.5px] text-white/90">{PRESETS[kind].pose}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">Tap to dismiss</p>
    </button>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Punch studio white (and the soft ground shadow) out of a render so metal sits on skin. */
function knockWhite(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.drawImage(img, 0, 0);
  const pix = ctx.getImageData(0, 0, c.width, c.height);
  const d = pix.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 236) d[i + 3] = 0;
    else if (min > 200 && max - min < 22) d[i + 3] = Math.round(d[i + 3] * ((236 - min) / 36));
  }
  ctx.putImageData(pix, 0, 0);
  return c;
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
