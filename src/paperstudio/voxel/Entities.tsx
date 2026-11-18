import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { Agent } from "./Agent";
import { BOX, doorMat, itemGlowMat, itemMat, mat, tallGrassMat, torchHandleMat, torchTopMat, wheatMat } from "./materials";
import { C, heightAt } from "./island";
import { Puffs } from "./Particles";
import type { AgentSpec, ItemSpec, WorldSpec } from "./types";
import { rng } from "./util";

// Everything that is not a terrain block, from the page's addEntities: torches (with their warm point light at night
// or indoors), chests, crafting table, furnace, hut doors and hut torches, wheat cross-planes, tall grass, zombies,
// lying dead agents, the seeded crowd, explicit agents, item sprites, plus particle puffs. Positions and yaws are
// the page's, so the crowd stands where it stands in the storyboard frames.

const TORCH_COLOR = 0xffb45c;
const TORCH_GEO = { handle: new THREE.BoxGeometry(0.125, 0.62, 0.125), top: new THREE.BoxGeometry(0.14, 0.16, 0.14) };
const DOOR_GEO = new THREE.PlaneGeometry(1, 2);
const PLANT_GEO = new THREE.PlaneGeometry(1, 1);
const ITEM_GEO = { small: new THREE.PlaneGeometry(0.5, 0.5), big: new THREE.PlaneGeometry(0.9, 0.9) };

/** ground height for an entity (the page's H): explicit y, else the island cell under it, else 1 indoors */
export const groundOf = (spec: Pick<WorldSpec, "terrain">) => (x: number, z: number, y?: number) =>
  y != null ? y : (spec.terrain ?? "island") === "island" ? heightAt(Math.floor(x), Math.floor(z)) : spec.terrain === "interior" ? 1 : 0;

/**
 * A dark oak door (the page's 1 x 2 plane). (x, y, z) = its centre when closed. `open` 0 (closed, the page) .. 1:
 * hinged on the frame side (`hinge` left = the -x edge, default), swinging outward (+z, toward a yaw-0 camera).
 * `rotY` (degrees) turns the whole door for a wall facing another way.
 */
export const Door: React.FC<{ x: number; y: number; z: number; open?: number; hinge?: "left" | "right"; rotY?: number }> = ({ x, y, z, open = 0, hinge = "left", rotY = 0 }) => {
  const o = Math.max(0, Math.min(1, open));
  const side = hinge === "left" ? -1 : 1;
  return (
    <group position={[x, y, z]} rotation={[0, (rotY * Math.PI) / 180, 0]}>
      <group position={[side * 0.5, 0, 0]} rotation={[0, side * o * Math.PI * 0.5, 0]}>
        <mesh geometry={DOOR_GEO} material={doorMat()} position={[-side * 0.5, 0, 0]} />
      </group>
    </group>
  );
};

/** a hut's door centre (closed) and wall-torch position, the page's offsets */
export const doorPos = (s: { x: number; z: number }): [number, number, number] => [s.x + 1.5, heightAt(s.x, s.z) + 1, s.z + 3.98];
export const hutTorchPos = (s: { x: number; z: number }): [number, number, number] => [s.x + 2.6, heightAt(s.x, s.z) + 1.3, s.z + 4.3];

/** deterministic flicker multiplier for torch i (about +-3%) */
export const torchFlicker = (phase: number | undefined, i: number) =>
  phase === undefined ? 1 : 1 + 0.03 * (0.6 * Math.sin(phase * 0.9 + i * 1.7) + 0.4 * Math.sin(phase * 2.3 + i * 0.61));

const Torch: React.FC<{ x: number; y: number; z: number; intensity: number }> = ({ x, y, z, intensity }) => (
  <>
    <mesh geometry={TORCH_GEO.handle} material={torchHandleMat()} position={[x, y + 0.31, z]} />
    <mesh geometry={TORCH_GEO.top} material={torchTopMat()} position={[x, y + 0.68, z]} />
    <pointLight color={TORCH_COLOR} intensity={intensity} distance={12} decay={2} position={[x, y + 0.95, z]} />
  </>
);

