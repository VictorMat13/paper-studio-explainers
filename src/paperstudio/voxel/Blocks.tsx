import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { BOX, mat, type BlockKind } from "./materials";
import { blockKeyOf, buildBlocks, C, heightAt, treeCells, type Block } from "./island";
import { Puff } from "./Particles";
import type { FallingSpec, WorldSpec } from "./types";
import { clampN, hash01 } from "./util";

// The block world as one InstancedMesh per block kind (the page's addBlockInstances). The block list and the
// instance matrices are cached per process by the spec's block fields (blockKeyOf), so a shot whose camera, agents
// or sky move every frame never rebuilds its blocks; each canvas makes its own InstancedMesh objects from the cached
// matrices once (cheap) so two canvases can show the same island at once (the hook-to-body page turn).

type KindData = { k: BlockKind; m: Float32Array; n: number };
type BlockData = { kinds: KindData[]; trees: Map<number, Block[]> };
const CACHE = new Map<string, BlockData>();
const CACHE_MAX = 48;

const toKinds = (list: Block[]): KindData[] => {
  const by: Record<string, Block[]> = {};
  const order: string[] = [];
  for (const b of list) {
    if (!by[b.k]) {
      by[b.k] = [];
      order.push(b.k);
    }
    by[b.k].push(b);
  }
  return order.map((k) => {
    const arr = by[k];
    const m = new Float32Array(arr.length * 16);
    arr.forEach((b, i) => {
      const sy = b.sy || 1;
      const o = i * 16;
      m[o] = 1;
      m[o + 5] = sy;
      m[o + 10] = 1;
      m[o + 12] = b.x + 0.5;
      m[o + 13] = b.y + sy / 2;
      m[o + 14] = b.z + 0.5;
      m[o + 15] = 1;
    });
    return { k: k as BlockKind, m, n: arr.length };
  });
};

/** the cached static block data for a spec (trees that are falling are kept apart in `trees`) */
export function blockData(spec: WorldSpec): BlockData {
  const key = blockKeyOf(spec);
  const hit = CACHE.get(key);
  if (hit) {
    CACHE.delete(key);
    CACHE.set(key, hit);
    return hit;
  }
  const list = buildBlocks(spec);
  const trees = new Map<number, Block[]>();
  const stat: Block[] = [];
  for (const b of list) {
    if (b.tree !== undefined) {
      if (!trees.has(b.tree)) trees.set(b.tree, []);
      (trees.get(b.tree) as Block[]).push(b);
    } else stat.push(b);
  }
  const data = { kinds: toKinds(stat), trees };
  CACHE.set(key, data);
  if (CACHE.size > CACHE_MAX) {
    const first = CACHE.keys().next().value;
    if (first !== undefined) CACHE.delete(first);
  }
  return data;
}

const makeInstanced = (kinds: KindData[]) => {
  const g = new THREE.Group();
  for (const kd of kinds) {
    const im = new THREE.InstancedMesh(BOX, mat(kd.k), kd.n);
    (im.instanceMatrix.array as Float32Array).set(kd.m);
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    g.add(im);
  }
  return g;
};
const disposeGroup = (g: THREE.Group) =>
  g.children.forEach((c) => {
    if ((c as THREE.InstancedMesh).isInstancedMesh) (c as THREE.InstancedMesh).dispose();
  });

/** the static blocks of a spec */
export const Blocks: React.FC<{ spec: WorldSpec }> = ({ spec }) => {
  const data = blockData(spec);
  const group = useMemo(() => makeInstanced(data.kinds), [data]);
  useLayoutEffect(() => () => disposeGroup(group), [group]);
  return <primitive object={group} />;
};

// ---- animated extra blocks (`blocks` entries with `appear`): each grows from its bottom face, eased
const dummy = new THREE.Object3D();
const easeOut = (t: number) => 1 - Math.pow(1 - clampN(t, 0, 1), 3);

