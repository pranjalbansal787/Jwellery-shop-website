"use client";
/**
 * Live WebGL jewellery. Loaded only via next/dynamic (ssr:false) and only when needed:
 * never part of the initial bundle for pages that don't show 3D.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { MotionValue } from "motion/react";
import { buildJewel, buildStudioEnvironment, frameObject, type JewelSpec } from "@/lib/jewels/builders";
import type { TryOnAnchor, TryOnKind } from "@/lib/try-on/kind";

function Studio() {
  const { gl, scene } = useThree();
  const studioEnv = useRef<THREE.Texture | null>(null);
  useEffect(() => {
    const setup = () => {
      studioEnv.current?.dispose();
      const env = buildStudioEnvironment(gl);
      scene.environment = env;
      studioEnv.current = env;
    };
    setup();
    const canvas = gl.domElement;
    const onLost = (e: Event) => e.preventDefault();
    const onRestored = () => setup();
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      scene.environment = null;
      studioEnv.current?.dispose();
      studioEnv.current = null;
    };
  }, [gl, scene]);
  return null;
}

function useJewel(spec: JewelSpec) {
  const key = `${spec.design}|${spec.metal}|${spec.gem}|${spec.shape}|${spec.size}`;
  return useMemo(() => {
    const obj = buildJewel(spec);
    // Each canvas must own its materials — a shared cache cannot hold env maps from two WebGL contexts.
    obj.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || !o.material) return;
      const cloneOne = (m: THREE.Material) => {
        const next = m.clone();
        if (next instanceof THREE.MeshPhysicalMaterial) {
          // Use this canvas's scene.environment. A texture from another WebGL context renders black.
          next.envMap = null;
        }
        return next;
      };
      o.material = Array.isArray(o.material) ? o.material.map(cloneOne) : cloneOne(o.material);
    });
    return obj;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/* ------------------------------------------------------------------ hero */

function HeroJewel({ spec, progress, level }: { spec: JewelSpec; progress?: MotionValue<number>; level: number }) {
  const obj = useJewel(spec);
  const group = useRef<THREE.Group>(null);
  const { camera, pointer } = useThree();
  const base = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 24;
    const { target, box } = frameObject(obj, cam, "hero", spec.design, 2.0, true);
    // lift the jewel into the upper part of the frame so it never collides with the headline
    const lift = (box.max.y - box.min.y) * 0.3;
    target.y -= lift;
    cam.position.y -= lift;
    base.current = { pos: cam.position.clone(), target };
  }, [obj, camera, spec.design]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g || !base.current) return;
    const p = progress?.get() ?? 0;
    const t = state.clock.elapsedTime;
    // slow idle rotation + scroll-driven turn
    g.rotation.y = t * 0.18 * level + p * Math.PI * 1.4;
    g.rotation.x = Math.sin(t * 0.4) * 0.04 * level;
    g.position.y = Math.sin(t * 0.7) * 0.03 * level;
    // camera approaches the stone as the story scrolls; pointer adds gentle parallax
    const cam = camera as THREE.PerspectiveCamera;
    const zoom = 1 - Math.min(p, 1) * 0.42;
    const desired = base.current.target.clone().add(base.current.pos.clone().sub(base.current.target).multiplyScalar(zoom));
    const px = p < 0.04 ? 0 : pointer.x;
    const py = p < 0.04 ? 0 : pointer.y;
    desired.x += px * 0.35 * level;
    desired.y += py * 0.2 * level + p * 0.08;
    const k = p < 0.04 ? 1 : 1 - Math.pow(0.001, dt);
    cam.position.lerp(desired, k);
    cam.lookAt(base.current.target.clone().setY(base.current.target.y + p * 0.1));
  });

  return (
    <group ref={group}>
      <primitive object={obj} />
    </group>
  );
}

export function HeroScene({ spec, progress, level = 1, active: _active = true, onReady }: { spec: JewelSpec; progress?: MotionValue<number>; level?: number; active?: boolean; onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, powerPreference: "high-performance" }}
      camera={{ fov: 24, near: 0.05, far: 100, position: [0, 0, 8] }}
      onCreated={() => onReady?.()}
      aria-hidden
    >
      <Studio />
      <HeroJewel spec={spec} progress={progress} level={level} />
    </Canvas>
  );
}

/* ------------------------------------------------------------------ viewer */

export interface ViewerHandle {
  reset: () => void;
  zoom: (dir: 1 | -1) => void;
}

