// ===========================================================================
// HB world objects (ep08 hook 2 "fear of loss"). Render-only: HB.tsx passes every frame value. One light from the
// top left, every shadow falls down-right; solid shaded objects, no line art, nothing glowing. Local helpers (not kit).
//   HbLaptop      the kit laptop cut-out with content mapped onto its glass (BodyC's first-card look, same layers)
//   GlassTerminal the Claude Code style terminal on the glass (content px)
//   FileCard      a project file on a paper card; erased to pale grey paper along the eraser's contact line
//   PhoneApp      the kit DeviceFrame phone with a plain to-do app; dark mode, crack, erase to a grey silhouette
//   StrikeBar     the thick black bar that crosses the GitHub chip
//   Eraser        ep07's eraser cut-out (or a drawn block), its contact line, rubber crumbs, grey paper flakes
// ===========================================================================
import React from "react";
import { Img } from "remotion";
import { DeviceFrame, EASE, INTER, LogoDisc, META06, MONO, ShatterOverlay, WireNode, hash01, mix, mixColor, prog, quadMatrix3d, theme, type P2, type Quad } from "../../../paperstudio";
import { hbAsset, kitLaptop } from "./hook";

/** pale grey of erased paper */
export const ERASED = "#E7E5E1";
export const ERASED_EDGE = "2px 3px 0 #DCDAD7, 3px 5px 0 #CDCBC7, 12px 18px 26px rgba(0,0,0,.12), 30px 44px 70px rgba(0,0,0,.07)";

// ------------------------------------------------------------------ laptop
export const LAPTOP_AR = 1890 / 1506;
/** glass content size (content px): BodyC's SCREEN size, so the C hand-off maps the same way */
export const GLASS = { w: 1600, h: 1000 } as const;
export type Box = { x: number; y: number; w: number };

/** the glass corners in world px for a laptop box */
export const glassQuad = (b: Box): Quad => META06.laptop.quad.map(([u, v]) => [b.x + u * b.w, b.y + (v * b.w) / LAPTOP_AR] as P2) as Quad;

/**
 * The laptop cut-out with `children` (GLASS.w x GLASS.h content px) mapped onto its black glass, the same layers as
 * BodyC's first-card laptop: the cut-out shadow stack on the photo, the glass background, a diagonal sheen, an inner
 * edge. `power` 0..1 dims the glass to dead grey.
 */
export const HbLaptop: React.FC<{ b: Box; glassBg?: string; power?: number; sheen?: number; children?: React.ReactNode }> = ({ b, glassBg = "#16171A", power = 1, sheen = 0, children }) => {
  const h = b.w / LAPTOP_AR;
  const q = META06.laptop.quad.map(([u, v]) => [u * b.w, v * h] as P2) as Quad;
  const m = quadMatrix3d(GLASS.w, GLASS.h, q);
  const src = kitLaptop();
  return (
    <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: h }}>
      <div style={{ position: "absolute", inset: 0, filter: theme.shadow.cutout }}>
        {src ? (
          <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />
        ) : (
          <div style={{ position: "absolute", left: "2%", top: "6%", width: "70%", height: "62%", borderRadius: 18, background: "#1E1F22" }} />
        )}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: GLASS.w, height: GLASS.h, transformOrigin: "0 0", transform: m, background: glassBg, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: power }}>{children}</div>
        {power < 0.999 ? <div style={{ position: "absolute", inset: 0, background: "#2A2B2E", opacity: (1 - power) * 0.85 }} /> : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(118deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.04) ${(30 + sheen * 0.2).toFixed(2)}%, rgba(255,255,255,0) ${(46 + sheen * 0.2).toFixed(2)}%, rgba(255,255,255,0) 100%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(0,0,0,.55), inset 0 0 40px rgba(0,0,0,.35)" }} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ the terminal on the glass
/** mono size on the glass: 145 content px is about 39 world px (35 px on screen) at the hook's laptop size */
export const GT = { fs: 145, lh: 172, top: 150, left: 80, title: 104 } as const;
export type GlassLine = {
  text: string;
  /** visible characters (fractional ok; text.length = all) */
  chars: number;
  /** 0..1 */
  o: number;
  /** a white tick before the text (a result line) */
  tick?: boolean;
  /** show a block cursor after the typed text */
  cursor?: boolean;
  /** row (default: the line's index) */
  slot?: number;
};

const Tick: React.FC<{ s: number; color?: string }> = ({ s, color = "#F2F2F2" }) => (
  <svg width={s} height={s} viewBox="0 0 40 40" style={{ display: "inline-block", verticalAlign: "middle", marginRight: s * 0.32, marginTop: -s * 0.1 }}>
    <path d="M7 21 L16 30 L33 11" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** the Claude Code style terminal (content px): a title bar with three dots, lines of mono text, an optional cursor */
export const GlassTerminal: React.FC<{ lines: GlassLine[]; scroll?: number; cursorOn?: boolean }> = ({ lines, scroll = 0, cursorOn = true }) => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#1B1C20 0%,#121316 100%)" }}>
    <div style={{ position: "absolute", left: 0, top: GT.title, right: 0, bottom: 0, overflow: "hidden" }}>
      {lines.map((l, i) => {
        if (l.o <= 0.001) return null;
        const shown = l.text.slice(0, Math.max(0, Math.floor(l.chars)));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: GT.left,
              top: GT.top - GT.title + (l.slot ?? i) * GT.lh - scroll,
              height: GT.lh,
              display: "flex",
              alignItems: "center",
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: GT.fs,
              letterSpacing: -3,
              color: l.tick ? "#D9D9DC" : "#F4F4F5",
              whiteSpace: "nowrap",
              opacity: l.o,
            }}
          >
            {l.tick ? <Tick s={GT.fs * 0.82} /> : null}
            <span>{shown}</span>
            {l.cursor && cursorOn ? <span style={{ display: "inline-block", width: GT.fs * 0.56, height: GT.fs * 0.98, marginLeft: shown.length ? GT.fs * 0.12 : 0, background: "#F4F4F5" }} /> : null}
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: GT.title, background: "#26272C", borderBottom: "3px solid #34353A" }}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", left: 48 + k * 58, top: GT.title / 2 - 17, width: 34, height: 34, borderRadius: 17, background: "#5A5B60" }} />
      ))}
    </div>
  </div>
);