const BlockMesh: React.FC<{ k: string; x: number; y: number; z: number; s?: number }> = ({ k, x, y, z, s = 1 }) => (
  <mesh geometry={BOX} material={mat(k)} position={[x + 0.5, y + s / 2, z + 0.5]} scale={[s, s, s]} />
);

const Item: React.FC<{ it: ItemSpec }> = ({ it }) => {
  const shared = it.glow ? itemGlowMat(it.kind) : itemMat(it.kind);
  const own = useMemo(() => (it.opacity !== undefined ? shared.clone() : null), [it.opacity !== undefined, shared]);
  useLayoutEffect(() => () => own?.dispose(), [own]);
  useLayoutEffect(() => {
    if (own) own.opacity = it.opacity ?? 1;
  });
  const sc = it.scale ?? 1;
  return (
    <mesh
      geometry={it.big ? ITEM_GEO.big : ITEM_GEO.small}
      material={own ?? shared}
      position={[it.x, it.y, it.z]}
      rotation={[0, it.rotY ?? 0.6, it.rotZ ?? 0]}
      scale={[Math.max(1e-4, sc), Math.max(1e-4, sc), 1]}
      visible={sc > 0.001 && (it.opacity ?? 1) > 0.001}
    />
  );
};

/** the crowd of a spec as explicit agents (the page's seeded positions and yaws), for animating them one by one:
 *  `agents: crowdAgents(spec).map((a, i) => ({ ...a, yOffset: drop(i) }))` with `crowd` left out of the spec */
export function crowdAgents(spec: Pick<WorldSpec, "crowd" | "faceCenter" | "terrain">): AgentSpec[] {
  const c = spec.crowd;
  if (!c) return [];
  const R = rng(c.seed || 5);
  const out: AgentSpec[] = [];
  for (let i = 0; i < c.n; i++) {
    const ang = R() * 6.283,
      rad = Math.sqrt(R()) * c.r;
    const x = c.cx + Math.cos(ang) * rad,
      z = c.cz + Math.sin(ang) * rad;
    let yaw = R() * 360;
    if (c.faceTo) yaw = (Math.atan2(c.faceTo[0] - x, c.faceTo[1] - z) * 180) / Math.PI;
    if (spec.faceCenter) yaw = (Math.atan2(C - x, C - z) * 180) / Math.PI;
    out.push({ x, z, skin: i, yaw, tool: !!c.tool && i % 2 === 0, seedv: i });
  }
  return out;
}

/** the zombies of a spec as explicit agents (facing the centre) */
export const mobAgents = (spec: Pick<WorldSpec, "mobs">): AgentSpec[] =>
  (spec.mobs ?? []).map(([x, z]) => ({ x, z, zombie: true, yaw: (Math.atan2(C - x, C - z) * 180) / Math.PI }));

/** the lying dead agents of a spec as explicit agents (grey, flat; the last one falls with `lying.fall`) */
export function lyingAgents(spec: Pick<WorldSpec, "lying">): AgentSpec[] {
  const L = spec.lying;
  if (!L) return [];
  const out: AgentSpec[] = [];
  for (let i = 0; i < L.n; i++) {
    const x = L.cx - (L.cols * L.dx) / 2 + (i % L.cols) * L.dx,
      z = L.cz + Math.floor(i / L.cols) * L.dz;
    out.push({ x, z, grey: true, lie: i === L.n - 1 && L.fall !== undefined ? L.fall : true, yaw: 0, opacity: L.opacity });
  }
  return out;
}

