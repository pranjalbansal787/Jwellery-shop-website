import type { FaceLandmarker, HandLandmarker, Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { fallbackAnchors, needsFace, poseAnchor, type TryOnAnchor, type TryOnKind } from "./kind";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const RING_MCP = 13;
const RING_PIP = 14;
const RING_DIP = 15;
const MIDDLE_MCP = 9;
const INDEX_MCP = 5;
const PINKY_MCP = 17;
const WRIST = 0;

const FACE_CHIN = 152;
const FACE_FOREHEAD = 10;
const FACE_NOSE = 1;
const FACE_LEFT_EAR = 234;
const FACE_RIGHT_EAR = 454;

export type TrackSource = HTMLVideoElement | HTMLImageElement;

type Mode = "VIDEO" | "IMAGE";

type Pt = { x: number; y: number; z: number };

export class JewelTracker {
  private hands: HandLandmarker | null = null;
  private face: FaceLandmarker | null = null;
  private mode: Mode = "VIDEO";
  private lastTs = 0;
  private wantFace = false;
  private lockedHand = -1;
  private lastVideoTime = -1;

  async init(kind: TryOnKind) {
    this.wantFace = needsFace(kind);
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
    const make = async (delegate: "GPU" | "CPU") => {
      const base = { delegate };
      if (this.wantFace) {
        this.face = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL, ...base },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.38,
          minFacePresenceConfidence: 0.38,
          minTrackingConfidence: 0.38,
          outputFacialTransformationMatrixes: true,
        });
      } else {
        this.hands = await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: HAND_MODEL, ...base },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      }
    };
    try {
      await make("GPU");
    } catch {
      this.face = null;
      this.hands = null;
      await make("CPU");
    }
    this.mode = "VIDEO";
    this.lastTs = 0;
    this.lockedHand = -1;
    this.lastVideoTime = -1;
  }

  async setMode(mode: Mode) {
    if (this.mode === mode) return;
    if (this.hands) await this.hands.setOptions({ runningMode: mode });
    if (this.face) await this.face.setOptions({ runningMode: mode });
    this.mode = mode;
    this.lastTs = 0;
    this.lastVideoTime = -1;
  }

  /** True when the source has a new frame — skip duplicate detects so the jewel can interpolate. */
  hasNewFrame(source: TrackSource) {
    if (!(source instanceof HTMLVideoElement)) {
      this.lastVideoTime += 1;
      return this.lastVideoTime <= 6;
    }
    const t = source.currentTime;
    if (t === this.lastVideoTime) return false;
    this.lastVideoTime = t;
    return true;
  }

  detect(
    source: TrackSource,
    kind: TryOnKind,
    stageW: number,
    stageH: number,
    mirror: boolean,
  ): TryOnAnchor[] | null {
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    if (!srcW || !srcH || !stageW || !stageH) return null;

    const map = mapper(srcW, srcH, stageW, stageH, mirror);
    if (this.wantFace) {
      const faces = this.runFace(source);
      const lm = faces?.faceLandmarks?.[0];
      if (!lm || lm.length < 400) return null;
      const xf = faces?.facialTransformationMatrixes?.[0]?.data;
      return fromFace(lm, kind, map, xf);
    }
    const hands = this.runHands(source);
    const picked = pickHand(hands?.landmarks, hands?.worldLandmarks, this.lockedHand, kind);
    if (!picked) {
      this.lockedHand = -1;
      return null;
    }
    this.lockedHand = picked.index;
    return fromHand(picked.lm, picked.world, kind, map, mirror);
  }

  close() {
    this.hands?.close();
    this.face?.close();
    this.hands = null;
    this.face = null;
  }

  private runHands(source: TrackSource) {
    if (!this.hands) return null;
    if (this.mode === "IMAGE") {
      try {
        return this.hands.detect(source);
      } catch {
        /* still in video mode */
      }
    }
    const ts = nextTs(this.lastTs);
    this.lastTs = ts;
    return this.hands.detectForVideo(source, ts);
  }

  private runFace(source: TrackSource) {
    if (!this.face) return null;
    if (this.mode === "IMAGE") {
      try {
        return this.face.detect(source);
      } catch {
        /* still in video mode */
      }
    }
    const ts = nextTs(this.lastTs);
    this.lastTs = ts;
    return this.face.detectForVideo(source, ts);
  }
}

export { fallbackAnchors };

