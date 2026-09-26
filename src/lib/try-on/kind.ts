import type { DesignKey } from "@/lib/types";

export type TryOnKind = "ring" | "bangle" | "bracelet" | "earring" | "pendant" | "necklace";

export type TryOnAnchor = {
  x: number;
  y: number;
  angle: number;
  size: number;
  /** Finger / arm axis in view space (x right, y up, z toward camera). */
  ax: number;
  ay: number;
  az: number;
  /** Stone / facing direction in view space. */
  ux: number;
  uy: number;
  uz: number;
};

export function poseAnchor(
  x: number,
  y: number,
  angle: number,
  size: number,
  extra?: Partial<Pick<TryOnAnchor, "ax" | "ay" | "az" | "ux" | "uy" | "uz">>,
): TryOnAnchor {
  return {
    x,
    y,
    angle,
    size,
    ax: extra?.ax ?? Math.cos(angle),
    ay: extra?.ay ?? -Math.sin(angle),
    az: extra?.az ?? 0,
    ux: extra?.ux ?? 0,
    uy: extra?.uy ?? 0,
    uz: extra?.uz ?? 1,
  };
}

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
    hint: "The ring follows your finger — turn your hand and it turns with you.",
    camera: "environment",
    scaleMin: 0.7,
    scaleMax: 1.45,
  },
  bangle: {
    kind: "bangle",
    pose: "Show your wrist and forearm — the hand can be open, but keep the wrist in the centre.",
    hint: "The bangle wraps the wrist. Turn your arm slowly and it stays around it.",
    camera: "environment",
    scaleMin: 0.7,
    scaleMax: 1.45,
  },
  bracelet: {
    kind: "bracelet",
    pose: "Show your wrist from the side, forearm in frame, as if fastening a clasp.",
    hint: "The bracelet follows the wrist as you move. Keep the forearm in frame.",
    camera: "environment",
    scaleMin: 0.7,
    scaleMax: 1.45,
  },
  earring: {
    kind: "earring",
    pose: "Use the front camera and keep both ears in frame.",
    hint: "Each earring stays on an earlobe as you turn your head.",
    camera: "user",
    scaleMin: 0.65,
    scaleMax: 1.6,
  },
  pendant: {
    kind: "pendant",
    pose: "Use the front camera. Keep collarbones and the base of the neck in frame.",
    hint: "The pendant stays at the collarbone as you move.",
    camera: "user",
    scaleMin: 0.65,
    scaleMax: 1.55,
  },
  necklace: {
    kind: "necklace",
    pose: "Use the front camera. Show the neck and upper chest.",
    hint: "The necklace stays on the collarbones as you move.",
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
  if (kind === "ring") return [poseAnchor(0.54, 0.4, -Math.PI / 2, 0.05)];
  if (kind === "bangle") return [poseAnchor(0.5, 0.64, 0.2, 0.2)];
  if (kind === "bracelet") return [poseAnchor(0.5, 0.6, 0.15, 0.18)];
  if (kind === "earring") {
    return [poseAnchor(0.3, 0.38, 0, 0.035), poseAnchor(0.7, 0.38, 0, 0.035)];
  }
  if (kind === "pendant") return [poseAnchor(0.5, 0.58, 0, 0.24)];
  return [poseAnchor(0.5, 0.46, 0, 0.34)];
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
    bangle: "Best pose: wrist and a little forearm, daylight, not a close-up of the fingers.",
    bracelet: "Best pose: the side of the wrist and forearm, as you would wear a tennis line.",
    earring: "Best pose: a straight-on portrait with hair tucked behind both ears.",
    pendant: "Best pose: from the collarbones up, in a simple neckline.",
    necklace: "Best pose: neck and upper chest, shoulders relaxed.",
  }[kind];
}
