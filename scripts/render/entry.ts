import * as THREE from "three";
import { buildJewel, buildStudioEnvironment, buildGemEnvironment, setGemEnvironment, frameObject, type JewelSpec, type ViewKey } from "../../src/lib/jewels/builders";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
const env = buildStudioEnvironment(renderer);
setGemEnvironment(buildGemEnvironment(renderer));

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.5, "rgba(0,0,0,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const shadowTex = shadowTexture();

(window as any).renderJewel = (spec: JewelSpec, view: ViewKey, w: number, h: number, ss = 2) => {
  renderer.setPixelRatio(1);
  renderer.setSize(w * ss, h * ss, false);
  const scene = new THREE.Scene();
  scene.environment = env;
  const obj = buildJewel(spec);
  if (view === "hero") obj.rotation.y += -0.25;
  scene.add(obj);
  const camera = new THREE.PerspectiveCamera(26, w / h, 0.01, 100);
  const { box } = frameObject(obj, camera, view, spec.design);
  const size = box.getSize(new THREE.Vector3());
  const sh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.set(box.getCenter(new THREE.Vector3()).x, box.min.y - 0.02, 0);
  sh.scale.set(Math.max(size.x, 1) * 1.3, Math.max(size.z, 0.6) * 1.6, 1);
  scene.add(sh);
  renderer.render(scene, camera);
  // downsample for anti-aliasing
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(renderer.domElement, 0, 0, w, h);
  return out.toDataURL("image/webp", 0.88);
};
(window as any).ready = true;