// ------------------------------------------------------------------ paper material
/** a faint paper grain and a soft inner edge over a paper face (STYLE UPLIFT: physical materials); `id` must be unique */
export const PaperGrain: React.FC<{ id: string; opacity?: number }> = ({ id, opacity = 0.07 }) => (
  <>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "multiply", pointerEvents: "none" }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.31  0 0 0 1.4 -0.3" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
    <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.035), inset 0 -3px 8px rgba(0,0,0,.035), inset 0 2px 0 rgba(255,255,255,.9)", pointerEvents: "none" }} />
  </>
);

/**
 * Background paper: a big off-white sheet with one more peeking behind it, thickness edges and grain, lying under the
 * subject (the depth layer behind everything). `jig` px = a small flutter when something lands near it.
 */
export const BackSheet: React.FC<{ id: string; x: number; y: number; w: number; h: number; rot: number; jig?: number }> = ({ id, x, y, w, h, rot, jig = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y + jig, width: w, height: h, transform: `rotate(${rot}deg)`, transformOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", left: 26, top: 12, width: w, height: h - 8, borderRadius: 12, background: "#F1F0EC", boxShadow: theme.shadow.sheet, transform: "rotate(1.6deg)" }} />
    <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "#FAF9F6", boxShadow: "3px 3px 0 #E2E0DB, 5px 5px 0 #D5D3CE, 16px 26px 46px rgba(0,0,0,.12), 40px 64px 110px rgba(0,0,0,.07)", overflow: "hidden" }}>
      <PaperGrain id={id} opacity={0.09} />
    </div>
  </div>
);

// ------------------------------------------------------------------ erase geometry
export type Pt = { x: number; y: number };
/** a world point in the local frame of a box rotated `rot` deg about its centre */
const toLocal = (p: Pt, x: number, y: number, w: number, h: number, rot: number): Pt => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const a = (-rot * Math.PI) / 180;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return { x: w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: h / 2 + dx * Math.sin(a) + dy * Math.cos(a) };
};
/**
 * The erased part of a box (left of the contact line `lineX(y)`, world px) as a local clip polygon, or "all"/"none".
 * The box is x, y, w, h rotated `rot` deg about its centre.
 */
