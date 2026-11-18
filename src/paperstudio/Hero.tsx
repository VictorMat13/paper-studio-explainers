import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { EASE, LOGO, mix, prog, theme } from "./theme";
import { drift as driftAt } from "./motion";
import { keyed } from "./kit05";

// ------------------------------------------------------------- RimImage
export type RimImageProps = {
  src: string;
  w: number;
  h: number;
  /** white rim around the cut-out's alpha edge, px (0 = none) */
  rim?: number;
  rimColor?: string;
  /** black and white (grayscale + a touch of contrast) */
  grayscale?: boolean;
  /** CSS filter for the float shadow; default the skill's cut-out stack, false = none */
  shadow?: string | false;
  fit?: "contain" | "cover";
  objectPosition?: string;
  style?: React.CSSProperties;
};

/**
 * A cut-out photo or sprite with an optional white rim traced around its alpha (SVG dilate, so it follows the
 * silhouette like a printed sticker) and the floating shadow stack. Shadows sit on a non-transformed wrapper, so
 * rotate/scale the RimImage's parent and the light still comes from the top left.
 */
export const RimImage: React.FC<RimImageProps> = ({ src, w, h, rim = 0, rimColor = "#ffffff", grayscale = false, shadow, fit = "contain", objectPosition = "center", style }) => {
  const id = React.useId().replace(/:/g, "");
  const r = Math.max(0, rim);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, filter: shadow === false ? undefined : shadow ?? theme.shadow.cutout, ...style }}>
      {r > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={`psrim${id}`} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
              <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="d" />
              <feGaussianBlur in="d" stdDeviation={Math.min(1.2, r * 0.12)} result="ds" />
              <feFlood floodColor={rimColor} result="c" />
              <feComposite in="c" in2="ds" operator="in" result="rimL" />
              <feMerge>
                <feMergeNode in="rimL" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      ) : null}
      <div style={{ position: "absolute", inset: 0, filter: r > 0 ? `url(#psrim${id})` : undefined }}>
        <Img
          src={src}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition, filter: grayscale ? "grayscale(1) contrast(1.08) brightness(1.02)" : undefined }}
        />
      </div>
    </div>
  );
};

// ------------------------------------------------------------- PortraitCutout
type Side = "left" | "right" | "top" | "bottom";
export type PortraitCutoutProps = {
  /** the cut-out portrait (transparent PNG cropped to its opaque bounds) */
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** edge it slides in from (default left); it may sit partly off the frame edge and bottom */
  from?: Side;
  /** frame the slide starts (undefined = already in place) */
  at?: number;
  dur?: number;
  /** slide distance (default 760 px, enough to start off frame) */
  dist?: number;
  /** black and white (default true) */
  grayscale?: boolean;
  /** white rim width (default 10 px) */
  rim?: number;
  /** ambient drift amplitude in px (default 3) */
  drift?: number;
  /** slow push: extra scale per 100 frames after landing (default 0.025), origin bottom centre */
  push?: number;
  exit?: { at: number; dur?: number; to?: Side; dist?: number };
  objectPosition?: string;
  opacity?: number;
};

/**
 * The B&W person cut-out from the ep05 reference hook: a portrait with a white sticker rim, floating above the
 * paper with the skill's shadow stack, sliding in from a frame edge without fading (it may bleed off the edge and
 * the bottom), then a slow push and a small drift while it holds.
 */
