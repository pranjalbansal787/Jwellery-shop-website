"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { IconExpand, IconMinus, IconPlus, IconRotate } from "@/components/ui/icons";
import type { JewelSpec } from "@/lib/jewels/builders";
import type { ViewerHandle } from "@/components/three/jewel-scene";

const ViewerScene = dynamic(() => import("@/components/three/jewel-scene").then((m) => m.ViewerScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="kicker animate-pulse text-muted">Preparing 3D model</p>
    </div>
  ),
});

/** 3D viewer with explicit controls (rotate, zoom, reset, fullscreen) for keyboard and touch users. */
export function ViewerPanel({ spec }: { spec: JewelSpec }) {
  const handle = useRef<ViewerHandle>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(true);
  return (
    <div ref={wrap} className="relative h-full w-full stage" data-cursor="360">
      <ViewerScene ref={handle} spec={spec} autoRotate={auto} onInteract={() => setAuto(false)} />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 border border-line bg-bg/80 p-1 backdrop-blur" role="toolbar" aria-label="3D viewer controls">
        <Ctl label={auto ? "Stop rotation" : "Rotate"} onClick={() => setAuto((a) => !a)} active={auto}><IconRotate size={16} /></Ctl>
        <Ctl label="Zoom in" onClick={() => handle.current?.zoom(1)}><IconPlus size={16} /></Ctl>
        <Ctl label="Zoom out" onClick={() => handle.current?.zoom(-1)}><IconMinus size={16} /></Ctl>
        <Ctl label="Reset view" onClick={() => { handle.current?.reset(); setAuto(true); }}><span className="text-[10px] uppercase tracking-[0.16em]">Reset</span></Ctl>
        <Ctl label="Fullscreen" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}><IconExpand size={16} /></Ctl>
      </div>
    </div>
  );
}

function Ctl({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} aria-pressed={active} className="flex h-9 min-w-9 items-center justify-center px-2 hover:bg-surface aria-pressed:text-accent">
      {children}
    </button>
  );
}
