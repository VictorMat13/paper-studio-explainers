import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { C } from "./island";
import type { TimeName, TimeSpec, VoxelCam } from "./types";
import { camPosition } from "./VoxelCamera";
import { clampN, lerp3, lerpN, rng } from "./util";

// Sky, fog and light from the ep09 storyboard page (`SKY`, `addSky`): a vertex-coloured dome, distance fog into the
// horizon colour, a hemisphere light + one directional sun, the square sun / moon disc facing the camera, 420 stars
// at night and 26 seeded pixel clouds. Extensions: `time` blends (number along day -> dusk -> night -> dawn, or
// { from, to, t }), the sun and the moon as two discs so a blend can set the sun and raise the moon, `sunArc`,
// `cloudDrift`. A named time renders exactly the page's sky.

type V3 = readonly [number, number, number];
type SkyRow = {
  top: V3;
  hor: V3;
  fog: V3;
  hemi: V3;
  hemiG: V3;
  hemiI: number;
  sun: V3;
  sunI: number;
  sunPos: V3;
  disc: V3;
  discPos: V3;
  stars: boolean;
};
const hx = (n: number): V3 => [(n >> 16) & 255, (n >> 8) & 255, n & 255];

/** the page's SKY table (0..255 colours, read as linear values the way the page's col() does) */
export const SKY: Record<TimeName, SkyRow> = {
  day: { top: hx(0x5a9cf0), hor: hx(0xc9e3ff), fog: hx(0xbfddff), hemi: hx(0xe6f2ff), hemiG: hx(0x6b5e46), hemiI: 1.25, sun: hx(0xffffff), sunI: 2.0, sunPos: [-18, 30, 20], disc: hx(0xfff6c4), discPos: [55, 70, -70], stars: false },
  dawn: { top: hx(0x748ad0), hor: hx(0xf4c8a0), fog: hx(0xe8c4a8), hemi: hx(0xf6d8c0), hemiG: hx(0x5a4a3a), hemiI: 1.0, sun: hx(0xffc890), sunI: 1.6, sunPos: [30, 10, 18], disc: hx(0xffc070), discPos: [80, 18, -60], stars: false },
  dusk: { top: hx(0x4e5c9c), hor: hx(0xf0a874), fog: hx(0xe0b090), hemi: hx(0xf0c8b0), hemiG: hx(0x4a3a30), hemiI: 0.95, sun: hx(0xffb070), sunI: 1.4, sunPos: [-32, 9, 16], disc: hx(0xffa850), discPos: [-85, 14, -50], stars: false },
  night: { top: hx(0x060a1e), hor: hx(0x182246), fog: hx(0x101634), hemi: hx(0x303c70), hemiG: hx(0x080812), hemiI: 0.5, sun: hx(0x90a8e0), sunI: 0.35, sunPos: [20, 30, -10], disc: hx(0xe8ecf4), discPos: [60, 72, -70], stars: true },
};

/** the page's col(): 0..255 values taken as linear-space floats */
export const col = (a: readonly number[]) => new THREE.Color(a[0] / 255, a[1] / 255, a[2] / 255);

const STOPS: TimeName[] = ["day", "dusk", "night", "dawn"];

/** a time spec as a blend of two named times */
export function resolveTime(time: TimeSpec | undefined): { a: TimeName; b: TimeName; t: number } {
  if (time === undefined) return { a: "day", b: "day", t: 0 };
  if (typeof time === "string") return { a: time, b: time, t: 0 };
  if (typeof time === "number") {
    const u = clampN(time, 0, 1) * 3;
    const seg = Math.min(2, Math.floor(u));
    return { a: STOPS[seg], b: STOPS[seg + 1], t: u - seg };
  }
  return { a: time.from, b: time.to, t: clampN(time.t, 0, 1) };
}

/** 0..1: how much of the night a time spec is (fog, stars, clouds and torch light follow it) */
export function nightness(time: TimeSpec | undefined): number {
  const { a, b, t } = resolveTime(time);
  return (a === "night" ? 1 - t : 0) + (b === "night" ? t : 0);
}