function fromHand(
  lm: NormalizedLandmark[],
  world: Landmark[] | undefined,
  kind: TryOnKind,
  map: Mapper,
  mirror: boolean,
): TryOnAnchor[] | null {
  const W = world ?? [];
  if (kind === "bangle" || kind === "bracelet") {
    const wrist = lm[WRIST];
    const mid = lm[MIDDLE_MCP];
    const index = lm[INDEX_MCP];
    const pinky = lm[PINKY_MCP];
    if (!wrist || !mid || !index || !pinky) return null;
    const palm = sub(mid, wrist);
    const len = Math.hypot(palm.x, palm.y) || 1;
    const raw = { x: wrist.x - (palm.x / len) * 0.07, y: wrist.y - (palm.y / len) * 0.07, z: wrist.z };
    const a = map.pt(raw.x, raw.y);
    const width = Math.max(map.seg(index, pinky) * 1.28, 0.11);
    const along = viewAxis(W[WRIST] && W[MIDDLE_MCP] ? sub(W[WRIST], W[MIDDLE_MCP]) : palm, map, wrist, { x: wrist.x - palm.x, y: wrist.y - palm.y, z: wrist.z }, mirror);
    const up = palmNormal(W, lm, map, mirror);
    const angle = Math.atan2(palm.y, palm.x);
    return [poseAnchor(a.x, a.y, angle, width, { ...along, ...up })];
  }

  const mcp = lm[RING_MCP];
  const pip = lm[RING_PIP];
  const dip = lm[RING_DIP] ?? pip;
  const mid = lm[MIDDLE_MCP];
  if (!mcp || !pip || !mid) return null;
  const wear = lerp(mcp, pip, 0.66);
  const a = map.pt(wear.x, wear.y);
  const knuckle = map.seg(mcp, mid);
  const phalanx = map.seg(mcp, dip) * 0.42;
  const width = Math.max((knuckle * 0.92 + phalanx * 0.55) / 1.47, 0.026);
  const along = viewAxis(W[RING_PIP] && W[RING_MCP] ? sub(W[RING_PIP], W[RING_MCP]) : sub(pip, mcp), map, mcp, pip, mirror);
  const up = palmNormal(W, lm, map, mirror);
  const angle = Math.atan2(pip.y - mcp.y, pip.x - mcp.x);
  return [poseAnchor(a.x, a.y, angle, width, { ...along, ...up })];
}

function fromFace(lm: NormalizedLandmark[], kind: TryOnKind, map: Mapper, xf?: number[]): TryOnAnchor[] | null {
  const chin = lm[FACE_CHIN];
  const brow = lm[FACE_FOREHEAD];
  const nose = lm[FACE_NOSE] ?? chin;
  const left = lm[FACE_LEFT_EAR];
  const right = lm[FACE_RIGHT_EAR];
  if (!chin || !brow || !left || !right) return null;
  const faceW = map.seg(left, right);
  const faceH = map.seg(brow, chin);
  const head = headPose(xf, left, right, chin, brow);

  if (kind === "earring") {
    const drop = (chin.y - (left.y + right.y) / 2) * 0.2;
    const l = map.pt(left.x + (left.x - chin.x) * 0.18, left.y + drop);
    const r = map.pt(right.x + (right.x - chin.x) * 0.18, right.y + drop);
    const lobe = Math.max(faceW * 0.052, 0.015);
    const lean = head.yaw * 0.35;
    return [
      poseAnchor(l.x, l.y, lean, lobe, { ax: 0, ay: -1, az: 0, ux: head.ux, uy: head.uy, uz: head.uz }),
      poseAnchor(r.x, r.y, -lean, lobe, { ax: 0, ay: -1, az: 0, ux: head.ux, uy: head.uy, uz: head.uz }),
    ];
  }

  if (kind === "pendant") {
    const p = map.pt(chin.x + head.yaw * 0.04, chin.y + faceH * (0.4 + head.pitch * 0.12));
    return [poseAnchor(p.x, p.y, head.yaw * 0.5, Math.max(faceW, 0.12), { ax: 1, ay: 0, az: 0, ux: head.ux, uy: head.uy, uz: head.uz })];
  }

  const n = map.pt(nose.x + head.yaw * 0.03, chin.y + faceH * (0.16 + head.pitch * 0.1));
  return [poseAnchor(n.x, n.y, head.yaw * 0.4, Math.max(faceW * 1.12, 0.16), { ax: 1, ay: 0, az: 0, ux: head.ux, uy: head.uy, uz: head.uz })];
}

function viewAxis(worldDelta: Pt, map: Mapper, a: Pt, b: Pt, _mirror: boolean) {
  const screen = map.delta(a, b);
  const sx = screen.x;
  const sy = -screen.y;
  const sz = clamp(-worldDelta.z * 3.2, -0.75, 0.75);
  return norm3({ ax: sx || worldDelta.x, ay: sy || -worldDelta.y, az: sz });
}