function ViewerJewel({ spec, controls, autoRotate }: { spec: JewelSpec; controls: React.RefObject<OrbitControlsImpl | null>; autoRotate: boolean }) {
  const obj = useJewel(spec);
  const { camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const { target } = frameObject(obj, cam, "front", spec.design, 1.2, true);
    const c = controls.current;
    if (c) {
      c.target.copy(target);
      const d = cam.position.distanceTo(target);
      c.minDistance = d * 0.45;
      c.maxDistance = d * 1.6;
      c.update();
      c.saveState();
    }
  }, [obj, camera, controls, spec.design]);
  return (
    <>
      <primitive object={obj} />
      <OrbitControls ref={controls} enablePan={false} enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={0.8} makeDefault />
    </>
  );
}

/* ------------------------------------------------------------------ try-on */

const X_AXIS = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3();
const Z_AXIS = new THREE.Vector3();
const BASIS = new THREE.Matrix4();
const CAM_DIR = new THREE.Vector3(0, 0, 1);

function holeRef(kind: TryOnKind, design: JewelSpec["design"]) {
  if (kind === "ring") return 1.05;
  if (kind === "bangle") return 5.2;
  if (kind === "bracelet") return 6;
  if (kind === "necklace") return 5.4;
  if (kind === "pendant") return 3.6;
  if (design === "hoops") return 1.35;
  if (design === "drops") return 1.15;
  return 1.25;
}

const TARGET_POS = new THREE.Vector3();
const TARGET_SCALE = new THREE.Vector3();
const TARGET_QUAT = new THREE.Quaternion();
const TMP_QUAT = new THREE.Quaternion();

function poseFromAnchor(kind: TryOnKind, a: TryOnAnchor, twist: number) {
  Z_AXIS.set(a.ax, a.ay, a.az);
  if (Z_AXIS.lengthSq() < 1e-6) Z_AXIS.set(Math.cos(a.angle), -Math.sin(a.angle), 0);
  Z_AXIS.normalize();
  Y_AXIS.set(a.ux, a.uy, a.uz);
  if (Y_AXIS.lengthSq() < 1e-6) Y_AXIS.copy(CAM_DIR);
  Y_AXIS.normalize();

  if (kind === "bracelet") {
    Y_AXIS.copy(Z_AXIS);
    Z_AXIS.copy(CAM_DIR);
    X_AXIS.crossVectors(Y_AXIS, Z_AXIS);
    if (X_AXIS.lengthSq() < 1e-6) X_AXIS.set(1, 0, 0);
    X_AXIS.normalize();
    Z_AXIS.crossVectors(X_AXIS, Y_AXIS).normalize();
    TARGET_QUAT.setFromRotationMatrix(BASIS.makeBasis(X_AXIS, Y_AXIS, Z_AXIS));
    if (twist) TARGET_QUAT.multiply(TMP_QUAT.setFromAxisAngle(Y_AXIS, twist));
    return;
  }

  if (kind === "bangle") {
    Y_AXIS.copy(CAM_DIR);
    X_AXIS.crossVectors(Y_AXIS, Z_AXIS);
    if (X_AXIS.lengthSq() < 1e-6) X_AXIS.set(1, 0, 0);
    X_AXIS.normalize();
    Y_AXIS.crossVectors(Z_AXIS, X_AXIS).normalize();
    TARGET_QUAT.setFromRotationMatrix(BASIS.makeBasis(X_AXIS, Y_AXIS, Z_AXIS));
    if (twist) TARGET_QUAT.multiply(TMP_QUAT.setFromAxisAngle(Z_AXIS, twist));
    return;
  }

  if (kind === "ring") {
    Y_AXIS.lerp(CAM_DIR, 0.42).normalize();
    X_AXIS.crossVectors(Y_AXIS, Z_AXIS);
    if (X_AXIS.lengthSq() < 1e-6) X_AXIS.crossVectors(CAM_DIR, Z_AXIS);
    if (X_AXIS.lengthSq() < 1e-6) X_AXIS.set(1, 0, 0);
    X_AXIS.normalize();
    Y_AXIS.crossVectors(Z_AXIS, X_AXIS).normalize();
    TARGET_QUAT.setFromRotationMatrix(BASIS.makeBasis(X_AXIS, Y_AXIS, Z_AXIS));
    if (twist) TARGET_QUAT.multiply(TMP_QUAT.setFromAxisAngle(Z_AXIS, twist));
    return;
  }

  TARGET_QUAT.setFromAxisAngle(CAM_DIR, a.angle + twist);
}

function follow(obj: THREE.Object3D, snap: boolean, dt: number) {
  if (snap) {
    obj.position.copy(TARGET_POS);
    obj.quaternion.copy(TARGET_QUAT);
    obj.scale.copy(TARGET_SCALE);
    return;
  }
  obj.position.lerp(TARGET_POS, 1 - Math.exp(-dt * 18));
  obj.quaternion.slerp(TARGET_QUAT, 1 - Math.exp(-dt * 14));
  obj.scale.lerp(TARGET_SCALE, 1 - Math.exp(-dt * 10));
}

