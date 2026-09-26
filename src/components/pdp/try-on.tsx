"use client";
/**
 * Virtual try-on (MVP: manual placement).
 *
 * Architecture: a TryOnProvider interface with implementations
 *   - ManualOverlayProvider (this file): camera or photo + draggable/scalable jewellery overlay
 *   - MediaPipeHandsProvider (P2): auto-anchors rings/bracelets to hand landmarks
 *   - FaceMeshProvider (P2): earrings/necklaces to ear/neck landmarks
 *   - CommercialArProvider (optional): third-party SDK behind the same interface
 * All processing is on-device. Nothing is uploaded.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import { IconCamera, IconCheck, IconRotate } from "@/components/ui/icons";
import { track } from "@/lib/analytics";

type Phase = "intro" | "starting" | "live" | "photo" | "denied" | "unsupported" | "captured";

export function TryOn({ image, name, onAddToBag, optionsSlot }: { image: string; name: string; onAddToBag: () => void; optionsSlot?: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rot, setRot] = useState(0);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => stop, []);
  useEffect(() => () => { if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo); }, [photo]);

  const start = useCallback(async (mode = facing) => {
    track("try_on_started", { product: name });
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
  }, [facing, name]);

  const onPhoto = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhoto(url);
    stop();
    setReady(true);
    setCaptureError(null);
    setPhase("photo");
    track("try_on_started", { product: name, mode: "photo" });
  };

  const capture = async () => {
    const st = stage.current, ov = overlay.current;
    if (!st || !ov) return;
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
      const jr = ov.getBoundingClientRect();
      const jewel = await loadImg(image);
      ctx.save();
      ctx.translate(jr.left - r.left + jr.width / 2, jr.top - r.top + jr.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      const w = ov.offsetWidth * scale, h = ov.offsetHeight * scale;
      ctx.drawImage(jewel, -w / 2, -h / 2, w, h);
      ctx.restore();
      setShot(c.toDataURL("image/jpeg", 0.9));
      setPhase("captured");
      track("try_on_completed", { product: name });
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

  if (phase === "intro" || phase === "denied" || phase === "unsupported") {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square stage"><Image src={image} alt={name} fill sizes="400px" className="jewel-shot" /></div>
        <div className="flex flex-col justify-center">
          {phase === "intro" && (<><p className="kicker text-accent">Virtual try-on</p><p className="display-md mt-3">See it on you</p><p className="mt-3 text-muted">Use your camera or a photo of your hand, then place and size the piece. Everything happens on this device; nothing is uploaded or stored.</p></>)}
          {phase === "denied" && (<><p className="display-sm">Camera access was declined</p><p className="mt-3 text-muted">You can allow it in your browser’s site settings, or use a photo instead.</p></>)}
          {phase === "unsupported" && (<><p className="display-sm">Camera isn’t available here</p><p className="mt-3 text-muted">This browser or device doesn’t offer camera access. A photo works just as well.</p></>)}
          <div className="mt-8 flex flex-wrap gap-3">
            {phase !== "unsupported" && <button onClick={() => start()} className="btn btn-primary"><IconCamera size={16} /> {phase === "denied" ? "Try again" : "Open camera"}</button>}
            <label className="btn btn-outline cursor-pointer">Use a photo<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
          </div>
          <p className="mt-6 text-[12px] text-muted">Automatic hand and ear tracking is on the roadmap. For now you position the piece yourself.</p>
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

  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <div ref={stage} className="relative aspect-[3/4] touch-none overflow-hidden bg-black md:aspect-[4/3]" data-cursor="drag">
        {phase === "photo" && photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video ref={video} playsInline muted onLoadedData={() => setReady(true)} className="absolute inset-0 h-full w-full object-cover" style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }} />
        )}
        {phase === "starting" && <p className="absolute inset-0 flex items-center justify-center text-[13px] text-white/70">Starting camera…</p>}
        <motion.div ref={overlay} drag dragMomentum={false} dragConstraints={stage} style={{ x, y }} className="absolute left-1/2 top-1/2 -ml-20 -mt-20 h-40 w-40 cursor-grab active:cursor-grabbing" data-cursor="drag">
          <div className="relative h-full w-full" style={{ transform: `scale(${scale}) rotate(${rot}deg)` }}>
            <Image src={image} alt="" fill sizes="320px" className="pointer-events-none object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" draggable={false} />
          </div>
        </motion.div>
      </div>
      <div className="flex flex-col gap-5">
        <p className="text-[13.5px] text-muted">Drag the piece into place, then adjust size and angle.</p>
        <label className="block"><span className="kicker text-muted">Size</span><input type="range" min={0.4} max={2.2} step={0.01} value={scale} onChange={(e) => setScale(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <label className="block"><span className="kicker text-muted">Rotation</span><input type="range" min={-180} max={180} value={rot} onChange={(e) => setRot(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
        {optionsSlot}
        <div className="mt-auto grid gap-3">
          {captureError && <p className="text-[12.5px] text-[var(--danger)]" role="alert">{captureError}</p>}
          <button onClick={capture} disabled={phase === "starting" || (phase === "live" && !ready)} className="btn btn-primary"><IconCamera size={16} /> {phase === "starting" || (phase === "live" && !ready) ? "Preparing…" : "Capture"}</button>
          {phase === "live" && <button onClick={() => { const f = facing === "user" ? "environment" : "user"; setFacing(f); start(f); }} className="btn btn-outline"><IconRotate size={16} /> Switch camera</button>}
        </div>
      </div>
    </div>
  );
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