function palmNormal(world: Landmark[], lm: NormalizedLandmark[], map: Mapper, mirror: boolean) {
  const w = world[WRIST];
  const i = world[INDEX_MCP];
  const p = world[PINKY_MCP];
  if (w && i && p) {
    const vx = sub(i, w);
    const vy = sub(p, w);
    const n = cross(vx, vy);
    // Stone on the back of the hand: flip so +Z (toward camera) when the back faces us.
    if (n.z < 0) {
      n.x *= -1;
      n.y *= -1;
      n.z *= -1;
    }
    const len = Math.hypot(n.x, n.y, n.z) || 1;
    return {
      ux: ((mirror ? -1 : 1) * n.x) / len,
      uy: -n.y / len,
      uz: Math.max(n.z / len, 0.55),
    };
  }
  const screen = map.delta(lm[INDEX_MCP], lm[PINKY_MCP]);
  return { ux: -screen.y, uy: (mirror ? -1 : 1) * screen.x, uz: 0.85 };
}

function headPose(data: number[] | undefined, left: Pt, right: Pt, chin: Pt, brow: Pt) {
  if (data && data.length >= 16) {
    // Column-major 4×4. Forward is roughly -Z of the head.
    const fx = data[8];
    const fy = data[9];
    const fz = data[10];
    const yaw = Math.atan2(fx, Math.max(fz, 0.08));
    const pitch = Math.atan2(-fy, Math.hypot(fx, fz));
    return { yaw, pitch, ux: fx * 0.25, uy: -fy * 0.2, uz: 0.92 };
  }
  const yaw = Math.atan2(right.x - left.x, 0.35) * 0; // unused fallback
  void yaw;
  const dx = (left.x + right.x) / 2 - (chin.x + brow.x) / 2;
  return { yaw: dx * 2.4, pitch: (chin.y - brow.y) * 0.2, ux: 0, uy: 0, uz: 1 };
}

type Mapper = {
  pt: (nx: number, ny: number) => { x: number; y: number };
  seg: (a: Pt, b: Pt) => number;
  delta: (a: Pt, b: Pt) => { x: number; y: number };
};

function mapper(srcW: number, srcH: number, stageW: number, stageH: number, mirror: boolean): Mapper {
  const s = Math.max(stageW / srcW, stageH / srcH);
  const w = srcW * s;
  const h = srcH * s;
  const ox = (stageW - w) / 2;
  const oy = (stageH - h) / 2;
  const pt = (nx: number, ny: number) => {
    const x = ox + (mirror ? 1 - nx : nx) * w;
    const y = oy + ny * h;
    return { x: x / stageW, y: y / stageH };
  };
  return {
    pt,
    seg: (a, b) => {
      const p = pt(a.x, a.y);
      const q = pt(b.x, b.y);
      return Math.hypot(p.x - q.x, p.y - q.y);
    },
    delta: (a, b) => {
      const p = pt(a.x, a.y);
      const q = pt(b.x, b.y);
      return { x: q.x - p.x, y: q.y - p.y };
    },
  };
}

function pickHand(
  landmarks: NormalizedLandmark[][] | undefined,
  world: Landmark[][] | undefined,
  locked: number,
  kind: TryOnKind,
) {
  if (!landmarks?.length) return null;
  if (locked >= 0 && landmarks[locked]?.length >= 18) {
    return { index: locked, lm: landmarks[locked], world: world?.[locked] };
  }
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm?.length) continue;
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const p of lm) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const area = (maxX - minX) * (maxY - minY);
    const finger = Math.hypot((lm[RING_PIP]?.x ?? 0) - (lm[RING_MCP]?.x ?? 0), (lm[RING_PIP]?.y ?? 0) - (lm[RING_MCP]?.y ?? 0));
    const palm = Math.hypot((lm[MIDDLE_MCP]?.x ?? 0) - (lm[WRIST]?.x ?? 0), (lm[MIDDLE_MCP]?.y ?? 0) - (lm[WRIST]?.y ?? 0)) || 0.001;
    const pose = kind === "ring" ? 0.55 + finger / palm : 1;
    const score = area * pose;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return landmarks[best] ? { index: best, lm: landmarks[best], world: world?.[best] } : null;
}

function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

function cross(a: Pt, b: Pt): Pt {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * t };
}

function norm3(v: { ax: number; ay: number; az: number }) {
  const n = Math.hypot(v.ax, v.ay, v.az) || 1;
  return { ax: v.ax / n, ay: v.ay / n, az: v.az / n };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function nextTs(last: number) {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  return now <= last ? last + 1 : now;
}