function TryOnJewel({
  spec,
  kind,
  anchors,
  scale,
  twist,
}: {
  spec: JewelSpec;
  kind: TryOnKind;
  anchors: RefObject<TryOnAnchor[]>;
  scale: number;
  twist: number;
}) {
  const obj = useJewel(spec);
  const group = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const warmed = useRef(false);
  const { viewport } = useThree();
  const pair = kind === "earring";
  const specKey = `${spec.design}|${spec.metal}|${spec.gem}|${spec.shape}|${spec.size}`;
  useEffect(() => {
    warmed.current = false;
  }, [specKey, kind]);

  useEffect(() => {
    if (!pair) return;
    const kids = [...obj.children];
    kids.forEach((child) => {
      child.position.x = 0;
    });
    if (kids[0] && left.current) left.current.add(kids[0]);
    if (kids[1] && right.current) right.current.add(kids[1]);
    else if (kids[0] && right.current) right.current.add(kids[0].clone(true));
    return () => {
      kids.forEach((child) => obj.add(child));
    };
  }, [obj, pair]);

  useFrame((_, dt) => {
    const list = anchors.current;
    if (!list || list.length === 0) return;
    const step = Math.min(dt, 0.05);

    if (pair) {
      const holders = [left.current, right.current];
      holders.forEach((h, i) => {
        const a = list[i] ?? list[0];
        if (!h || !a) return;
        TARGET_POS.set((a.x - 0.5) * viewport.width, (0.5 - a.y) * viewport.height, 0);
        const feature = a.size * viewport.width * scale;
        TARGET_SCALE.setScalar(Math.max(feature / 0.72, 0.0001));
        poseFromAnchor(kind, a, twist + (i === 0 ? 0.08 : -0.08));
        const far = !warmed.current || h.position.distanceTo(TARGET_POS) > viewport.width * 0.4;
        follow(h, far, step);
      });
      warmed.current = true;
      return;
    }

    const g = group.current;
    const a = list[0];
    if (!g || !a) return;
    TARGET_POS.set((a.x - 0.5) * viewport.width, (0.5 - a.y) * viewport.height, 0);
    const feature = a.size * viewport.width * scale;
    const ref = holeRef(kind, spec.design);
    const k = kind === "pendant" ? 0.72 : kind === "necklace" ? 1.15 : kind === "ring" ? 1.32 : kind === "bangle" ? 1.16 : 1;
    TARGET_SCALE.setScalar(Math.max((feature * k) / ref, 0.0001));
    poseFromAnchor(kind, a, twist);
    const far = !warmed.current || g.position.distanceTo(TARGET_POS) > viewport.width * 0.4;
    follow(g, far, step);
    warmed.current = true;
  });

  if (pair) {
    return (
      <>
        <group ref={left} />
        <group ref={right} />
        <primitive object={obj} visible={false} />
      </>
    );
  }

  return (
    <group ref={group}>
      <primitive object={obj} />
    </group>
  );
}

export function TryOnScene({
  spec,
  kind,
  anchors,
  scale,
  twist,
  onCanvas,
}: {
  spec: JewelSpec;
  kind: TryOnKind;
  anchors: RefObject<TryOnAnchor[]>;
  scale: number;
  twist: number;
  onCanvas?: (el: HTMLCanvasElement) => void;
}) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 40], zoom: 1, near: 0.1, far: 200 }}
      onCreated={({ gl }) => onCanvas?.(gl.domElement)}
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <Studio />
      <TryOnJewel spec={spec} kind={kind} anchors={anchors} scale={scale} twist={twist} />
    </Canvas>
  );
}

export const ViewerScene = forwardRef<ViewerHandle, { spec: JewelSpec; autoRotate: boolean; onInteract?: () => void }>(function ViewerScene({ spec, autoRotate, onInteract }, ref) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  useImperativeHandle(ref, () => ({
    reset: () => controls.current?.reset(),
    zoom: (dir) => {
      const c = controls.current;
      if (!c) return;
      const cam = c.object as THREE.PerspectiveCamera;
      const v = cam.position.clone().sub(c.target).multiplyScalar(dir > 0 ? 0.82 : 1.2);
      const len = THREE.MathUtils.clamp(v.length(), c.minDistance, c.maxDistance);
      cam.position.copy(c.target).add(v.setLength(len));
      c.update();
    },
  }));
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      camera={{ fov: 26, near: 0.05, far: 100, position: [0, 0, 8] }}
      onPointerDown={onInteract}
    >
      <Studio />
      <ViewerJewel spec={spec} controls={controls} autoRotate={autoRotate} />
    </Canvas>
  );
});
