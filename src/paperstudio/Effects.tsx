import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { EASE, PHOTO, mix, prog, theme } from "./theme";
import { Enter, Exit, enterState } from "./motion";

// ------------------------------------------------------------- shatter
type Pt = [number, number];
const crackGeometry = (w: number, h: number, ox: number, oy: number, seed: number) => {
  let r = seed;
  const rnd = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  const R = Math.max(w, h) * 0.62;
  const spokes: { pts: Pt[]; cum: number[] }[] = [];
  const N = 15;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rnd() * 0.35;
    let px = ox;
    let py = oy;
    let len = 0;
    const pts: Pt[] = [[px, py]];
    const cum = [0];
    while (len < R) {
      const step = 34 + rnd() * 46;
      len += step;
      const ang = a + (rnd() - 0.5) * 0.7;
      px += Math.cos(ang) * step;
      py += Math.sin(ang) * step;
      pts.push([px, py]);
      cum.push(len);
    }
    spokes.push({ pts, cum });
  }
  const rings: string[] = [];
  for (let k = 1; k <= 4; k++) {
    const rr = (R * k) / 5;
    let d = "";
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const j = (rnd() - 0.5) * 34;
      const px = ox + Math.cos(a) * (rr + j) * 0.9;
      const py = oy + Math.sin(a) * (rr + j) * 1.15;
      d += `${i ? " L" : "M"}${px.toFixed(0)} ${py.toFixed(0)}`;
    }
    rings.push(d + " Z");
  }
  return { R, spokes, rings };
};

const spokeTo = (s: { pts: Pt[]; cum: number[] }, dist: number) => {
  let d = `M${s.pts[0][0].toFixed(1)} ${s.pts[0][1].toFixed(1)}`;
  for (let i = 1; i < s.pts.length; i++) {
    if (s.cum[i] <= dist) {
      d += ` L${s.pts[i][0].toFixed(1)} ${s.pts[i][1].toFixed(1)}`;
    } else {
      const t = (dist - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1]);
      if (t > 0) d += ` L${mix(s.pts[i - 1][0], s.pts[i][0], t).toFixed(1)} ${mix(s.pts[i - 1][1], s.pts[i][1], t).toFixed(1)}`;
      break;
    }
  }
  return d;
};

/**
 * Seeded crack web over a card: spokes draw outward from the origin, then the rings link them (white wide stroke
 * under a black thin one). Clipped to the card rect.
 */
export const ShatterOverlay: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  /** crack origin inside the rect (default the centre) */
  ox?: number;
  oy?: number;
  seed?: number;
  at?: number;
  dur?: number;
  radius?: number;
  opacity?: number;
}> = ({ x, y, w, h, ox, oy, seed = 7, at = 0, dur = 10, radius = 14, opacity = 1 }) => {
  const f = useCurrentFrame();
  const g = React.useMemo(() => crackGeometry(w, h, ox ?? w / 2, oy ?? h / 2, seed), [w, h, ox, oy, seed]);
  const p = prog(f, at, at + dur, EASE.enter);
  if (p <= 0) return null;
  const dist = p * g.R;
  const spokeD = g.spokes.map((s) => spokeTo(s, dist)).join(" ");
  const ringEls = g.rings.map((d, k) => {
    const rp = Math.max(0, Math.min(1, (p - (k + 1) / 5) / 0.3));
    return rp > 0 ? <path key={k} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rp} /> : null;
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", borderRadius: radius, opacity }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" strokeLinejoin="round" strokeLinecap="round">
        <g stroke="#fff" strokeWidth={10} opacity={0.95}>
          <path d={spokeD} />
          {ringEls}
        </g>
        <g stroke={theme.color.ink} strokeWidth={2.5} opacity={0.8}>
          <path d={spokeD} />
          {ringEls}
        </g>
      </svg>
    </div>
  );
};

// ------------------------------------------------------------- blur break
/**
 * Whole-frame blur break between sections (6-10 frames): the children blur out to `max` px with a grey vignette
 * and a 3% push. mode "inout" peaks in the middle, "in" ends blurred, "out" starts blurred and clears.
 */
export const BlurBreak: React.FC<{ children: React.ReactNode; at?: number; dur?: number; max?: number; mode?: "inout" | "in" | "out" }> = ({
  children,
  at = 0,
  dur = 8,
  max = 16,
  mode = "inout",
}) => {
  const f = useCurrentFrame();
  let a: number;
  if (mode === "in") a = prog(f, at, at + dur, EASE.travel);
  else if (mode === "out") a = 1 - prog(f, at, at + dur, EASE.travel);
  else {
    const mid = at + dur / 2;
    a = f <= mid ? prog(f, at, mid, EASE.travel) : 1 - prog(f, mid, at + dur, EASE.travel);
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: a > 0.01 ? `blur(${(max * a).toFixed(2)}px)` : undefined, transform: `scale(${(1 + 0.03 * a).toFixed(4)})` }}>{children}</AbsoluteFill>
      {a > 0.01 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,.22) 100%)", opacity: a }} /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- 3D objects
/** Glossy 3D object (harness icon by default) on a soft contact shadow. Pops in at `at`. */
export const IconObject: React.FC<{ cx: number; cy: number; s?: number; src?: string; at?: number; float?: number; opacity?: number }> = ({
  cx,
  cy,
  s = 110,
  src = PHOTO.harness,
  at,
  float = 0,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + 10, EASE.pop);
  if (p <= 0) return null;
  const lift = float ? float * Math.sin((f / 60) * Math.PI * 2) : 0;
  const sc = mix(0.5, 1, p);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, p * 2) * opacity }}>
      <div
        style={{
          position: "absolute",
          left: cx - s * 0.45,
          top: cy + s * 0.42,
          width: s * 0.9,
          height: s * 0.24,
          borderRadius: "50%",
          background: "rgba(0,0,0,.22)",
          filter: "blur(10px)",
          transform: `scale(${(sc * (1 - lift / 60)).toFixed(4)})`,
        }}
      />
      <div style={{ position: "absolute", left: cx - s / 2, top: cy - s / 2 - lift, width: s, height: s, filter: theme.shadow.object, transform: `scale(${sc.toFixed(4)})` }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </div>
  );
};

/** The 3D guide mock (rendered page / book cut-out) on a wide contact shadow. */
export const GuideMock: React.FC<{ x: number; y: number; w: number; h: number; src?: string; rot?: number; enter?: Enter; exit?: Exit; opacity?: number }> = ({
  x,
  y,
  w,
  h,
  src = PHOTO.guide,
  rot = 0,
  enter,
  exit,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o * opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: e.transform, opacity: e.o * opacity }}>
      <div style={{ position: "absolute", left: w * 0.04, top: h * 0.74, width: w * 0.92, height: h * 0.3, borderRadius: "50%", background: "rgba(0,0,0,.2)", filter: "blur(22px)" }} />
      <Img
        src={src}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(18px 26px 22px rgba(0,0,0,.22))", transform: rot ? `rotate(${rot}deg)` : undefined }}
      />
    </div>
  );
};
