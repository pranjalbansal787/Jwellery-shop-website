import type { DesignKey } from "@/lib/types";

export type TryOnKind = "ring" | "bangle" | "bracelet" | "earring" | "pendant" | "necklace";

export type TryOnAnchor = {
  x: number;
  y: number;
  angle: number;
  size: number;
};

export type TryOnGuide = {
  kind: TryOnKind;
  pose: string;
  hint: string;
  camera: "environment" | "user";
  scaleMin: number;
  scaleMax: number;
};

export const TRY_ON_GUIDE: Record<TryOnKind, TryOnGuide> = {
  ring: {
    kind: "ring",
    pose: "Show the back of your hand, fingers slightly apart.",
    hint: "The ring tracks your finger and wraps the band around it. Stay in daylight if you can.",
    camera: "environment",
    scaleMin: 0.7,
    scaleMax: 1.45,
  },
  bangle: {
    kind: "bangle",
    pose: "Show your wrist and lower arm, not just the fingers.",
    hint: "The bangle sits around the wrist. Turn your arm slowly so it can find the opening.",
    camera: "environment",
    scaleMin: 0.75,
    scaleMax: 1.4,
  },
  bracelet: {
    kind: "bracelet",
    pose: "Show the side of your wrist, as if fastening a clasp.",
    hint: "The line follows the wrist, not the fingers. Keep the forearm in frame.",
    camera: "environment",
    scaleMin: 0.75,
    scaleMax: 1.4,
  },
  earring: {
    kind: "earring",
    pose: "Use the front camera and keep both ears in frame.",
    hint: "Each earring locks to an earlobe. Tuck hair behind the ears.",
    camera: "user",
    scaleMin: 0.65,
    scaleMax: 1.6,
  },
  pendant: {
    kind: "pendant",
    pose: "Use the front camera. Keep collarbones and the base of the neck in frame.",
    hint: "The pendant rests on the chest, just below the collarbones.",
    camera: "user",
    scaleMin: 0.65,
    scaleMax: 1.55,
  },
  necklace: {
    kind: "necklace",
    pose: "Use the front camera. Show the neck and upper chest.",
    hint: "The necklace spans the collarbones and sits on the skin.",
    camera: "user",
    scaleMin: 0.7,
    scaleMax: 1.35,
  },
};

export function tryOnKind(design: DesignKey): TryOnKind {
  if (design === "bangle") return "bangle";
  if (design === "tennis") return "bracelet";
  if (design === "studs" || design === "drops" || design === "hoops") return "earring";
  if (design === "pendant") return "pendant";
  if (design === "riviere") return "necklace";
  return "ring";
}

export function needsFace(kind: TryOnKind) {
  return kind === "earring" || kind === "pendant" || kind === "necklace";
}

export function fallbackAnchors(kind: TryOnKind): TryOnAnchor[] {
  if (kind === "ring") return [{ x: 0.54, y: 0.4, angle: -Math.PI / 2, size: 0.05 }];
  if (kind === "bangle") return [{ x: 0.5, y: 0.64, angle: 0.2, size: 0.2 }];
  if (kind === "bracelet") return [{ x: 0.5, y: 0.6, angle: 0.15, size: 0.18 }];
  if (kind === "earring") {
    return [
      { x: 0.3, y: 0.38, angle: 0, size: 0.035 },
      { x: 0.7, y: 0.38, angle: 0, size: 0.035 },
    ];
  }
  if (kind === "pendant") return [{ x: 0.5, y: 0.58, angle: 0, size: 0.24 }];
  return [{ x: 0.5, y: 0.46, angle: 0, size: 0.34 }];
}

export function labelFor(kind: TryOnKind) {
  return {
    ring: "On the finger",
    bangle: "On the wrist",
    bracelet: "On the wrist",
    earring: "On the ears",
    pendant: "At the collarbone",
    necklace: "On the neck",
  }[kind];
}

export function introTitle(kind: TryOnKind) {
  return {
    ring: "See it on your finger",
    bangle: "See it on your wrist",
    bracelet: "See it on your wrist",
    earring: "See it on your ears",
    pendant: "See it at your neck",
    necklace: "See it on you",
  }[kind];
}

export function poseTip(kind: TryOnKind) {
  return {
    ring: "Best pose: back of the hand, natural daylight, one finger slightly forward.",
    bangle: "Best pose: wrist and forearm at bangle height — not a close-up of the fingers.",
    bracelet: "Best pose: the side of the wrist, as you would wear a tennis line.",
    earring: "Best pose: a straight-on portrait with hair tucked behind both ears.",
    pendant: "Best pose: from the collarbones up, in a simple neckline.",
    necklace: "Best pose: neck and upper chest, shoulders relaxed.",
  }[kind];
}
