import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { EASE, mix, prog, theme } from "./theme";
import { META06, P2, centroid, clipHalf } from "./kit06";

// ------------------------------------------------------------- Scissors
export type ScissorsProps = {
  /** scissors cut-out (blades pointing along `axis`); undefined draws the built-in steel scissors */
  src?: string;
  /** drawn width px */
  w?: number;
  /** image aspect w/h, pivot (fractions) and blade direction (deg) of the image; defaults from META06.scissors */
  aspect?: number;
  pivot?: P2;
  axis?: number;
  /** the image's own opening angle (deg) */
  open?: number;
  /** opening now (deg): 0 = closed, `open` = as photographed */
  opening: number;
};

/** built-in drawing: steel blades and black handle loops, blades pointing right, pivot at (0.42, 0.5) of 600 x 375 */
const DrawnHalf: React.FC<{ upper: boolean }> = ({ upper }) => {
  const s = upper ? -1 : 1;
  // blade: from the pivot (252,187) to the tip at the right, slightly curved; handle: loop at the left on the other side
  const blade = `M252 ${187 + s * 4} C 360 ${187 + s * 2}, 480 ${187 - s * 2}, 590 ${187 + s * 1} L 590 ${187 + s * 8} C 480 ${187 + s * 26}, 360 ${187 + s * 34}, 252 ${187 + s * 30} Z`;
  const shank = `M252 ${187 + s * 30} L 160 ${187 - s * 62} L 182 ${187 - s * 74} L 262 ${187 + s * 6} Z`;
  const gid = upper ? "psScU" : "psScL";
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1={upper ? "0" : "1"} x2="0" y2={upper ? "1" : "0"}>
          <stop offset="0" stopColor="#F6F6F6" />
          <stop offset="0.55" stopColor="#C9CBCE" />
          <stop offset="1" stopColor="#8D9095" />
        </linearGradient>
      </defs>
      <path d={blade} fill={`url(#${gid})`} stroke="#6E7176" strokeWidth={2} />
      <path d={`M262 ${187 + s * 10} C 380 ${187 + s * 8}, 480 ${187 + s * 3}, 586 ${187 + s * 4}`} stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} fill="none" />
      <path d={shank} fill="#2A2A2A" />
      <ellipse cx={112} cy={187 - s * 104} rx={92} ry={62} fill="none" stroke="#161616" strokeWidth={30} transform={`rotate(${s * 18} 112 ${187 - s * 104})`} />
      <ellipse cx={104} cy={187 - s * 112} rx={92} ry={62} fill="none" stroke="#3A3A3A" strokeOpacity={0.55} strokeWidth={6} transform={`rotate(${s * 18} 104 ${187 - s * 112})`} />
    </g>
  );
};

/**
 * Scissors whose blades open and close around the pivot. With a photo cut-out the image is split into two bow-tie
 * pieces through the pivot (upper blade + lower handle, lower blade + upper handle) that turn in opposite directions,
 * so the blades really close. Draws at w x w/aspect; the pivot is where the parent should anchor it.
 */
