import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { itemMat, skinKey, skinMats, skinSetOf, type SkinMats } from "./materials";
import type { ItemKind } from "./textures";
import type { AgentLook } from "./types";

// A Steve-proportion agent (the page's makeAgent box layout: 0.5 m head, 8 x 12 px body, 4 px limbs pivoting at the
// shoulder and hip) with a generated skin. Plain meshes on shared geometry and shared per-skin materials; a
// translucent agent (ghost / opacity) gets its own material copies once. Every pose value comes from props, so the
// agent is deterministic per frame.

const G = (() => {
  const limb = new THREE.BoxGeometry(0.25, 0.75, 0.25);
  limb.translate(0, -0.375, 0);
  return {
    head: new THREE.BoxGeometry(0.5, 0.5, 0.5),
    body: new THREE.BoxGeometry(0.5, 0.75, 0.25),
    limb,
    tool: new THREE.PlaneGeometry(0.6, 0.6),
    hold: new THREE.PlaneGeometry(0.4, 0.4),
  };
})();

type Mats = SkinMats & { tool: THREE.Material; hold: THREE.Material | null };

const cloneSet = (m: SkinMats, hold?: ItemKind): Mats => {
  const c = (x: THREE.Material) => {
    const y = x.clone();
    y.transparent = true;
    return y;
  };
  return { head: m.head.map(c), body: c(m.body), arm: c(m.arm), leg: c(m.leg), tool: c(itemMat("axe")), hold: hold ? c(itemMat(hold)) : null };
};
const allMats = (m: Mats) => [...m.head, m.body, m.arm, m.leg, m.tool, ...(m.hold ? [m.hold] : [])];

/** the page's limb angles for a look (radians, rotation about x): [leftArm, rightArm, leftLeg, rightLeg] */
export function limbAngles(o: AgentLook): [number, number, number, number] {
  const walking = o.walkPhase !== undefined;
  const swing = walking ? Math.sin(o.walkPhase! * Math.PI * 2) * (o.walkAmp ?? 1.4) : o.swing ?? ((o.seedv || 0) % 2 ? 0.5 : -0.3);
  let la = 0,
    ra = 0,
    ll = 0,
    rl = 0;
  const raise = o.raise === true ? 1 : typeof o.raise === "number" ? o.raise : 0;
  if (o.zombie) {
    la = -1.5;
    ra = -1.5;
    if (walking) {
      ll = -swing * 0.5;
      rl = swing * 0.5;
    }
  } else if (raise > 0 && raise >= 1 && !walking) {
    ra = -2.9;
    la = 0.2;
  } else if (o.sit) {
    ll = -1.5;
    rl = -1.5;
    la = -0.6;
    ra = -0.6;
  } else {
    la = swing * 0.6;
    ra = -swing * 0.6;
    ll = -swing * 0.5;
    rl = swing * 0.5;
    if (raise > 0) {
      // blends into the page's raised pose (right arm up, left arm 0.2, legs straight unless walking)
      ra = ra + (-2.9 - ra) * raise;
      la = la + (0.2 - la) * raise;
      if (!walking) {
        ll *= 1 - raise;
        rl *= 1 - raise;
      }
    }
  }
  if (o.tool) ra = -1.2;
  if (o.hold) ra = -1.3;
  return [la, ra, ll, rl];
}

export type AgentProps = AgentLook & { position: [number, number, number] };

export const Agent: React.FC<AgentProps> = (o) => {
  const k = skinKey(o);
  const base = skinMats(skinSetOf(k), k);
  const translucent = !!o.ghost || o.opacity !== undefined;
  const own = useMemo(() => (translucent ? cloneSet(base, o.hold) : null), [translucent, base, o.hold]);
  useLayoutEffect(() => () => (own ? allMats(own).forEach((m) => m.dispose()) : undefined), [own]);
  const op = (o.ghost ? 0.45 : 1) * (o.opacity ?? 1);
  useLayoutEffect(() => {
    if (own) allMats(own).forEach((m) => (m.opacity = op));
  });
  const M: Mats = own ?? { ...base, tool: itemMat("axe"), hold: o.hold ? itemMat(o.hold) : null };
  const [la, ra, ll, rl] = limbAngles(o);
  const lie = o.lie === true ? 1 : typeof o.lie === "number" ? o.lie : 0;
  const s = o.scale ?? 1;
  const yaw = ((o.yaw || 0) * Math.PI) / 180;
  const [x, y, z] = o.position;
  return (
    <group
      position={[x, y + (o.yOffset ?? 0), z]}
      rotation={[(-Math.PI / 2) * lie, yaw, 0]}
      scale={[Math.max(1e-4, s), Math.max(1e-4, s), Math.max(1e-4, s)]}
      visible={s > 0.001 && op > 0.001}
    >
      <group position={[0, 1.5, 0]} rotation={[0, ((o.headYaw ?? 0) * Math.PI) / 180, ((o.headTilt ?? 0) * Math.PI) / 180]}>
        <mesh geometry={G.head} material={M.head} position={[0, 0.25, 0]} />
      </group>
      <mesh geometry={G.body} material={M.body} position={[0, 1.125, 0]} />
      <mesh geometry={G.limb} material={M.arm} position={[-0.375, 1.5, 0]} rotation={[la, 0, 0]} />
      <mesh geometry={G.limb} material={M.arm} position={[0.375, 1.5, 0]} rotation={[ra, 0, 0]} />
      <mesh geometry={G.limb} material={M.leg} position={[-0.125, 0.75, 0]} rotation={[ll, 0, 0]} />
      <mesh geometry={G.limb} material={M.leg} position={[0.125, 0.75, 0]} rotation={[rl, 0, 0]} />
      {o.tool ? <mesh geometry={G.tool} material={M.tool} position={[0.45, 0.85, 0.2]} rotation={[0, Math.PI / 2, -0.6]} /> : null}
      {o.hold && M.hold ? <mesh geometry={G.hold} material={M.hold} position={[0.45, 0.9, 0.35]} rotation={[0, Math.PI / 2, 0]} /> : null}
    </group>
  );
};