export const eraseClip = (lineX: (y: number) => number, x: number, y: number, w: number, h: number, rot: number): string | "all" | "none" => {
  // two world points on the line, far apart, into local px; intersect with the local top (y 0) and bottom (y h)
  const a = toLocal({ x: lineX(y - 600), y: y - 600 }, x, y, w, h, rot);
  const b = toLocal({ x: lineX(y + h + 600), y: y + h + 600 }, x, y, w, h, rot);
  const atY = (yy: number) => a.x + ((b.x - a.x) * (yy - a.y)) / (b.y - a.y);
  const xt = atY(0);
  const xb = atY(h);
  if (Math.max(xt, xb) <= 0) return "none";
  if (Math.min(xt, xb) >= w) return "all";
  // local px of a box-sized layer: everything left of the line, from the top edge to the bottom edge
  return `polygon(-4px 0px, ${xt.toFixed(1)}px 0px, ${xb.toFixed(1)}px ${h}px, -4px ${h}px)`;
};

// ------------------------------------------------------------------ file card
export type FileCardSpec = { name: string; x: number; y: number; w: number; h: number; rot: number; bars: number[] };

/**
 * A project file on a white paper card: mono name header, a thin rule, grey code bars. `clip` = the erased part
 * (pale grey paper over the content, from eraseClip); "all" = fully erased (pale grey paper, no ink, no edges'
 * whiteness). `sag` 0..1 settles the erased card a little; `tf` is appended (entrance, hand-off).
 */
export const FileCard: React.FC<{ c: FileCardSpec; clip: string | "all" | "none"; sag?: number; lean?: number; tf?: string; opacity?: number }> = ({ c, clip, sag = 0, lean = 0, tf = "", opacity = 1 }) => {
  const all = clip === "all";
  const fs = 40;
  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        top: c.y + 7 * sag,
        width: c.w,
        height: c.h,
        transform: `rotate(${(c.rot + 1.6 * sag).toFixed(3)}deg) perspective(1400px) rotateY(${lean.toFixed(2)}deg) ${tf}`,
        transformOrigin: "50% 50%",
        opacity,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: all ? ERASED : theme.color.paper, boxShadow: all ? ERASED_EDGE : theme.shadow.card, overflow: "hidden" }}>
        {all ? null : (
          <>
            <div style={{ position: "absolute", left: 22, top: 18, fontFamily: MONO, fontWeight: 700, fontSize: fs, letterSpacing: -1.2, color: theme.color.ink, whiteSpace: "nowrap" }}>{c.name}</div>
            <div style={{ position: "absolute", left: 22, right: 22, top: 18 + fs * 1.38, height: 3, background: "#E3E3E3" }} />
            {c.bars.map((bw, i) => (
              <div key={i} style={{ position: "absolute", left: 22 + (i % 2 ? 26 : 0), top: 18 + fs * 1.38 + 22 + i * 30, width: bw, height: 14, borderRadius: 7, background: i === 0 ? "#BDBDBD" : "#D5D5D5" }} />
            ))}
            {clip !== "none" ? <div style={{ position: "absolute", inset: 0, clipPath: clip, background: ERASED }} /> : null}
          </>
        )}
        <PaperGrain id={`hbfc-${c.name.replace(/\W/g, "")}`} />
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ phone with the to-do app
export type PhoneSpec = { x: number; y: number; w: number };
/** the phone's outer height, screen rect and radii (DeviceFrame's own maths) */
export const phoneGeom = (p: PhoneSpec) => {
  const b = Math.round(p.w * 0.05);
  const sr = Math.round(p.w * 0.11);
  const sw = p.w - 2 * b;
  const sh = sw * (1920 / 1080);
  return { b, sr, sw, sh, H: sh + 2 * b, screen: { x: p.x + b, y: p.y + b, w: sw, h: sh }, outerR: sr + b };
};

/** the to-do app as a full 1080 x 1920 frame (DeviceFrame scales it into the screen). `dark` 0..1 = dark mode on */
const TodoApp: React.FC<{ ticks: number[]; dark: number }> = ({ ticks, dark }) => {
  const bg = mixColor("#FFFFFF", "#1C1C1F", dark);
  const ink = mixColor("#111111", "#F2F2F2", dark);
  const bar = mixColor("#111111", "#4A4A50", dark);
  const disc = mixColor("#111111", "#5C5C62", dark);
  const BARS = [560, 470, 610];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: bg }}>
      <div style={{ position: "absolute", left: 110, top: 190, fontFamily: INTER, fontWeight: 800, fontSize: 230, letterSpacing: -8, color: ink, lineHeight: 1 }}>to-do</div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 470, height: 10, borderRadius: 5, background: mixColor("#E6E6E6", "#333338", dark) }} />
      {BARS.map((bw, i) => {
        const y = 620 + i * 330;
        const k = ticks[i] ?? 0;
        return (
          <div key={i} style={{ position: "absolute", left: 110, top: y, width: 860, height: 220 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 210, height: 210, borderRadius: 105, border: `20px solid ${disc}`, boxSizing: "border-box", background: k > 0.02 ? disc : "transparent" }}>
              <svg width={210} height={210} viewBox="0 0 210 210" style={{ position: "absolute", left: -20, top: -20, opacity: Math.min(1, k * 2) }}>
                <path d="M58 108 L92 142 L154 74" fill="none" stroke={bg} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={150} strokeDashoffset={150 * (1 - k)} />
              </svg>
            </div>
            <div style={{ position: "absolute", left: 270, top: 70, width: bw, height: 76, borderRadius: 38, background: bar }} />
          </div>
        );
      })}
    </div>
  );
};