export const Scissors: React.FC<ScissorsProps> = ({ src, w = 380, aspect, pivot, axis, open, opening }) => {
  const meta = src ? META06.scissors : { aspect: 1.6, pivot: [0.42, 0.5] as P2, axis: 0, open: 30 };
  const asp = aspect ?? meta.aspect;
  const pv = pivot ?? meta.pivot;
  const ax = axis ?? meta.axis;
  const op = open ?? meta.open;
  const h = w / asp;
  const px = pv[0] * w;
  const py = pv[1] * h;
  // each piece turns by half the closing amount
  const turn = (op - Math.max(0, Math.min(op + 20, opening))) / 2;
  if (!src) {
    // the drawing is built closed; each half opens by half the opening (upper turns up, lower turns down)
    const half = Math.max(0, Math.min(40, opening)) / 2;
    return (
      <svg width={w} height={h} viewBox="0 0 600 375" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`rotate(${half.toFixed(3)} 252 187)`}>
          <DrawnHalf upper={false} />
        </g>
        <g transform={`rotate(${(-half).toFixed(3)} 252 187)`}>
          <DrawnHalf upper />
        </g>
        <circle cx={252} cy={187} r={13} fill="#D9DADC" stroke="#55585C" strokeWidth={3} />
        <circle cx={248} cy={183} r={4} fill="#FFFFFF" fillOpacity={0.8} />
      </svg>
    );
  }
  // bow-tie clip polygons in image px, rotated by the image's blade axis around the pivot
  const L = Math.max(w, h) * 3;
  const rot = (x: number, y: number): string => {
    const a = (ax * Math.PI) / 180;
    return `${(px + x * Math.cos(a) - y * Math.sin(a)).toFixed(1)}px ${(py + x * Math.sin(a) + y * Math.cos(a)).toFixed(1)}px`;
  };
  // piece A: blade side above the axis (x>0, y<0) + handle side below (x<0, y>0)
  const polyA = `polygon(${rot(0, 0)}, ${rot(L, 0)}, ${rot(L, -L)}, ${rot(0, -L)}, ${rot(0, 0)}, ${rot(-L, 0)}, ${rot(-L, L)}, ${rot(0, L)})`;
  const polyB = `polygon(${rot(0, 0)}, ${rot(L, 0)}, ${rot(L, L)}, ${rot(0, L)}, ${rot(0, 0)}, ${rot(-L, 0)}, ${rot(-L, -L)}, ${rot(0, -L)})`;
  const piece = (poly: string, deg: number) => (
    <div style={{ position: "absolute", inset: 0, clipPath: poly, transform: `rotate(${deg.toFixed(3)}deg)`, transformOrigin: `${px}px ${py}px` }}>
      <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      {piece(polyA, turn)}
      {piece(polyB, -turn)}
    </div>
  );
};

// ------------------------------------------------------------- SnipCut
export type SnipCutProps = {
  /** the child card's bounds in reel px (the cut line defaults across it; the halves' pivots come from it) */
  rect: { x: number; y: number; w: number; h: number };
  /** frame the scissors reach the start of the cut line */
  at: number;
  /** frames the cut takes to cross (default 14) */
  cutDur?: number;
  /** cut line in reel px, start to end (the scissors travel this way); default right to left across the middle */
  line?: { x1: number; y1: number; x2: number; y2: number };
  /** slant of the default line, degrees (default -4) */
  angle?: number;
  /** scissors cut-out (`src`, `w`, image geometry), its snips while cutting; false = no scissors, just the cut */
  scissors?:
    | false
    | {
        src?: string;
        w?: number;
        aspect?: number;
        pivot?: P2;
        axis?: number;
        open?: number;
        snips?: number;
        /** frame the scissors start sliding in (default at - enterDur); they wait open at the line start until `at` */
        enterAt?: number;
        enterDur?: number;
        exitDur?: number;
        enterDist?: number;
      };
  /** the halves: start (default right after the cut), duration, push apart, tilts (deg, upper then lower), drop
   * distance, and how many frames the upper half waits after the lower one starts falling */
  separate?: { at?: number; dur?: number; gap?: number; tilt?: [number, number]; drop?: number; stagger?: number };
  /** paper edge drawn along each half's cut (default true) */
  edge?: boolean;
  /** slit colour along the cut */
  lineColor?: string;
  /** card corner radius for the slit clip (default 14) */
  radius?: number;
  children: React.ReactNode;
};

/**
 * Wraps a card (drawn in reel px) and snips it in two: scissors travel along the cut line with their blades
 * snipping and closing, a slit follows them, then the two halves (clip-path) push apart, tilt and drop off the
 * bottom with their own shadows.
 */
