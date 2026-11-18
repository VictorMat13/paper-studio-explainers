import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import type { PuffSpec } from "./types";
import { BOX } from "./materials";
import { clampN, hash01 } from "./util";

// Block particles, deterministic from (seed, t): landing dust, block-break bits, the respawn column.
// One InstancedMesh per puff; matrices are rewritten each frame from t (nothing animates on its own).

const DEFAULT_COL: Record<NonNullable<PuffSpec["kind"]>, [number, number, number]> = {
  dust: [196, 186, 164],
  break: [108, 80, 46],
  spawn: [250, 250, 246],
};
const DEFAULT_N: Record<NonNullable<PuffSpec["kind"]>, number> = { dust: 12, break: 14, spawn: 18 };

const matCache: Record<string, THREE.Material> = {};
const puffMat = (kind: string, c: [number, number, number]) => {
  const key = kind + c.join(",");
  if (matCache[key]) return matCache[key];
  const color = new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  const m = kind === "spawn" ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color });
  matCache[key] = m;
  return m;
};

const dummy = new THREE.Object3D();

/** where particle i of a puff is at t (position, size); pure */
export function puffParticle(p: PuffSpec, i: number): { x: number; y: number; z: number; s: number } {
  const kind = p.kind ?? "dust";
  const seed = p.seed ?? 1;
  const t = clampN(p.t, 0, 1);
  const spread = p.spread ?? 1;
  const h1 = hash01(seed, i, 1),
    h2 = hash01(seed, i, 2),
    h3 = hash01(seed, i, 3);
  const a = h1 * Math.PI * 2;
  const base = p.size ?? (kind === "spawn" ? 0.1 : 0.14);
  if (kind === "break") {
    const sp = (0.8 + 1.6 * h2) * spread;
    const vy = 2.2 + 2.4 * h3;
    const tt = t * 0.9;
    return {
      x: p.x + Math.cos(a) * sp * tt,
      y: p.y + vy * tt - 6.5 * tt * tt,
      z: p.z + Math.sin(a) * sp * tt,
      s: base * (0.7 + 0.6 * h3) * (1 - t * t),
    };
  }
  if (kind === "spawn") {
    const r = 0.45 * Math.sqrt(h2) * spread;
    const rise = (0.6 + 2.4 * h3) * (1 - Math.pow(1 - t, 2));
    return { x: p.x + Math.cos(a) * r, y: p.y + 0.1 + rise, z: p.z + Math.sin(a) * r, s: base * (0.6 + 0.8 * h1) * (1 - t) };
  }
  // dust: a soft ring rolling outward and up a little, shrinking
  const out = 1 - Math.pow(1 - t, 3);
  const r = (0.35 + 0.9 * h2) * spread * out;
  return { x: p.x + Math.cos(a) * r, y: p.y + 0.12 + 0.55 * h3 * out, z: p.z + Math.sin(a) * r, s: base * (1.2 + 0.8 * h1) * (1 - t) };
}

export const Puff: React.FC<{ p: PuffSpec }> = ({ p }) => {
  const kind = p.kind ?? "dust";
  const n = p.n ?? DEFAULT_N[kind];
  const c = p.color ?? DEFAULT_COL[kind];
  const im = useMemo(() => {
    const m = new THREE.InstancedMesh(BOX, puffMat(kind, c), n);
    m.frustumCulled = false;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, n, c[0], c[1], c[2]]);
  useLayoutEffect(() => () => {
    im.dispose();
  }, [im]);
  useLayoutEffect(() => {
    for (let i = 0; i < n; i++) {
      const q = puffParticle(p, i);
      dummy.position.set(q.x, q.y, q.z);
      const s = Math.max(1e-4, q.s);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, hash01(p.seed ?? 1, i, 4) * 3, 0);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  const visible = p.t > 0 && p.t < 1;
  return <primitive object={im} visible={visible} />;
};

export const Puffs: React.FC<{ puffs?: PuffSpec[] }> = ({ puffs }) => (
  <>
    {(puffs ?? []).map((p, i) => (
      <Puff key={i} p={p} />
    ))}
  </>
);
