"use client";
/**
 * Virtual try-on: live camera or a photo, then the actual 3D piece locked to
 * a finger, wrist, ear or neck via on-device MediaPipe landmarks.
 */
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconCamera, IconCheck, IconRotate } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import type { JewelSpec } from "@/lib/jewels/builders";
import {
  TRY_ON_GUIDE,
  fallbackAnchors,
  introTitle,
  labelFor,
  poseTip,
  tryOnKind,
  type TryOnAnchor,
  type TryOnKind,
} from "@/lib/try-on/kind";
import { PoseSmoother } from "@/lib/try-on/smooth";
import { JewelTracker } from "@/lib/try-on/vision";

const TryOnScene = dynamic(() => import("@/components/three/jewel-scene").then((m) => m.TryOnScene), { ssr: false });

type Phase = "intro" | "starting" | "live" | "photo" | "denied" | "unsupported" | "captured";
type TrackState = "loading" | "searching" | "locked" | "manual";

export { tryOnKind };

export function TryOn({
  image,
  name,
  spec,
  onAddToBag,
  optionsSlot,
}: {
  image: string;
  name: string;
  spec: JewelSpec;
  onAddToBag: () => void;
  optionsSlot?: React.ReactNode;
}) {
  const kind = tryOnKind(spec.design);
  const guide = TRY_ON_GUIDE[kind];
  const [phase, setPhase] = useState<Phase>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [twist, setTwist] = useState(0);
  const [facing, setFacing] = useState<"environment" | "user">(guide.camera);
  const [ready, setReady] = useState(false);
  const [banner, setBanner] = useState(true);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [trackState, setTrackState] = useState<TrackState>("loading");
  const [engine, setEngine] = useState<"off" | "ready" | "fail">("off");
  const [nudge, setNudge] = useState({ x: 0, y: 0 });

  const video = useRef<HTMLVideoElement>(null);
  const photoImg = useRef<HTMLImageElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const glCanvas = useRef<HTMLCanvasElement | null>(null);
  const tracker = useRef<JewelTracker | null>(null);
  const rawAnchors = useRef<TryOnAnchor[] | null>(null);
  const placedRef = useRef<TryOnAnchor[]>(fallbackAnchors(kind));
  const smoother = useRef(new PoseSmoother());
  const nudgeRef = useRef(nudge);
  const missed = useRef(0);
  const drag = useRef<{ x: number; y: number; nx: number; ny: number } | null>(null);
  nudgeRef.current = nudge;

  const writeAnchors = (raw: TryOnAnchor[]) => {
    rawAnchors.current = raw;
    const n = nudgeRef.current;
    placedRef.current = raw.map((a) => ({ ...a, x: a.x + n.x, y: a.y + n.y }));
  };

  useEffect(() => {
    setScale(1);
    setTwist(0);
    setFacing(guide.camera);
    setBanner(true);
    setNudge({ x: 0, y: 0 });
    rawAnchors.current = null;
    smoother.current.reset();
    writeAnchors(fallbackAnchors(kind));
  }, [kind, guide.camera]);

  useEffect(() => {
    let cancelled = false;
    const t = new JewelTracker();
    tracker.current = t;
    t.init(kind)
      .then(() => {
        if (cancelled) return;
        setEngine("ready");
        setTrackState("searching");
      })
      .catch(() => {
        if (cancelled) return;
        setEngine("fail");
        setTrackState("manual");
        writeAnchors(fallbackAnchors(kind));
      });
    return () => {
      cancelled = true;
      t.close();
      if (tracker.current === t) tracker.current = null;
    };
  }, [kind]);

  const stop = () => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  };
  useEffect(() => stop, []);
  useEffect(() => () => { if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo); }, [photo]);

  useEffect(() => {
    if (!rawAnchors.current) writeAnchors(fallbackAnchors(kind));
    else writeAnchors(rawAnchors.current);
  }, [nudge, kind]);

  useEffect(() => {
    if (phase !== "live" && phase !== "photo") return;
    if (engine !== "ready") return;
    let raf = 0;
    let live = true;

    const tick = () => {
      if (!live) return;
      const t = tracker.current;
      const st = stage.current;
      const source: HTMLVideoElement | HTMLImageElement | null =
        phase === "live" ? video.current : photoImg.current;
      const now = performance.now();
      if (t && st && source) {
        const readySrc =
          source instanceof HTMLVideoElement
            ? source.readyState >= 2 && source.videoWidth > 0
            : source.naturalWidth > 0;
        if (readySrc && t.hasNewFrame(source)) {
          try {
            const found = t.detect(source, kind, st.clientWidth, st.clientHeight, phase === "live" && facing === "user");
            if (found) {
              missed.current = 0;
              writeAnchors(smoother.current.push(found, now));
              setTrackState((s) => (s === "locked" ? s : "locked"));
              setBanner((open) => (open ? false : open));
            } else if (!smoother.current.miss()) {
              missed.current += 1;
              if (missed.current > 12) setTrackState((s) => (s === "searching" ? s : "searching"));
            }
          } catch {
            missed.current += 1;
          }
        } else {
          const held = smoother.current.sample(now);
          if (held) writeAnchors(held);
        }
      }
      raf = requestAnimationFrame(tick);
    };

    if (phase === "photo") {
      tracker.current?.setMode("IMAGE").then(tick).catch(() => {
        setEngine("fail");
        setTrackState("manual");
      });
    } else {
      tracker.current?.setMode("VIDEO").then(tick).catch(() => {
        raf = requestAnimationFrame(tick);
      });
    }

    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [phase, kind, facing, engine, ready, photo]);

  const start = useCallback(async (mode = facing) => {
    track("try_on_started", { product: name, kind });
    if (!navigator.mediaDevices?.getUserMedia) { setPhase("unsupported"); return; }
    setPhase("starting");
    setReady(false);
    setCaptureError(null);
    setBanner(true);
    missed.current = 0;
    rawAnchors.current = null;
    smoother.current.reset();
    writeAnchors(fallbackAnchors(kind));
    try {
      stop();
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      stream.current = s;
      setPhase("live");
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = s;
          video.current.play().catch(() => {});
        }
      });
    } catch (e) {
      setPhase((e as DOMException)?.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }, [facing, name, kind]);

  const onPhoto = (f: File | undefined) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhoto(url);
    stop();
    setReady(false);
    setCaptureError(null);
    setBanner(true);
    missed.current = 0;
    rawAnchors.current = null;
    smoother.current.reset();
    writeAnchors(fallbackAnchors(kind));
    setPhase("photo");
    track("try_on_started", { product: name, mode: "photo", kind });
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
      c.width = r.width * k;
      c.height = r.height * k;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.scale(k, k);
      const bg: CanvasImageSource | null = phase === "live" ? video.current : photoImg.current;
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
      const overlay = glCanvas.current;
      if (overlay && overlay.width && overlay.height) ctx.drawImage(overlay, 0, 0, r.width, r.height);
      setShot(c.toDataURL("image/jpeg", 0.92));
      setPhase("captured");
      track("try_on_completed", { product: name, kind });
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

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const st = stage.current;
    if (!st) return;
    const r = st.getBoundingClientRect();
    drag.current = { x: e.clientX, y: e.clientY, nx: nudge.x, ny: nudge.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setBanner(false);
    void r;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const st = stage.current;
    if (!d || !st) return;
    const r = st.getBoundingClientRect();
    setNudge({
      x: d.nx + (e.clientX - d.x) / r.width,
      y: d.ny + (e.clientY - d.y) / r.height,
    });
  };

  const pinch = useRef<{ d: number; s: number } | null>(null);
  const onPinch = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (!pinch.current) pinch.current = { d, s: scale };
    else setScale(clamp(pinch.current.s * (d / pinch.current.d), guide.scaleMin, guide.scaleMax));
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => clamp(s + (e.deltaY > 0 ? -0.03 : 0.03), guide.scaleMin, guide.scaleMax));
  };

  if (phase === "intro" || phase === "denied" || phase === "unsupported") {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square stage"><Image src={image} alt={name} fill sizes="400px" className="jewel-shot" /></div>
        <div className="flex flex-col justify-center">
          {phase === "intro" && (
            <>
              <p className="kicker text-accent">3D try-on</p>
              <p className="display-md mt-3">{introTitle(kind)}</p>
              <p className="mt-3 text-muted">{guide.pose} The piece is the live 3D model — it sits on you, not as a sticker. Everything stays on this device.</p>
              <p className="mt-5 border-l border-accent pl-4 text-[13px] text-muted">{poseTip(kind)}</p>
            </>
          )}
          {phase === "denied" && (<><p className="display-sm">Camera access was declined</p><p className="mt-3 text-muted">You can allow it in your browser’s site settings, or use a photo instead.</p></>)}
          {phase === "unsupported" && (<><p className="display-sm">Camera isn’t available here</p><p className="mt-3 text-muted">This browser or device doesn’t offer camera access. A photo works just as well.</p></>)}
          <div className="mt-8 flex flex-wrap gap-3">
            {phase !== "unsupported" && <button onClick={() => start(guide.camera)} className="btn btn-primary"><IconCamera size={16} /> {phase === "denied" ? "Try again" : guide.camera === "user" ? "Open front camera" : "Open camera"}</button>}
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

  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <div
        ref={stage}
        onWheel={onWheel}
        onTouchStart={onPinch}
        onTouchMove={onPinch}
        onTouchEnd={() => { pinch.current = null; }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        className="try-on-stage relative isolate aspect-[3/4] touch-none overflow-hidden bg-black md:aspect-[4/3]"
        data-cursor="drag"
      >
        {phase === "photo" && photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={photoImg} src={photo} alt="Your photo" onLoad={() => setReady(true)} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video
            ref={video}
            playsInline
            muted
            onLoadedData={() => setReady(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
          />
        )}
        <div className="absolute inset-0">
          <TryOnScene spec={spec} kind={kind} anchors={placedRef} scale={scale} twist={(twist * Math.PI) / 180} onCanvas={(el) => { glCanvas.current = el; }} />
        </div>
        {phase === "starting" && <p className="absolute inset-0 z-[1] flex items-center justify-center text-[13px] text-white/70">Starting camera…</p>}
        {banner && <Guide kind={kind} state={trackState} onDismiss={() => setBanner(false)} />}
        {trackState === "searching" && !banner && (
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] text-white/80">{guide.pose}</p>
        )}
      </div>
      <div className="flex flex-col gap-5">
        <div>
          <p className="kicker text-accent">{labelFor(kind)}</p>
          <p className="mt-2 text-[13.5px] text-muted">{statusCopy(kind, trackState, guide.hint)}</p>
        </div>
        <label className="block"><span className="kicker text-muted">How it sits</span><input type="range" min={guide.scaleMin} max={guide.scaleMax} step={0.01} value={scale} onChange={(e) => setScale(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
        <label className="block"><span className="kicker text-muted">Angle</span><input type="range" min={-40} max={40} value={twist} onChange={(e) => setTwist(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
        {optionsSlot}
        <div className="mt-auto grid gap-3">
          {captureError && <p className="text-[12.5px] text-[var(--danger)]" role="alert">{captureError}</p>}
          <button onClick={capture} disabled={phase === "starting" || (phase === "live" && !ready)} className="btn btn-primary"><IconCamera size={16} /> {phase === "starting" || (phase === "live" && !ready) ? "Preparing…" : "Capture"}</button>
          {phase === "live" && <button onClick={() => { const f = facing === "user" ? "environment" : "user"; setFacing(f); start(f); }} className="btn btn-outline"><IconRotate size={16} /> Switch camera</button>}
          <button
            onClick={() => { setScale(1); setTwist(0); setNudge({ x: 0, y: 0 }); setBanner(true); }}
            className="link-line w-fit text-[12px] text-muted"
          >
            Reset placement
          </button>
        </div>
      </div>
    </div>
  );
}

function statusCopy(kind: TryOnKind, state: TrackState, hint: string) {
  if (state === "loading") return "Preparing the on-device model…";
  if (state === "searching") return TRY_ON_GUIDE[kind].pose;
  if (state === "manual") return `${hint} Drag to place if the camera cannot find you.`;
  return hint;
}

function Guide({ kind, state, onDismiss }: { kind: TryOnKind; state: TrackState; onDismiss: () => void }) {
  return (
    <button type="button" onClick={onDismiss} className="absolute inset-0 z-[1] flex flex-col items-center justify-end bg-gradient-to-t from-black/55 via-transparent to-transparent pb-5 text-center">
      <svg viewBox="0 0 160 120" className="pointer-events-none mb-3 h-24 w-32 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.2">
        {kind === "ring" && <g><path d="M70 118c-18-28-20-52-8-70 8-12 28-12 36 0 12 18 10 42-8 70" /><ellipse cx="84" cy="58" rx="16" ry="7" /><path d="M68 58c6-10 26-10 32 0" /></g>}
        {(kind === "bangle" || kind === "bracelet") && <g><path d="M18 88c22-40 102-40 124 0" /><ellipse cx="80" cy="78" rx="46" ry="16" /><path d="M36 78c10 14 78 14 88 0" /></g>}
        {kind === "earring" && <g><ellipse cx="46" cy="44" rx="10" ry="16" /><ellipse cx="114" cy="44" rx="10" ry="16" /><circle cx="46" cy="58" r="3" /><circle cx="114" cy="58" r="3" /></g>}
        {(kind === "pendant" || kind === "necklace") && <g><path d="M28 36c16 28 88 28 104 0" /><path d="M80 58v22" /><circle cx="80" cy="86" r="8" /></g>}
      </svg>
      <p className="max-w-[28ch] px-6 text-[12.5px] text-white/90">
        {state === "loading" ? "Preparing 3D try-on…" : TRY_ON_GUIDE[kind].pose}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/55">Tap to dismiss</p>
    </button>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