/**
 * The phone (kit DeviceFrame at rest) with the to-do app. `crack` = a black-ink crack web on the screen from its
 * top-right corner (ShatterOverlay timing, group frames); `clip` = the erased part as pale grey paper in the phone's
 * shape ("all" = only the grey silhouette is left).
 */
export const PhoneApp: React.FC<{ p: PhoneSpec; ticks: number[]; dark: number; crack?: { at: number; dur?: number }; clip: string | "all" | "none"; sag?: number; tf?: string; opacity?: number }> = ({
  p,
  ticks,
  dark,
  crack,
  clip,
  sag = 0,
  tf = "",
  opacity = 1,
}) => {
  const g = phoneGeom(p);
  const all = clip === "all";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(7 * sag).toFixed(2)}px) ${tf}`, transformOrigin: `${p.x + p.w / 2}px ${p.y + g.H}px`, opacity }}>
      {all ? null : (
        <>
          <DeviceFrame x={p.x} y={p.y} w={p.w} at={-1000} dur={1}>
            <TodoApp ticks={ticks} dark={dark} />
          </DeviceFrame>
          {crack ? <ShatterOverlay x={g.screen.x} y={g.screen.y} w={g.screen.w} h={g.screen.h} ox={g.screen.w - 16} oy={18} seed={23} at={crack.at} dur={crack.dur ?? 12} radius={g.sr} opacity={0.92} /> : null}
        </>
      )}
      {clip !== "none" ? (
        <div
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.w,
            height: g.H,
            transformOrigin: "50% 50%",
            transform: all ? `rotate(${(1.4 * sag).toFixed(3)}deg)` : undefined,
            clipPath: all ? undefined : clip,
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: g.outerR, background: ERASED, boxShadow: all ? ERASED_EDGE : undefined }} />
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ strike bar
/** a thick black bar drawn across a chip left to right (`p` 0..1), longer than the chip on both sides, own shadow */
export const StrikeBar: React.FC<{ cx: number; cy: number; len: number; p: number; rot?: number; thick?: number; opacity?: number; dy?: number }> = ({ cx, cy, len, p, rot = -14, thick = 22, opacity = 1, dy = 0 }) => {
  if (p <= 0.001 || opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: cx - len / 2, top: cy - thick / 2 + dy, width: len, height: thick, transform: `rotate(${rot}deg)`, transformOrigin: "50% 50%", opacity }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: len * p,
          height: thick,
          borderRadius: thick / 2,
          background: theme.color.ink,
          boxShadow: "6px 10px 14px rgba(0,0,0,.22), 2px 3px 3px rgba(0,0,0,.14)",
        }}
      />
    </div>
  );
};

// ------------------------------------------------------------------ the eraser
/** eraser.png (1823 x 1047): its long axis runs through the image centre at about -11.5 deg and is about 92% of the
 *  image width (ep07 measurement); the drawn fallback is a plain block along the image's x axis */
export const ERASER_ASPECT = 1823 / 1047;
const ERASER_IMG_AXIS = -11.5;
/** image width on the paper and the stroke's tilt: near upright, top leaning right, so one pass spans the front row */
export const ERASER_L = 480;
export const ERASER_ROT = -76;
const RAD = (ERASER_ROT * Math.PI) / 180;
/** the erase line trails the long axis a little, so the boundary always sits under the eraser's body */
const TRAIL = 34;
/** erase line x at world y for an eraser centred at (ex, ey): its long axis, shifted back by TRAIL */
export const contactX = (ex: number, ey: number, y: number) => ex - TRAIL + (y - ey) * (Math.cos(RAD) / Math.sin(RAD));

/** the eraser: photo cut-out (or a drawn pink and white block) pressed on the paper; the shadow sits on an
 *  untransformed wrapper so it always falls down-right */
export const Eraser: React.FC<{ cx: number; cy: number; rot?: number }> = ({ cx, cy, rot = 0 }) => {
  const src = hbAsset("eraser.png");
  const L = ERASER_L;
  const S = L / ERASER_ASPECT;
  const B = L / 2 + 40;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - B,
        top: cy - B,
        width: 2 * B,
        height: 2 * B,
        filter: "drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(7px 10px 6px rgba(0,0,0,.18)) drop-shadow(22px 32px 22px rgba(0,0,0,.18))",
      }}
    >
      <div style={{ position: "absolute", left: B - L / 2, top: B - S / 2, width: L, height: S, transform: `rotate(${(ERASER_ROT - (src ? ERASER_IMG_AXIS : 0) + rot).toFixed(3)}deg)`, transformOrigin: "50% 50%" }}>
        {src ? (
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        ) : (
          <div style={{ position: "absolute", inset: "18%", borderRadius: S * 0.12, overflow: "hidden", boxShadow: "inset -6px -8px 0 rgba(0,0,0,.10), inset 4px 5px 0 rgba(255,255,255,.45)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "58%", background: "linear-gradient(160deg,#F7B9C6 0%,#EE97AB 70%,#E2879C 100%)" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "42%", background: "linear-gradient(160deg,#FFFFFF 0%,#F1F0EC 70%,#E3E1DC 100%)" }} />
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ crumbs and flakes
export type Crumb = { x: number; y: number; spawn: number; dx: number; dy: number; rot: number; size: number; col: string };
const CRUMB_COLS = ["#EBC0CA", "#DDD8D3", "#F2D3DA", "#D6D1CC"];
/** rubber crumbs inside `rects` (world px): each appears where the contact line passes it and rolls a little down-right */
export const makeCrumbs = (n: number, rects: { x: number; y: number; w: number; h: number }[], passAt: (x: number, y: number) => number): Crumb[] =>
  Array.from({ length: n }, (_, i) => {
    const r = rects[i % rects.length];
    const x = r.x + 16 + hash01(41, i, 2) * (r.w - 32);
    const y = r.y + 16 + hash01(41, i, 1) * (r.h - 32);
    return {
      x,
      y,
      spawn: passAt(x, y),
      dx: -6 + 26 * hash01(41, i, 3),
      dy: 10 + 26 * hash01(41, i, 4),
      rot: -60 + 120 * hash01(41, i, 5),
      size: 6 + 8 * hash01(41, i, 6),
      col: CRUMB_COLS[Math.floor(hash01(41, i, 7) * CRUMB_COLS.length) % CRUMB_COLS.length],
    };
  });

export const Crumbs: React.FC<{ f: number; crumbs: Crumb[]; opacity?: number }> = ({ f, crumbs, opacity = 1 }) => (
  <>
    {crumbs.map((c, i) => {
      if (f < c.spawn || opacity <= 0.001) return null;
      // SMOOTHNESS: a crumb grows in and rolls over 14 frames (cubic in-out), never popping
      const p = prog(f, c.spawn, c.spawn + 14, EASE.cam);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x + c.dx * p - c.size / 2,
            top: c.y + c.dy * p - c.size / 2,
            width: c.size,
            height: c.size * 0.7,
            borderRadius: c.size * 0.3,
            background: c.col,
            transform: `rotate(${(c.rot * p).toFixed(2)}deg) scale(${mix(0.3, 1, p).toFixed(4)})`,
            boxShadow: "2px 3px 2px rgba(0,0,0,.14)",
            opacity: opacity * Math.min(1, p * 1.6),
          }}
        />
      );
    })}
  </>
);

/** grey paper flakes breaking off the bottom edge of an erased item (it crumbles): `at` = when it is fully erased */
export const Flakes: React.FC<{ f: number; at: number; x0: number; x1: number; y: number; seed: number; n?: number }> = ({ f, at, x0, x1, y, seed, n = 5 }) => {
  if (f < at) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const start = at + hash01(seed, i, 1) * 6;
        const p = prog(f, start, start + 22, EASE.cam);
        if (f < start || p >= 1) return null;
        const x = mix(x0 + 18, x1 - 18, hash01(seed, i, 2));
        const s = 12 + 14 * hash01(seed, i, 3);
        const fall = 40 + 50 * hash01(seed, i, 4);
        const rot = -90 + 180 * hash01(seed, i, 5);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - s / 2 + 10 * p,
              top: y - s * 0.4 + fall * p,
              width: s,
              height: s * 0.62,
              clipPath: "polygon(0% 20%, 70% 0%, 100% 60%, 30% 100%)",
              background: "#E2E0DC",
              transform: `rotate(${(rot * p).toFixed(2)}deg)`,
              opacity: Math.sin(Math.PI * p),
            }}
          />
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ smooth pops (SMOOTHNESS: 12-14 frames, cubic in-out)
/**
 * A logo button popping in over `dur` frames (scale 0.6 to 1, cubic in-out, no overshoot), the kit's LogoDisc look.
 * `exit` shrinks it back the same way.
 */
export const PopDisc: React.FC<{ f: number; cx: number; cy: number; r: number; name: string; src?: string; at: number; dur?: number; grey?: boolean; opacity?: number }> = ({
  f,
  cx,
  cy,
  r,
  name,
  src,
  at,
  dur = 12,
  grey,
  opacity = 1,
}) => {
  const p = prog(f, at, at + dur, EASE.cam);
  if (p <= 0 || opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, transform: `scale(${mix(0.6, 1, p).toFixed(4)})`, opacity: Math.min(1, p * 1.5) * opacity }}>
      <LogoDisc name={name} r={r} src={src} grey={grey} />
    </div>
  );
};

/** a hollow wire node popping in over 12 frames (cubic in-out) */
export const PopNode: React.FC<{ f: number; cx: number; cy: number; at: number }> = ({ f, cx, cy, at }) => {
  const p = prog(f, at, at + 12, EASE.cam);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${mix(0.4, 1, p).toFixed(4)})`, opacity: Math.min(1, p * 1.5) }}>
      <WireNode cx={cx} cy={cy} />
    </div>
  );
};