// the sun's arc (positions relative to the island centre): below east, dawn, the page's day sun, dusk, below west
const ARC: { p: number; v: V3 }[] = [
  { p: -0.3, v: [80, -16, -60] },
  { p: 0, v: SKY.dawn.discPos },
  { p: 0.4, v: SKY.day.discPos },
  { p: 1, v: SKY.dusk.discPos },
  { p: 1.3, v: [-85, -18, -50] },
];
const SUN_PHASE: Record<TimeName, number> = { dawn: 0, day: 0.4, dusk: 1, night: NaN };

const slerpPos = (a: V3, b: V3, t: number): [number, number, number] => {
  const la = Math.hypot(a[0], a[1], a[2]),
    lb = Math.hypot(b[0], b[1], b[2]);
  const va = new THREE.Vector3(a[0] / la, a[1] / la, a[2] / la);
  const vb = new THREE.Vector3(b[0] / lb, b[1] / lb, b[2] / lb);
  const ang = va.angleTo(vb);
  let v: THREE.Vector3;
  if (ang < 1e-5) v = va;
  else {
    const s = Math.sin(ang);
    v = va.multiplyScalar(Math.sin((1 - t) * ang) / s).add(vb.multiplyScalar(Math.sin(t * ang) / s));
  }
  const l = lerpN(la, lb, t);
  return [v.x * l, v.y * l, v.z * l];
};

/** sun disc position (relative to the centre) at an arc phase (0 rising east, 0.4 day, 1 setting west) */
export function sunArcPos(phase: number): [number, number, number] {
  const p = clampN(phase, ARC[0].p, ARC[ARC.length - 1].p);
  for (let i = 1; i < ARC.length; i++) {
    if (p <= ARC[i].p) {
      const k = (p - ARC[i - 1].p) / (ARC[i].p - ARC[i - 1].p);
      return slerpPos(ARC[i - 1].v, ARC[i].v, k);
    }
  }
  return [ARC[ARC.length - 1].v[0], ARC[ARC.length - 1].v[1], ARC[ARC.length - 1].v[2]];
}
const sunDiscColour = (phase: number): [number, number, number] => {
  if (phase <= 0) return [...SKY.dawn.disc] as [number, number, number];
  if (phase <= 0.4) return lerp3(SKY.dawn.disc, SKY.day.disc, phase / 0.4);
  if (phase <= 1) return lerp3(SKY.day.disc, SKY.dusk.disc, (phase - 0.4) / 0.6);
  return [...SKY.dusk.disc] as [number, number, number];
};

export type SkyState = {
  top: number[];
  hor: number[];
  fog: number[];
  hemi: number[];
  hemiG: number[];
  hemiI: number;
  sun: number[];
  sunI: number;
  sunPos: number[];
  night: number;
  fogNear: number;
  fogFar: number;
  cloudOpacity: number;
  /** sun disc: position (relative to C), colour, opacity (0 = hidden) */
  sunDisc: { pos: number[]; col: number[]; opacity: number };
  moonDisc: { pos: number[]; col: number[]; opacity: number };
};