export const Entities: React.FC<{ spec: WorldSpec; night: number }> = ({ spec, night }) => {
  const terrain = spec.terrain ?? "island";
  const island = terrain === "island";
  const interior = terrain === "interior";
  const H = groundOf(spec);
  const flick = (i: number) => torchFlicker(spec.flicker, i);
  // the page lights spec torches at night or indoors (night 60, else 34) and hut torches at night only
  const torchI = interior ? 34 + 26 * night : 60 * night;
  const hutI = 60 * night;
  let ti = 0;
  return (
    <>
      {(spec.torches ?? []).map(([x, yo, z], i) => {
        const g = island ? H(x, z) : 1;
        return <Torch key={"t" + i} x={x} y={g + (yo || 0)} z={z} intensity={torchI * flick(ti++)} />;
      })}
      {(spec.chests ?? []).map(([x, y, z], i) => (
        <BlockMesh key={"c" + i} k="chest" x={x} y={y} z={z} s={0.9} />
      ))}
      {(spec.crafting ?? []).map(([x, y, z], i) => (
        <BlockMesh key={"k" + i} k="craft" x={x} y={y} z={z} />
      ))}
      {(spec.furnace ?? []).map(([x, y, z], i) => (
        <BlockMesh key={"f" + i} k="furnace" x={x} y={y} z={z} />
      ))}
      {island
        ? (spec.shelters ?? []).map((s, i) => {
            const d = doorPos(s),
              t = hutTorchPos(s);
            return (
              <React.Fragment key={"s" + i}>
                <Door x={d[0]} y={d[1]} z={d[2]} open={s.door ?? s.open ?? 0} />
                <Torch x={t[0]} y={t[1]} z={t[2]} intensity={hutI * flick(ti++)} />
              </React.Fragment>
            );
          })
        : null}
      {island && spec.farm
        ? (spec.farm.wheat ?? []).map(([x, z], i) => {
            const g = heightAt(x, z);
            const ph = spec.farm!.sway ?? spec.sway;
            const sw = ph === undefined ? 0 : 0.05 * Math.sin(ph * Math.PI * 2 + i * 1.3);
            return (
              <React.Fragment key={"w" + i}>
                {[0.785, -0.785].map((rot) => (
                  <mesh key={rot} geometry={PLANT_GEO} material={wheatMat()} position={[x + 0.5, g + 0.5 - 0.0625, z + 0.5]} rotation={[0, rot, sw]} />
                ))}
              </React.Fragment>
            );
          })
        : null}
      {island
        ? (spec.grassTufts ?? []).map(([x, z], i) => {
            const g = heightAt(Math.floor(x), Math.floor(z));
            const sw = spec.sway === undefined ? 0 : 0.05 * Math.sin(spec.sway * Math.PI * 2 + i * 1.7);
            return (
              <React.Fragment key={"g" + i}>
                {[0.785, -0.785].map((rot) => (
                  <mesh key={rot} geometry={PLANT_GEO} material={tallGrassMat()} position={[x, g + 0.5, z]} rotation={[0, rot, sw]} />
                ))}
              </React.Fragment>
            );
          })
        : null}
      {island ? mobAgents(spec).map((a, i) => <Agent key={"m" + i} {...a} position={[a.x, H(a.x, a.z), a.z]} />) : null}
      {island ? lyingAgents(spec).map((a, i) => <Agent key={"l" + i} {...a} position={[a.x, H(a.x, a.z), a.z]} />) : null}
      {crowdAgents(spec).map((a, i) => (
        <Agent key={"p" + i} {...a} position={[a.x, H(a.x, a.z), a.z]} />
      ))}
      {(spec.agents ?? []).map((o, i) => {
        const a = { seedv: i, ...o };
        return <Agent key={"a" + i} {...a} position={[a.x, H(a.x, a.z, a.y), a.z]} />;
      })}
      {(spec.items ?? []).map((it, i) => (
        <Item key={"i" + i} it={it} />
      ))}
      <Puffs puffs={spec.puffs} />
    </>
  );
};