/**
 * The black chat bubble (the kit ChatBubble look: white Inter 700, tail at the bottom-left corner), popping out of a
 * source point over `dur` frames (scale 0.25 to 1 from its tail corner, cubic in-out) and shrinking back into it over
 * `out.dur` frames; a slow drift while it rests.
 */
export const SmoothBubble: React.FC<{ f: number; text: string; x: number; y: number; ox: number; oy: number; at: number; dur?: number; fs?: number; out?: { at: number; dur: number } }> = ({
  f,
  text,
  x,
  y,
  ox,
  oy,
  at,
  dur = 14,
  fs = 46,
  out,
}) => {
  const pin = prog(f, at, at + dur, EASE.cam);
  const pout = out ? prog(f, out.at, out.at + out.dur, EASE.cam) : 0;
  const p = pin * (1 - pout);
  if (p <= 0.001) return null;
  const h = Math.round(fs * 1.2 + fs * 0.62 * 2);
  const sx = ox - x;
  const sy = oy - (y + h);
  const d = { x: 2 * Math.sin(((f - at) / 80) * Math.PI * 2), y: 1.2 * Math.cos(((f - at) / 104) * Math.PI * 2) };
  const tail = Math.round(fs * 0.9);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${(mix(sx, 0, p) + d.x).toFixed(2)}px,${(mix(sy, 0, p) + d.y).toFixed(2)}px) scale(${mix(0.25, 1, p).toFixed(4)})`,
        transformOrigin: "0% 100%",
        opacity: Math.min(1, p * 2),
        filter: "drop-shadow(8px 14px 14px rgba(0,0,0,.20)) drop-shadow(2px 4px 3px rgba(0,0,0,.12))",
      }}
    >
      <div
        style={{
          position: "relative",
          height: h,
          display: "inline-flex",
          alignItems: "center",
          padding: `0 ${Math.round(fs * 0.72)}px`,
          background: theme.color.ink,
          color: "#fff",
          borderRadius: 24,
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: fs,
          letterSpacing: -0.5,
          whiteSpace: "nowrap",
        }}
      >
        <svg width={tail} height={tail} viewBox="0 0 40 40" style={{ position: "absolute", bottom: -tail * 0.42, left: -tail * 0.38 }} aria-hidden>
          <path d="M40 0 C 34 18, 22 30, 0 36 C 18 36, 32 30, 40 22 Z" fill={theme.color.ink} />
        </svg>
        <span style={{ position: "relative" }}>{text}</span>
      </div>
    </div>
  );
};