export const AnimatedBlocks: React.FC<{ spec: WorldSpec }> = ({ spec }) => {
  const list = (spec.blocks ?? []).filter((b) => b.appear !== undefined);
  const shape = JSON.stringify(list.map((b) => [b.k, b.x, b.y, b.z]));
  const meshes = useMemo(() => {
    const by: Record<string, number[]> = {};
    const order: string[] = [];
    list.forEach((b, i) => {
      if (!by[b.k]) {
        by[b.k] = [];
        order.push(b.k);
      }
      by[b.k].push(i);
    });
    return order.map((k) => {
      const im = new THREE.InstancedMesh(BOX, mat(k), by[k].length);
      im.frustumCulled = false;
      return { im, idx: by[k] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);
  useLayoutEffect(
    () => () => {
      meshes.forEach((m) => m.im.dispose());
    },
    [meshes],
  );
  useLayoutEffect(() => {
    for (const { im, idx } of meshes) {
      idx.forEach((bi, j) => {
        const b = list[bi];
        const s = Math.max(1e-4, easeOut(b.appear ?? 1));
        dummy.position.set(b.x + 0.5, b.y + s / 2, b.z + 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        im.setMatrixAt(j, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m.im} />
      ))}
    </>
  );
};

// ---- a felled tree: the trunk tips over around the stump, the canopy drops off, block-break particles, stump stays
const LEAF_GREEN: [number, number, number] = [62, 110, 38];
const LOG_BROWN: [number, number, number] = [108, 80, 46];
const TIP_MAX = (86 * Math.PI) / 180;
const G_FALL = 140; // blocks per progress^2 for the dropping canopy

/** the trunk's tip angle (radians) and shrink (1..0) at progress t */
export const fallPose = (t: number) => {
  const p = clampN(t / 0.7, 0, 1);
  const angle = TIP_MAX * p * p;
  const shrink = 1 - clampN((t - 0.72) / 0.14, 0, 1);
  return { angle, shrink };
};

type LeafPlan = { rel: THREE.Vector3; detach: number; hx: number; hz: number };

/** where canopy block j is at progress t: position, rotation, scale (pure) */
function leafAt(L: LeafPlan, pivot: THREE.Vector3, axis: THREE.Vector3, dir: THREE.Vector3, t: number) {
  const q = new THREE.Quaternion().setFromAxisAngle(axis, fallPose(Math.min(t, L.detach)).angle);
  const p0 = L.rel.clone().applyQuaternion(q).add(pivot);
  if (t <= L.detach) return { pos: p0, q, s: 1, land: -1 };
  const tau = t - L.detach;
  const gy = heightAt(Math.floor(p0.x), Math.floor(p0.z)) + 0.5;
  const drop = Math.max(0, p0.y - gy);
  const tauL = Math.sqrt((2 * drop) / G_FALL);
  const ft = Math.min(tau, tauL);
  const pos = new THREE.Vector3(p0.x + dir.x * 1.6 * ft + L.hx * ft, p0.y - 0.5 * G_FALL * ft * ft, p0.z + dir.z * 1.6 * ft + L.hz * ft);
  const s = tau <= tauL ? 1 : 1 - clampN((tau - tauL) / 0.05, 0, 1);
  return { pos, q, s, land: L.detach + tauL };
}

export const FallingTree: React.FC<{ spec: WorldSpec; f: FallingSpec }> = ({ spec, f }) => {
  const data = blockData(spec);
  const blocks = data.trees.get(f.i);
  const cell = treeCells(spec)[f.i];
  const cx = cell ? cell[0] : -1,
    cz = cell ? cell[1] : -1;
  const built = useMemo(() => {
    if (!blocks || cx < 0) return null;
    const g = heightAt(cx, cz);
    const pivot = new THREE.Vector3(cx + 0.5, g + 1, cz + 0.5);
    const logs = blocks.filter((b) => b.k === "log");
    const leaves = blocks.filter((b) => b.k !== "log");
    // trunk: logs in a group pivoting at the stump top, shrinking about their own centre at the end
    const cen = new THREE.Vector3();
    logs.forEach((b) => cen.add(new THREE.Vector3(b.x + 0.5 - pivot.x, b.y + 0.5 - pivot.y, b.z + 0.5 - pivot.z)));
    if (logs.length) cen.divideScalar(logs.length);
    // toKinds puts each block's centre at (x + 0.5, y + 0.5, z + 0.5): shift so it lands at centre - pivot - centroid
    const trunk = makeInstanced(toKinds(logs.map((b) => ({ ...b, x: b.x - pivot.x - cen.x, y: b.y - pivot.y - cen.y, z: b.z - pivot.z - cen.z }))));
    const mid = new THREE.Group();
    mid.position.copy(cen);
    mid.add(trunk);
    const outer = new THREE.Group();
    outer.position.copy(pivot);
    outer.add(mid);
    // canopy: one InstancedMesh, every block moved each frame
    const canopy = new THREE.InstancedMesh(BOX, mat("leaves"), Math.max(1, leaves.length));
    canopy.frustumCulled = false;
    canopy.count = leaves.length;
    const plan: LeafPlan[] = leaves.map((b, j) => ({
      rel: new THREE.Vector3(b.x + 0.5 - pivot.x, b.y + 0.5 - pivot.y, b.z + 0.5 - pivot.z),
      // lower canopy rows let go first, with a seeded stagger
      detach: 0.12 + 0.05 * clampN(b.y - g - 2, 0, 4) + 0.12 * hash01(f.i, j, 7),
      hx: (hash01(f.i, j, 8) - 0.5) * 2,
      hz: (hash01(f.i, j, 9) - 0.5) * 2,
    }));
    return { outer, mid, trunk, canopy, plan, pivot, cen };
  }, [blocks, cx, cz, f.i]);
  useLayoutEffect(
    () => () => {
      if (built) {
        disposeGroup(built.trunk);
        built.canopy.dispose();
      }
    },
    [built],
  );
  const dirDeg = cell ? f.dir ?? (Math.atan2(cell[0] - C, cell[1] - C) * 180) / Math.PI : 0;
  const dr = (dirDeg * Math.PI) / 180;
  const dir = new THREE.Vector3(Math.sin(dr), 0, Math.cos(dr));
  const axis = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
  const t = clampN(f.t, 0, 1);
  useLayoutEffect(() => {
    if (!built) return;
    const { angle, shrink } = fallPose(t);
    built.outer.quaternion.setFromAxisAngle(axis, angle);
    built.mid.scale.setScalar(Math.max(1e-4, shrink));
    built.outer.visible = shrink > 0.001;
    built.plan.forEach((L, j) => {
      const a = leafAt(L, built.pivot, axis, dir, t);
      dummy.position.copy(a.pos);
      dummy.quaternion.copy(a.q);
      const s = Math.max(1e-4, a.s);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      built.canopy.setMatrixAt(j, dummy.matrix);
    });
    built.canopy.instanceMatrix.needsUpdate = true;
  });
  if (!built || !cell) return null;
  // particles: a few green bursts where canopy blocks land, the trunk breaking up brown, dust on the ground
  const puffs: React.ReactNode[] = [];
  if (f.puff !== false) {
    const reps = [0, Math.floor(built.plan.length / 3), Math.floor((2 * built.plan.length) / 3), built.plan.length - 1].filter((j, k, a) => j >= 0 && a.indexOf(j) === k);
    reps.forEach((j, k) => {
      const L = built.plan[j];
      if (!L) return;
      const end = leafAt(L, built.pivot, axis, dir, 1);
      const pt = (t - end.land) / 0.3;
      if (end.land > 0 && pt > 0 && pt < 1)
        puffs.push(<Puff key={"lp" + k} p={{ kind: "break", x: end.pos.x, y: end.pos.y, z: end.pos.z, t: pt, n: 10, seed: 11 + f.i * 7 + k, color: LEAF_GREEN, spread: 1.4, size: 0.18 }} />);
    });
    const imp = built.cen.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, TIP_MAX)).add(built.pivot);
    const tt = (t - 0.7) / 0.3;
    if (tt > 0 && tt < 1) {
      puffs.push(<Puff key="tp" p={{ kind: "break", x: imp.x, y: imp.y, z: imp.z, t: tt, n: 12, seed: 31 + f.i, color: LOG_BROWN, spread: 1.3, size: 0.18 }} />);
      puffs.push(<Puff key="td" p={{ kind: "dust", x: imp.x, y: Math.max(heightAt(Math.floor(imp.x), Math.floor(imp.z)), imp.y - 1), z: imp.z, t: tt, n: 12, seed: 51 + f.i, spread: 2 }} />);
    }
  }
  return (
    <>
      <primitive object={built.outer} />
      <primitive object={built.canopy} visible={built.plan.length > 0} />
      {puffs}
    </>
  );
};