/** everything the sky draws for a time spec (pure; named times give the page's values) */
export function skyState(time: TimeSpec | undefined, sunArc?: number, moonArc?: number, moonAt?: readonly number[]): SkyState {
  const { a, b, t } = resolveTime(time);
  const A = SKY[a],
    B = SKY[b];
  const night = nightness(time);
  // sun phase along the arc: night is "below west" after day/dusk and "below east" before dawn
  const pa = a === "night" ? (b === "dawn" ? -0.3 : 1.3) : SUN_PHASE[a];
  const pb = b === "night" ? (a === "dawn" ? -0.3 : 1.3) : SUN_PHASE[b];
  const bothNight = a === "night" && b === "night";
  const phase = sunArc ?? (bothNight ? 1.3 : lerpN(pa, pb, t));
  let sp = sunArcPos(phase);
  let discPhase = phase;
  if (sunArc === undefined && !bothNight && (a === "night") !== (b === "night")) {
    // one end is night: the sun sinks (or rises) straight down at the other end's position instead of sweeping
    const other = a === "night" ? b : a;
    discPhase = SUN_PHASE[other];
    const o = sunArcPos(discPhase);
    sp = [o[0], o[1] - night * (o[1] + 22), o[2]];
  }
  const sunOpacity = sunArc === undefined && bothNight ? 0 : clampN((sp[1] + 4) / 10, 0, 1);
  const mp = SKY.night.discPos;
  const ma = moonArc === undefined ? null : sunArcPos(moonArc);
  const moonPos = moonAt ? [moonAt[0] - C, moonAt[1], moonAt[2] - C] : ma ?? [mp[0], mp[1] - (1 - night) * 30, mp[2]];
  const moonOpacity = !moonAt && ma ? night * clampN((ma[1] + 4) / 10, 0, 1) : night;
  return {
    top: lerp3(A.top, B.top, t),
    hor: lerp3(A.hor, B.hor, t),
    fog: lerp3(A.fog, B.fog, t),
    hemi: lerp3(A.hemi, B.hemi, t),
    hemiG: lerp3(A.hemiG, B.hemiG, t),
    hemiI: lerpN(A.hemiI, B.hemiI, t),
    sun: lerp3(A.sun, B.sun, t),
    sunI: lerpN(A.sunI, B.sunI, t),
    sunPos: lerp3(A.sunPos, B.sunPos, t),
    night,
    fogNear: lerpN(38, 26, night),
    fogFar: lerpN(120, 80, night),
    cloudOpacity: lerpN(0.92, 0.35, night),
    sunDisc: { pos: sp, col: sunDiscColour(discPhase), opacity: sunOpacity },
    moonDisc: { pos: moonPos, col: [...SKY.night.disc], opacity: moonOpacity },
  };
}

/** world position of the sun or moon disc for a spec (the disc sits at island centre + its arc position), with its
 *  opacity (0 = not in the sky). Project it with projectToScreen to aim a hud wire at the moon */
export function discWorldPos(
  spec: { time?: TimeSpec; sunArc?: number; moonArc?: number; moonAt?: [number, number, number] },
  which: "sun" | "moon",
): { pos: [number, number, number]; opacity: number } {
  const s = skyState(spec.time, spec.sunArc, spec.moonArc, spec.moonAt);
  const d = which === "sun" ? s.sunDisc : s.moonDisc;
  return { pos: [C + d.pos[0], d.pos[1], C + d.pos[2]], opacity: d.opacity };
}

// ---- scene objects (built once per canvas, updated per frame)
const DOME_R = 160;
function makeDome() {
  const geo = new THREE.SphereGeometry(DOME_R, 24, 16);
  const pos = geo.attributes.position;
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  dome.position.set(C, 0, C);
  return dome;
}
function paintDome(dome: THREE.Mesh, s: SkyState) {
  const geo = dome.geometry as THREE.BufferGeometry;
  const pos = geo.attributes.position;
  const colors = geo.attributes.color as THREE.BufferAttribute;
  const top = col(s.top),
    hor = col(s.hor),
    fog = col(s.fog);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / DOME_R;
    const t = Math.pow(clampN(y, 0, 1), 0.55);
    c.copy(hor).lerp(top, t);
    if (y < 0) c.copy(hor).lerp(fog, 0.5);
    colors.setXYZ(i, c.r, c.g, c.b);
  }
  colors.needsUpdate = true;
}

const STAR_GEO = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    const n = 420,
      p = new Float32Array(n * 3);
    const R = rng(9);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283,
        e = 0.08 + R() * 1.3;
      const r = 150;
      p[i * 3] = C + Math.cos(a) * Math.cos(e) * r;
      p[i * 3 + 1] = Math.sin(e) * r;
      p[i * 3 + 2] = C + Math.sin(a) * Math.cos(e) * r;
    }
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  };
})();

const CLOUDS = (() => {
  let list: { w: number; d: number; x: number; y: number; z: number; geo: THREE.BoxGeometry }[] | null = null;
  return () => {
    if (list) return list;
    const R = rng(31);
    list = [];
    for (let i = 0; i < 26; i++) {
      const w = 6 + R() * 10,
        d = 4 + R() * 8;
      const x = C - 70 + R() * 140,
        y = 26 + R() * 3,
        z = C - 70 + R() * 140;
      list.push({ w, d, x, y, z, geo: new THREE.BoxGeometry(w, 0.7, d) });
    }
    return list;
  };
})();

