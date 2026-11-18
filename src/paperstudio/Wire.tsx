import React from "react";
import { useCurrentFrame } from "remotion";
import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { EASE, H, W, mix, prog, theme } from "./theme";

/**
 * Wire primitives. Each renders its own full-frame SVG (reel coordinates) that casts the soft "raised wire"
 * shadow, so they can be dropped anywhere. Draw-on runs from `at` over `dur` frames; leave `at` undefined to
 * draw them complete. `p` overrides the progress directly (0..1) when a builder drives it itself.
 */
const Frame: React.FC<{ children: React.ReactNode; flat?: boolean; opacity?: number }> = ({ children, flat, opacity = 1 }) => (
  <svg
    style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: flat ? undefined : theme.shadow.wire, opacity }}
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    fill="none"
  >
    {children}
  </svg>
);

const useP = (at?: number, dur = 14, p?: number, ease: (t: number) => number = EASE.travel) => {
  const f = useCurrentFrame();
  if (p !== undefined) return p;
  return at === undefined ? 1 : prog(f, at, at + dur, ease);
};

/** filled arrowhead at the drawn tip of a path */
const Head: React.FC<{ d: string; p: number; color: string; size: number }> = ({ d, p, color, size }) => {
  const L = getLength(d);
  const at = Math.max(0.001, L * p);
  const pt = getPointAtLength(d, at);
  const tg = getTangentAtLength(d, at);
  const ang = (Math.atan2(tg.y, tg.x) * 180) / Math.PI;
  return <path d={`M${-size * 0.7} ${-size * 0.62} L${size * 0.55} 0 L${-size * 0.7} ${size * 0.62} Z`} fill={color} transform={`translate(${pt.x} ${pt.y}) rotate(${ang})`} />;
};

export type WirePathProps = {
  d: string;
  /** stroke width; main bracket 7 (default), secondary 4 */
  w?: number;
  color?: string;
  at?: number;
  dur?: number;
  p?: number;
  arrow?: boolean;
  opacity?: number;
  /** no cast shadow (motion hints) */
  flat?: boolean;
};

/** A solid black line that draws on (dash offset), with an optional arrowhead riding the tip. */
export const WirePath: React.FC<WirePathProps> = ({ d, w = theme.wire.main, color = theme.color.ink, at, dur = 14, p, arrow, opacity = 1, flat }) => {
  const q = useP(at, dur, p);
  if (q <= 0) return null;
  return (
    <Frame flat={flat} opacity={opacity}>
      <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {arrow && q > 0.04 ? <Head d={d} p={q} color={color} size={w * 2.6 + 6} /> : null}
    </Frame>
  );
};

/** Hollow node: r 15 with a 6 px ring (paper-coloured centre). Pops in at `at`. */
export const WireNode: React.FC<{ cx: number; cy: number; r?: number; ring?: number; at?: number; color?: string; fill?: string; opacity?: number }> = ({
  cx,
  cy,
  r = theme.wire.nodeR,
  ring = theme.wire.nodeRing,
  at,
  color = theme.color.ink,
  fill = theme.color.node,
  opacity = 1,
}) => {
  const q = useP(at, 8, undefined, EASE.pop);
  if (q <= 0) return null;
  return (
    <Frame opacity={opacity * Math.min(1, q * 2)}>
      <circle cx={cx} cy={cy} r={r * mix(0.4, 1, q)} fill={fill} stroke={color} strokeWidth={ring} />
    </Frame>
  );
};

/** Dashed flow arrow (14/12 dashes, filled head) that draws on along its path. */
export const DashedArrow: React.FC<WirePathProps & { dash?: string; head?: boolean }> = ({
  d,
  w = 4,
  color = theme.color.ink,
  at,
  dur = 18,
  p,
  dash = theme.wire.dash,
  head = true,
  opacity = 1,
  flat,
}) => {
  const q = useP(at, dur, p);
  const id = React.useId().replace(/:/g, "");
  if (q <= 0) return null;
  return (
    <Frame flat={flat} opacity={opacity}>
      <defs>
        <mask id={`psda${id}`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
          <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - q} stroke="#fff" strokeWidth={w + 12} strokeLinecap="butt" fill="none" />
        </mask>
      </defs>
      <path d={d} mask={`url(#psda${id})`} stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" />
      {head && q > 0.04 ? <Head d={d} p={q} color={color} size={w * 2.6 + 6} /> : null}
    </Frame>
  );
};

/** Grey flat dashed motion hint (storyboard only; normally not used in the build). */
export const HintArrow: React.FC<{ d: string }> = ({ d }) => <DashedArrow d={d} w={3} color={theme.color.hint} dash="12 12" flat opacity={0.75} />;