export const SnipCut: React.FC<SnipCutProps> = ({ rect, at, cutDur = 14, line, angle = -4, scissors = {}, separate = {}, edge = true, lineColor = theme.color.ink, radius = 14, children }) => {
  const f = useCurrentFrame();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const ln = line ?? (() => {
    const half = rect.w / 2 + 40;
    const t = Math.tan((angle * Math.PI) / 180) * half;
    return { x1: cx + half, y1: cy + t, x2: cx - half, y2: cy - t };
  })();
  const A: P2 = [ln.x1, ln.y1];
  const B: P2 = [ln.x2, ln.y2];
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
  const d: P2 = [(B[0] - A[0]) / len, (B[1] - A[1]) / len];
  const n: P2 = [-d[1], d[0]];
  const cutP = prog(f, at, at + cutDur, EASE.travel);
  const sepAt = separate.at ?? at + cutDur + 1;
  const sepDur = separate.dur ?? 28;
  const split = f >= sepAt;

  // the two halves (reel px polygons) for pivots and which one is on top
  const rectPoly: P2[] = [
    [rect.x, rect.y],
    [rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y + rect.h],
    [rect.x, rect.y + rect.h],
  ];
  const k = n[0] * A[0] + n[1] * A[1];
  const halves = [1, -1].map((s) => {
    const nn: P2 = [n[0] * s, n[1] * s];
    const poly = clipHalf(rectPoly, nn, k * s);
    const c = centroid(poly);
    const BIG = 5000;
    const clip = [
      [A[0] - d[0] * BIG, A[1] - d[1] * BIG],
      [A[0] + d[0] * BIG, A[1] + d[1] * BIG],
      [A[0] + d[0] * BIG + nn[0] * BIG, A[1] + d[1] * BIG + nn[1] * BIG],
      [A[0] - d[0] * BIG + nn[0] * BIG, A[1] - d[1] * BIG + nn[1] * BIG],
    ]
      .map(([px, py]) => `${px.toFixed(1)}px ${py.toFixed(1)}px`)
      .join(", ");
    return { nn, c, clip: `polygon(${clip})` };
  });
  // upper half (smaller centroid y) tilts left and falls a beat later
  const order = halves[0].c[1] <= halves[1].c[1] ? [0, 1] : [1, 0];
  const tilts = separate.tilt ?? [-9, 12];
  const gap = separate.gap ?? 26;
  const drop = separate.drop ?? 1300;
  const stagger = separate.stagger ?? 3;

  // scissors pose
  const sc = scissors === false ? null : scissors;
  let scEl: React.ReactNode = null;
  if (sc) {
    const enterDur = sc.enterDur ?? 8;
    const exitDur = sc.exitDur ?? 10;
    const enterDist = sc.enterDist ?? 760;
    const enterAt = Math.min(sc.enterAt ?? at - enterDur, at - enterDur);
    let px: number;
    let py: number;
    if (f < at) {
      const q = prog(f, enterAt, enterAt + enterDur, EASE.enter);
      px = A[0] - d[0] * enterDist * (1 - q);
      py = A[1] - d[1] * enterDist * (1 - q);
    } else if (f <= at + cutDur) {
      px = A[0] + d[0] * len * cutP;
      py = A[1] + d[1] * len * cutP;
    } else {
      const q = prog(f, at + cutDur, at + cutDur + exitDur, EASE.exit);
      px = B[0] + d[0] * enterDist * q;
      py = B[1] + d[1] * enterDist * q;
    }
    const meta = sc.src ? META06.scissors : { aspect: 1.6, pivot: [0.42, 0.5] as P2, axis: 0, open: 30 };
    const sw = sc.w ?? 380;
    const sh = sw / (sc.aspect ?? meta.aspect);
    const pv = sc.pivot ?? meta.pivot;
    const op = sc.open ?? meta.open;
    const snips = sc.snips ?? 3;
    // open while arriving, snip while cutting, closed at the end of the cut
    // waiting at the line: blades breathe a little; cutting: snips; after: closed, then ease half open as they leave
    const opening = f < at ? op * (0.92 + 0.08 * Math.cos((f - enterAt) / 5)) : f <= at + cutDur ? op * (0.5 + 0.5 * Math.cos(Math.PI * (2 * snips - 1) * cutP)) : op * prog(f, at + cutDur + 2, at + cutDur + exitDur, EASE.soft) * 0.5;
    const th = (Math.atan2(d[1], d[0]) * 180) / Math.PI;
    // turn the photo the short way so its blades point along the cut; mirror it only when that would turn it past
    // 90 degrees (keeps the photo's own top-left light whenever possible)
    const norm = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
    const axis = sc.axis ?? meta.axis;
    let turnDeg = norm(th - axis);
    let mirror = false;
    if (Math.abs(turnDeg) > 90) {
      mirror = true;
      turnDeg = norm(th - (180 - axis));
    }
    // the cut point sits a little ahead of the pivot along the blades
    const ahead = sw * 0.2;
    const pivX = px - d[0] * ahead;
    const pivY = py - d[1] * ahead;
    const tfm = `rotate(${turnDeg.toFixed(3)}deg)${mirror ? " scaleX(-1)" : ""}`;
    const visible = f >= enterAt && f <= at + cutDur + exitDur;
    scEl = visible ? (
      <AbsoluteFill style={{ filter: theme.shadow.cutout, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: pivX - pv[0] * sw, top: pivY - pv[1] * sh, width: sw, height: sh, transform: tfm, transformOrigin: `${pv[0] * sw}px ${pv[1] * sh}px` }}>
          <Scissors src={sc.src} w={sw} aspect={sc.aspect} pivot={sc.pivot} axis={sc.axis} open={sc.open} opening={opening} />
        </div>
      </AbsoluteFill>
    ) : null;
  }

  // slit along the cut (clipped to the card)
  const clipId = React.useId().replace(/:/g, "");
  const slit =
    cutP > 0 && !split ? (
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <defs>
          <clipPath id={`pssnip${clipId}`}>
            <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={radius} />
          </clipPath>
        </defs>
        <g clipPath={`url(#pssnip${clipId})`}>
          <line x1={A[0] + n[0] * 3} y1={A[1] + n[1] * 3} x2={A[0] + d[0] * len * cutP + n[0] * 3} y2={A[1] + d[1] * len * cutP + n[1] * 3} stroke="#FFFFFF" strokeWidth={2} />
          <line x1={A[0]} y1={A[1]} x2={A[0] + d[0] * len * cutP} y2={A[1] + d[1] * len * cutP} stroke={lineColor} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      </svg>
    ) : null;

  if (!split) {
    return (
      <AbsoluteFill>
        {children}
        {slit}
        {scEl}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      {order.map((hi, rank) => {
        const hv = halves[hi];
        // the lower half drops first and the upper one a beat later, so they never slide over each other;
        // they also drift apart sideways as they fall (upper to the left, lower to the right)
        const t0 = sepAt + (rank === 0 ? stagger : 0);
        const g = prog(f, sepAt, sepAt + 10, EASE.enter);
        const q = prog(f, t0, t0 + sepDur, EASE.exit);
        const tilt = tilts[rank] * (0.35 * g + 0.65 * q);
        const dx = hv.nn[0] * gap * g + (rank === 0 ? -1 : 1) * gap * 1.6 * q;
        const dy = hv.nn[1] * gap * g + drop * q;
        const lift = g;
        return (
          <AbsoluteFill key={hi} style={{ filter: `drop-shadow(${(6 + 10 * lift).toFixed(1)}px ${(10 + 16 * lift).toFixed(1)}px ${(10 + 12 * lift).toFixed(1)}px rgba(0,0,0,${(0.1 * lift).toFixed(3)}))` }}>
            <AbsoluteFill style={{ transform: `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${tilt.toFixed(3)}deg)`, transformOrigin: `${hv.c[0].toFixed(1)}px ${hv.c[1].toFixed(1)}px` }}>
              <AbsoluteFill style={{ clipPath: hv.clip }}>
                {children}
                {edge ? (
                  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                    <defs>
                      <clipPath id={`psedge${clipId}${hi}`}>
                        <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={radius} />
                      </clipPath>
                    </defs>
                    <g clipPath={`url(#psedge${clipId}${hi})`}>
                      <line x1={A[0] - d[0] * 60} y1={A[1] - d[1] * 60} x2={B[0] + d[0] * 60} y2={B[1] + d[1] * 60} stroke="#D2D2D2" strokeWidth={8} />
                      <line x1={A[0] - d[0] * 60} y1={A[1] - d[1] * 60} x2={B[0] + d[0] * 60} y2={B[1] + d[1] * 60} stroke="#BDBDBD" strokeWidth={2} />
                    </g>
                  </svg>
                ) : null}
              </AbsoluteFill>
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
      {scEl}
    </AbsoluteFill>
  );
};

/** helper for builders: the cut point of a SnipCut at frame f (where the scissors are cutting) */
export const snipPoint = (line: { x1: number; y1: number; x2: number; y2: number }, f: number, at: number, cutDur = 14): P2 => {
  const p = prog(f, at, at + cutDur, EASE.travel);
  return [mix(line.x1, line.x2, p), mix(line.y1, line.y2, p)];
};
