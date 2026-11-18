import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AnimatedBlocks, Blocks, FallingTree } from "./Blocks";
import { fallingOf } from "./island";
import { Entities } from "./Entities";
import { nightness, Sky } from "./Sky";
import type { WorldSpec } from "./types";
import { VoxelCameraRig } from "./VoxelCamera";

// <VoxelWorld spec={spec} />: the Minecraft-look world for one shot, full-bleed 1080x1920 by default.
// Everything derives from the spec, and the spec derives from useCurrentFrame() in the builder's beat, so every
// frame is deterministic (no useFrame, nothing animates on its own). WebGL renders need `--gl=angle`.
//
// The canvas: WebGL, no antialiasing (pixel edges like the game), sRGB output, no tone mapping (flat), pixel ratio 1,
// preserveDrawingBuffer for Remotion's screenshots. `resolution` < 1 renders a smaller canvas and scales it up
// (0.667 = the storyboard page's 720x1280; the cheapest speed lever).

export type VoxelWorldProps = {
  spec: WorldSpec;
  width?: number;
  height?: number;
  /** canvas pixels per frame pixel (default 1) */
  resolution?: number;
  style?: React.CSSProperties;
  /** extra three.js content inside the scene (a builder's local stand-in: meshes, <Agent>, <Door>, <Puff> ...) */
  children?: React.ReactNode;
};

const GL = { antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: "high-performance" as const, stencil: false };

export const WorldScene: React.FC<{ spec: WorldSpec; w: number; h: number; children?: React.ReactNode }> = ({ spec, w, h, children }) => {
  const night = nightness(spec.time);
  return (
    <>
      <VoxelCameraRig cam={spec.cam} w={w} h={h} />
      <Sky time={spec.time} cam={spec.cam} cloudDrift={spec.cloudDrift} sunArc={spec.sunArc} moonArc={spec.moonArc} moonAt={spec.moonAt} h={h} />
      {(spec.terrain ?? "island") !== "none" ? <Blocks spec={spec} /> : null}
      <AnimatedBlocks spec={spec} />
      {fallingOf(spec).map((f) => (
        <FallingTree key={"fall" + f.i} spec={spec} f={f} />
      ))}
      <Entities spec={spec} night={night} />
      {children}
    </>
  );
};

export const VoxelWorld: React.FC<VoxelWorldProps> = ({ spec, width = 1080, height = 1920, resolution = 1, style, children }) => {
  const cw = Math.max(2, Math.round(width * resolution));
  const ch = Math.max(2, Math.round(height * resolution));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height, overflow: "hidden", background: "#9DB9D8", ...style }}>
      <ThreeCanvas
        width={cw}
        height={ch}
        dpr={1}
        flat
        gl={GL}
        style={resolution === 1 ? undefined : { transform: `scale(${width / cw}, ${height / ch})`, transformOrigin: "0 0" }}
      >
        <WorldScene spec={spec} w={cw} h={ch}>
          {children}
        </WorldScene>
      </ThreeCanvas>
    </div>
  );
};