type SkyObjects = {
  group: THREE.Group;
  dome: THREE.Mesh;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  sunDisc: THREE.Mesh;
  moonDisc: THREE.Mesh;
  stars: THREE.Points;
  clouds: THREE.Mesh[];
  cloudMat: THREE.MeshLambertMaterial;
  fog: THREE.Fog;
  domeKey: string;
};

function makeSky(): SkyObjects {
  const group = new THREE.Group();
  const dome = makeDome();
  group.add(dome);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  group.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  group.add(sun);
  const discMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true });
  const sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), discMat());
  const moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), discMat());
  group.add(sunDisc, moonDisc);
  const stars = new THREE.Points(STAR_GEO(), new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true }));
  group.add(stars);
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const clouds = CLOUDS().map((c) => {
    const m = new THREE.Mesh(c.geo, cloudMat);
    m.position.set(c.x, c.y, c.z);
    group.add(m);
    return m;
  });
  const fog = new THREE.Fog(0xffffff, 38, 120);
  return { group, dome, hemi, sun, sunDisc, moonDisc, stars, clouds, cloudMat, fog, domeKey: "" };
}

function disposeSky(o: SkyObjects) {
  o.dome.geometry.dispose();
  (o.dome.material as THREE.Material).dispose();
  o.sunDisc.geometry.dispose();
  o.moonDisc.geometry.dispose();
  (o.sunDisc.material as THREE.Material).dispose();
  (o.moonDisc.material as THREE.Material).dispose();
  (o.stars.material as THREE.Material).dispose();
  o.cloudMat.dispose();
}

export type SkyProps = { time?: TimeSpec; cam: VoxelCam; cloudDrift?: number; sunArc?: number; moonArc?: number; moonAt?: [number, number, number]; /** canvas height (stars keep the page's size at 1280) */ h: number };

/** the sky layer for one canvas; also owns the scene fog */
export const Sky: React.FC<SkyProps> = ({ time, cam, cloudDrift = 0, sunArc, moonArc, moonAt, h }) => {
  const scene = useThree((s) => s.scene);
  const o = useMemo(makeSky, []);
  useLayoutEffect(() => () => disposeSky(o), [o]);
  useLayoutEffect(() => {
    const s = skyState(time, sunArc, moonArc, moonAt);
    const key = [s.top, s.hor, s.fog].join(",");
    if (key !== o.domeKey) {
      paintDome(o.dome, s);
      o.domeKey = key;
    }
    o.fog.color.copy(col(s.fog));
    o.fog.near = s.fogNear;
    o.fog.far = s.fogFar;
    scene.fog = o.fog;
    o.hemi.color.copy(col(s.hemi));
    o.hemi.groundColor.copy(col(s.hemiG));
    o.hemi.intensity = s.hemiI;
    o.sun.color.copy(col(s.sun));
    o.sun.intensity = s.sunI;
    o.sun.position.set(s.sunPos[0], s.sunPos[1], s.sunPos[2]);
    const cp = camPosition(cam);
    const place = (m: THREE.Mesh, d: SkyState["sunDisc"]) => {
      m.visible = d.opacity > 0.001;
      m.position.set(C + d.pos[0], d.pos[1], C + d.pos[2]);
      (m.material as THREE.MeshBasicMaterial).color.copy(col(d.col));
      (m.material as THREE.MeshBasicMaterial).opacity = d.opacity;
      m.lookAt(cp[0], cp[1], cp[2]);
    };
    place(o.sunDisc, s.sunDisc);
    place(o.moonDisc, s.moonDisc);
    o.stars.visible = s.night > 0.001;
    const sm = o.stars.material as THREE.PointsMaterial;
    sm.opacity = s.night;
    sm.size = (1.6 * h) / 1280;
    o.cloudMat.opacity = s.cloudOpacity;
    const base = CLOUDS();
    o.clouds.forEach((m, i) => m.position.set(base[i].x + cloudDrift, base[i].y, base[i].z));
  });
  return <primitive object={o.group} />;
};