export const PortraitCutout: React.FC<PortraitCutoutProps> = ({
  src,
  x,
  y,
  w,
  h,
  from = "left",
  at,
  dur = 18,
  dist = 760,
  grayscale = true,
  rim = 10,
  drift = 3,
  push = 0.025,
  exit,
  objectPosition = "center bottom",
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + dur, EASE.enter);
  const r = (1 - p) * dist;
  let dx = from === "left" ? -r : from === "right" ? r : 0;
  let dy = from === "top" ? -r : from === "bottom" ? r : 0;
  if (exit) {
    const q = prog(f, exit.at, exit.at + (exit.dur ?? 14), EASE.exit);
    const d = (exit.dist ?? dist) * q;
    const to = exit.to ?? from;
    dx += to === "left" ? -d : to === "right" ? d : 0;
    dy += to === "top" ? -d : to === "bottom" ? d : 0;
  }
  const landed = at === undefined ? f : f - (at + dur * 0.6);
  const s = 1 + Math.max(0, landed) * (push / 100);
  const d = drift ? driftAt(f, drift, 120, 5) : { x: 0, y: 0 };
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(${(dx + d.x).toFixed(2)}px,${(dy + d.y).toFixed(2)}px) scale(${s.toFixed(4)})`,
        transformOrigin: "50% 100%",
        opacity,
      }}
    >
      <RimImage src={src} w={w} h={h} rim={rim} grayscale={grayscale} objectPosition={objectPosition} />
    </div>
  );
};

// ------------------------------------------------------------- BrandBurst
export type BurstKey = { f: number; x: number; y: number; s?: number };
export type BrandBurstProps = {
  /** centre when no `path` is given */
  cx?: number;
  cy?: number;
  /** drawn size in px (the mark's box) */
  size?: number;
  /** the official mark (default the Claude spark) */
  src?: string;
  /** start rotation, degrees */
  rot?: number;
  /** slow rotation, degrees per frame (default 0.35; negative turns left) */
  spin?: number;
  /** swing path: eased (camera curve) through {f, x, y, s?} keys; swing in from off frame, hold, slide off */
  path?: BurstKey[];
  /** frame it pops in (scale 0.6 to 1, fade); undefined = already there */
  at?: number;
  dur?: number;
  /** thickness edge under the mark in px at size 600 (default 6); 0 = flat */
  edge?: number;
  /** soft float shadow down-right (default true) */
  shadow?: boolean;
  opacity?: number;
};

/**
 * An official brand mark as a big physical hero object: a thick paper/acrylic spark with a darker edge, a soft
 * shadow falling down-right (the shadow does not turn with the mark), turning slowly. With `path` it swings in
 * from off frame and slides off, bleeding past the frame edges like the reference's Claude starburst.
 */
export const BrandBurst: React.FC<BrandBurstProps> = ({ cx = 540, cy = 900, size = 560, src = LOGO.Claude, rot = 0, spin = 0.35, path, at, dur = 12, edge = 6, shadow = true, opacity = 1 }) => {
  const f = useCurrentFrame();
  const px = path?.length ? keyed(path, f, (k) => k.x) : cx;
  const py = path?.length ? keyed(path, f, (k) => k.y) : cy;
  const ps = path?.length ? keyed(path, f, (k) => k.s ?? 1) : 1;
  const pop = at === undefined ? 1 : prog(f, at, at + dur, EASE.pop);
  if (pop <= 0 || opacity <= 0) return null;
  const s = ps * mix(0.6, 1, pop);
  const r = rot + spin * f;
  const e = (edge * size) / 600;
  const k = size / 600;
  return (
    <div
      style={{
        position: "absolute",
        left: px - size / 2,
        top: py - size / 2,
        width: size,
        height: size,
        transform: `scale(${s.toFixed(4)})`,
        opacity: Math.min(1, pop * 1.8) * opacity,
        filter: shadow
          ? `drop-shadow(${(14 * k).toFixed(1)}px ${(22 * k).toFixed(1)}px ${(16 * k).toFixed(1)}px rgba(0,0,0,.20)) drop-shadow(${(44 * k).toFixed(1)}px ${(66 * k).toFixed(1)}px ${(48 * k).toFixed(1)}px rgba(0,0,0,.16))`
          : undefined,
      }}
    >
      {e > 0 ? (
        <Img
          src={src}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `translate(${(e * 0.55).toFixed(2)}px,${e.toFixed(2)}px) rotate(${r.toFixed(3)}deg)`, filter: "brightness(.72) saturate(1.05)" }}
        />
      ) : null}
      <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `rotate(${r.toFixed(3)}deg)` }} />
    </div>
  );
};
