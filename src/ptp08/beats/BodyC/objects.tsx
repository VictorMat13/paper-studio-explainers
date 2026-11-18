// BodyC drawn objects (local helpers; the kit has none of these): the clock chip, the ghost card, the strike bar, the
// tick chip, the ring marker, the GitHub slab, the paper tag fallback, the coin, the person and keyboard chips.
// Solid shaded objects in black ink on white buttons, one light top left (every shadow falls down-right), no line art,
// nothing glowing. Render-only: callers pass every frame value.
import React from "react";
import { Img } from "remotion";
import { INTER, MONO, mix, theme, useCamera } from "../../../paperstudio";
import { LOGOS } from "./assets";

/** the white button body every chip sits in (kit LogoDisc look): thick white rim, inner face, soft shadow down-right */
const Button: React.FC<{ r: number; face?: string; children?: React.ReactNode }> = ({ r, face = "#fff", children }) => {
  const rim = Math.round(r * 0.2);
  return (
    <div
      style={{
        position: "absolute",
        left: -r,
        top: -r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: `0 0 0 1px rgba(0,0,0,.05),${Math.round(r * 0.22)}px ${Math.round(r * 0.32)}px ${Math.round(r * 0.6)}px rgba(0,0,0,.20),${Math.round(r * 0.06)}px ${Math.round(r * 0.08)}px ${Math.round(
          r * 0.12,
        )}px rgba(0,0,0,.10),inset 0 2px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.05)`,
      }}
    >
      <div style={{ position: "absolute", inset: rim, borderRadius: "50%", background: face, boxShadow: "inset 0 2px 4px rgba(0,0,0,.10),inset 0 -2px 2px rgba(255,255,255,.7)", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

/** wrapper placing a centred object at (cx, cy) with pop p (scale 0.6 -> 1, no overshoot), extra scale, rotation */
export const Place: React.FC<{ cx: number; cy: number; p?: number; k?: number; rot?: number; opacity?: number; children: React.ReactNode }> = ({ cx, cy, p = 1, k = 1, rot = 0, opacity = 1, children }) => {
  if (p <= 0.001 || opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, willChange: "transform", transform: `translate(${cx.toFixed(3)}px,${cy.toFixed(3)}px) rotate(${rot.toFixed(3)}deg) scale(${(mix(0.6, 1, p) * k).toFixed(4)})`, opacity: Math.min(1, p * 1.6) * opacity }}>
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ clock chip
/** a white button holding a clock face: 12 ticks, a black hour and minute hand (degrees, 0 = 12 o'clock) */
export const ClockChip: React.FC<{ r: number; hour: number; minute: number }> = ({ r, hour, minute }) => {
  const inner = r * 0.8;
  const d = 2 * inner;
  return (
    <Button r={r}>
      <svg width={d} height={d} viewBox="-100 -100 200 200" style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={0} cy={0} r={88} fill="none" stroke={theme.color.ink} strokeWidth={9} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const r0 = i % 3 === 0 ? 62 : 70;
          return <line key={i} x1={Math.sin(a) * r0} y1={-Math.cos(a) * r0} x2={Math.sin(a) * 79} y2={-Math.cos(a) * 79} stroke={theme.color.ink} strokeWidth={i % 3 === 0 ? 8 : 5} strokeLinecap="round" />;
        })}
        <g transform={`rotate(${hour.toFixed(2)})`}>
          <line x1={0} y1={8} x2={0} y2={-40} stroke={theme.color.ink} strokeWidth={13} strokeLinecap="round" />
        </g>
        <g transform={`rotate(${minute.toFixed(2)})`}>
          <line x1={0} y1={10} x2={0} y2={-62} stroke={theme.color.ink} strokeWidth={8} strokeLinecap="round" />
        </g>
        <circle cx={0} cy={0} r={10} fill={theme.color.ink} />
      </svg>
    </Button>
  );
};

// ------------------------------------------------------------------ ghost card
/** a dashed-outline ghost of the app window (the version from an hour ago): no fill, dashed ink outline, faint rows */
export const GhostCard: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} style={{ position: "absolute", left: -w / 2, top: -h / 2, overflow: "visible" }}>
    <rect x={3} y={3} width={w - 6} height={h - 6} rx={22} fill="rgba(255,255,255,.55)" stroke={theme.color.ink} strokeWidth={6} strokeDasharray="18 14" strokeLinecap="round" />
    <line x1={3} y1={h * 0.2} x2={w - 3} y2={h * 0.2} stroke={theme.color.ink} strokeWidth={4} strokeDasharray="12 12" opacity={0.6} />
    {[0.38, 0.58, 0.78].map((y, i) => (
      <g key={i} opacity={0.55}>
        <circle cx={w * 0.14} cy={h * y} r={h * 0.05} fill="none" stroke={theme.color.ink} strokeWidth={4} strokeDasharray="6 6" />
        <line x1={w * 0.24} y1={h * y} x2={w * (0.78 - i * 0.1)} y2={h * y} stroke={theme.color.ink} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

// ------------------------------------------------------------------ strike bar
/** a thick black bar drawing across from x0 to x1 at y (p 0..1 = how far it has drawn), with a cast shadow */
export const StrikeBar: React.FC<{ x0: number; x1: number; y: number; p: number; h?: number; rot?: number }> = ({ x0, x1, y, p, h = 18, rot = 0 }) => {
  if (p <= 0.001) return null;
  const w = (x1 - x0) * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x0,
        top: y - h / 2,
        width: w,
        height: h,
        background: theme.color.ink,
        borderRadius: h / 2,
        transform: `rotate(${rot}deg)`,
        transformOrigin: "0 50%",
        boxShadow: "6px 9px 8px rgba(0,0,0,.22)",
      }}
    />
  );
};

// ------------------------------------------------------------------ tick chip
/** a small black button with a white tick that draws on (p 0..1) */
export const TickChip: React.FC<{ r: number; p?: number }> = ({ r, p = 1 }) => (
  <div style={{ position: "absolute", left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: theme.color.ink, boxShadow: `${r * 0.18}px ${r * 0.28}px ${r * 0.5}px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.18)` }}>
    <svg width={2 * r} height={2 * r} viewBox="0 0 40 40" style={{ position: "absolute", left: 0, top: 0 }}>
      <path d="M11 21 L17.5 27.5 L29.5 14" fill="none" stroke="#fff" strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - p)} />
    </svg>
  </div>
);

// ------------------------------------------------------------------ ring marker
/** the hollow ring that marks "you are here" on the wire: a thick black ring with a white core and a cast shadow */
export const RingMarker: React.FC<{ r?: number }> = ({ r = 30 }) => (
  <div
    style={{
      position: "absolute",
      left: -r,
      top: -r,
      width: 2 * r,
      height: 2 * r,
      borderRadius: "50%",
      border: `${Math.round(r * 0.36)}px solid ${theme.color.ink}`,
      boxSizing: "border-box",
      background: "rgba(255,255,255,.0)",
      boxShadow: "6px 10px 10px rgba(0,0,0,.22)",
    }}
  />
);

// ------------------------------------------------------------------ GitHub slab
/** the heavy charcoal GitHub slab (the shared look): rounded, a darker thickness edge, the official white Invertocat,
 *  the lowercase 'github' label under it in white Inter 800. Centred at (0, 0) in its parent; w = slab width. */
export const GithubSlab: React.FC<{ w: number; label?: boolean }> = ({ w, label = true }) => {
  const h = w * (label ? 1.04 : 0.86);
  const R = w * 0.19;
  const edge = Math.max(8, w * 0.07);
  const mark = w * 0.5;
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h }}>
      <div style={{ position: "absolute", left: 0, top: edge, width: w, height: h, borderRadius: R, background: "linear-gradient(180deg,#151516 0%,#070708 100%)", boxShadow: `${w * 0.08}px ${w * 0.14}px ${w * 0.2}px rgba(0,0,0,.28),${w * 0.22}px ${w * 0.36}px ${w * 0.55}px rgba(0,0,0,.14)` }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: R,
          background: "linear-gradient(158deg,#3b3b3e 0%,#262628 42%,#1a1a1c 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,.16),inset 2px 0 0 rgba(255,255,255,.06),inset 0 -3px 0 rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 40%)" }} />
        {LOGOS.githubWhite ? (
          <Img src={LOGOS.githubWhite} style={{ position: "absolute", left: (w - mark) / 2, top: label ? h * 0.13 : (h - mark) / 2, width: mark, height: mark, objectFit: "contain" }} />
        ) : (
          <div style={{ position: "absolute", left: (w - mark) / 2, top: h * 0.13, width: mark, height: mark, borderRadius: "50%", background: "#fff" }} />
        )}
        {label ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.68, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: w * 0.17, letterSpacing: -w * 0.004, color: "#fff", lineHeight: 1 }}>github</div>
        ) : null}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ paper tag (drawn fallback until paper-tag.png lands)
/** a kraft cardboard tag with a reinforced hole and its string up to (0, 0) (the hanging point); text in Inter 800 */
export const PaperTag: React.FC<{ w: number; text: string; src?: string; len?: number }> = ({ w, text, src, len = 70 }) => {
  const h = w * 0.62;
  const hole = { x: w * 0.13, y: h / 2 };
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      {/* string from the hanging point to the hole */}
      <svg width={8} height={len + 8} style={{ position: "absolute", left: -4, top: 0, overflow: "visible" }}>
        <path d={`M4 0 C 10 ${len * 0.4}, -2 ${len * 0.7}, 4 ${len}`} stroke="#6E5A3E" strokeWidth={4} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: -hole.x, top: len - hole.y, width: w, height: h, filter: "drop-shadow(8px 12px 8px rgba(0,0,0,.22)) drop-shadow(2px 3px 1px rgba(0,0,0,.12))" }}>
        {src ? (
          <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
            <defs>
              <linearGradient id="bcKraft" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#D9B98A" />
                <stop offset="1" stopColor="#C29C68" />
              </linearGradient>
            </defs>
            <path d={`M${h * 0.32} 0 L${w - 10} 0 Q${w} 0 ${w} 10 L${w} ${h - 10} Q${w} ${h} ${w - 10} ${h} L${h * 0.32} ${h} L0 ${h * 0.66} L0 ${h * 0.34} Z`} fill="url(#bcKraft)" />
            <path d={`M${h * 0.32} 2 L${w - 10} 2`} stroke="rgba(255,255,255,.35)" strokeWidth={2} />
            <circle cx={hole.x} cy={hole.y} r={h * 0.13} fill="#E9D8BC" stroke="#B48E5C" strokeWidth={3} />
            <circle cx={hole.x} cy={hole.y} r={h * 0.065} fill="#F4F3F2" />
          </svg>
        )}
        <div style={{ position: "absolute", left: w * 0.26, right: w * 0.04, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: h * 0.56, letterSpacing: -h * 0.02, color: theme.color.ink, lineHeight: 1 }}>
          {text}
        </div>
      </div>
    </div>
  );
};

/** the ASSETS paper-tag.png (617 x 1938, portrait: twine rising from the top, the blank kraft face y 990-1860) hanging
 *  from (0, 0), the point on its twine 8% down the image (as if tied over a wire); 'text' in Inter 800 on the face. */
export const TAG_PHOTO = { w: 617, h: 1938, hangX: 0.49, hangY: 0.08, face: { cx: 0.502, cy: 0.722, w: 0.82 } } as const;
export const TagPhoto: React.FC<{ w: number; src: string; text: string; ink?: number }> = ({ w, src, text, ink = 1 }) => {
  const T = TAG_PHOTO;
  const h = (w * T.h) / T.w;
  const fs = w * 0.58;
  return (
    <div style={{ position: "absolute", left: -T.hangX * w, top: -T.hangY * h, width: w, height: h, filter: "drop-shadow(0 0 1px rgba(255,255,255,.6)) drop-shadow(8px 12px 8px rgba(0,0,0,.20)) drop-shadow(22px 32px 22px rgba(0,0,0,.16))" }}>
      <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {text ? (
        <div
          style={{
            position: "absolute",
            left: T.face.cx * w - (T.face.w * w) / 2,
            width: T.face.w * w,
            top: T.face.cy * h - fs * 0.6,
            height: fs * 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: fs,
            letterSpacing: -fs * 0.03,
            lineHeight: 1,
            color: theme.color.ink,
            opacity: ink,
            transform: "skewY(-2deg)",
          }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ coin with a strike
/** a solid black coin seen slightly from the side (rim below the face), a white '$', optional strike bar across */
export const Coin: React.FC<{ r: number; strike?: number }> = ({ r, strike = 0 }) => (
  <div style={{ position: "absolute", left: -r, top: -r * 0.86, width: 2 * r, height: 2 * r * 0.86 + r * 0.22 }}>
    <div style={{ position: "absolute", left: 0, top: r * 0.22, width: 2 * r, height: 2 * r * 0.86, borderRadius: "50%", background: "#000", boxShadow: `${r * 0.2}px ${r * 0.3}px ${r * 0.5}px rgba(0,0,0,.25)` }} />
    <div style={{ position: "absolute", left: 0, top: 0, width: 2 * r, height: 2 * r * 0.86, borderRadius: "50%", background: "radial-gradient(ellipse at 35% 30%, #3a3a3c 0%, #161617 70%)", boxShadow: "inset 0 2px 0 rgba(255,255,255,.18)" }}>
      <div style={{ position: "absolute", inset: r * 0.16, borderRadius: "50%", border: `${Math.max(3, r * 0.06)}px solid rgba(255,255,255,.28)` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: r * 1.0, color: "#fff", lineHeight: 1 }}>$</div>
    </div>
    {strike > 0.001 ? <StrikeBar x0={-r * 0.25} x1={2 * r + r * 0.25} y={r * 0.86} p={strike} h={Math.max(10, r * 0.2)} rot={-28} /> : null}
  </div>
);

// ------------------------------------------------------------------ person chip and keyboard chip
/** a white button with a solid black person (head + shoulders) */
export const PersonChip: React.FC<{ r: number }> = ({ r }) => (
  <Button r={r}>
    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", left: 0, top: 0 }}>
      <circle cx={50} cy={38} r={17} fill={theme.color.ink} />
      <path d="M18 88 C 20 66, 34 58, 50 58 C 66 58, 80 66, 82 88 Z" fill={theme.color.ink} />
    </svg>
  </Button>
);

/** a white rounded key-board slab: a black keyboard with white key caps (solid, not line art) */
export const KeyboardChip: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 0.62;
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, borderRadius: w * 0.14, background: "#fff", boxShadow: `0 0 0 1px rgba(0,0,0,.05),${w * 0.08}px ${w * 0.12}px ${w * 0.2}px rgba(0,0,0,.20),inset 0 2px 0 #fff` }}>
      <div style={{ position: "absolute", inset: w * 0.09, borderRadius: w * 0.08, background: theme.color.ink, padding: w * 0.05, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {[10, 9, 6].map((n, row) => (
          <div key={row} style={{ display: "flex", justifyContent: "center", gap: w * 0.022 }}>
            {Array.from({ length: n }, (_, i) => (
              <div key={i} style={{ width: row === 2 && i === 2 ? w * 0.24 : w * 0.052, height: w * 0.085, borderRadius: w * 0.012, background: "#F1F1F1" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ commit card (the kit Commit look, sized for a board)
/** a small white commit card: mono 7-hex hash, a one-line message, a dark avatar dot; thickness edge and shadow.
 *  Centred at (0, 0). `tree` 0..1 opens a tiny file tree under the message (the card grows taller). */
export const CommitCard: React.FC<{ w: number; hash: string; msg: string; tree?: number; grey?: number; fs?: number }> = ({ w, hash, msg, tree = 0, grey = 0, fs = 34 }) => {
  const base = fs * 3.3;
  const treeH = fs * 0.7 * 5 + fs * 0.6;
  const h = base + treeH * tree;
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -base / 2, width: w, height: h, filter: grey > 0.01 ? `grayscale(${grey}) opacity(${(1 - 0.5 * grey).toFixed(3)})` : undefined }}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 14, boxShadow: theme.shadow.card, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: fs * 0.5, top: fs * 0.42, width: fs * 0.7, height: fs * 0.7, borderRadius: "50%", background: "#2A2A2C" }} />
        <div style={{ position: "absolute", left: fs * 1.45, top: fs * 0.32, fontFamily: MONO, fontWeight: 700, fontSize: fs, letterSpacing: -0.5, color: theme.color.ink, whiteSpace: "nowrap" }}>{hash}</div>
        <div style={{ position: "absolute", left: fs * 0.5, top: fs * 1.62, fontFamily: INTER, fontWeight: 600, fontSize: fs * 0.92, letterSpacing: -0.6, color: "#3A3A3A", whiteSpace: "nowrap" }}>{msg}</div>
        {tree > 0.01 ? (
          <div style={{ position: "absolute", left: fs * 0.5, top: base, opacity: Math.min(1, tree * 1.6) }}>
            {["index.html", "package.json", "src/App.jsx", "src/List.jsx", "styles.css"].map((n, i) => (
              <div key={n} style={{ position: "absolute", left: 0, top: i * fs * 0.7, fontFamily: MONO, fontWeight: 600, fontSize: fs * 0.62, color: theme.color.ink, whiteSpace: "nowrap", opacity: Math.min(1, Math.max(0, tree * 6 - i)) }}>
                <span style={{ display: "inline-block", width: fs * 0.36, height: fs * 0.46, border: `${Math.max(2, fs * 0.07)}px solid ${theme.color.ink}`, borderRadius: 2, marginRight: fs * 0.22, verticalAlign: "-8%" }} />
                {n}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ depth: parallax layers and back sheets
/** draws its children as a layer moving at `rate` of the camera (1 = the world, 0.7 = background, 1.15 = foreground):
 *  counter-shifts the camera's pan by (1 - rate) and its zoom by zoom^(rate - 1) about the camera's focus. Use inside a
 *  kit Camera's world. */
export const Parallax: React.FC<{ rate: number; children: React.ReactNode }> = ({ rate, children }) => {
  const { pose, anchor } = useCamera();
  const k = 1 - rate;
  const dx = (pose.x - anchor.x) * k;
  const dy = (pose.y - anchor.y) * k;
  const s = Math.pow(pose.zoom, rate - 1);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${pose.x.toFixed(2)}px ${pose.y.toFixed(2)}px`, transform: `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) scale(${s.toFixed(5)})` }}>
      {children}
    </div>
  );
};

/** one plain paper sheet with thickness, a faint fibre texture and grey text bars, leaning `rot` deg */
export const Sheet: React.FC<{ x: number; y: number; w: number; h: number; rot: number; bars?: number; flutter?: number }> = ({ x, y, w, h, rot, bars = 7, flutter = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, willChange: "transform", transform: `translateY(${flutter.toFixed(3)}px) rotate(${rot.toFixed(3)}deg)`, transformOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", left: 14, top: 10, width: w, height: h, borderRadius: 12, background: theme.color.sheet, boxShadow: theme.shadow.sheet }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 14,
        background: "radial-gradient(ellipse at 30% 20%, #FFFFFF 0%, #FBFBFA 60%, #F3F2F0 100%)",
        boxShadow: "3px 3px 0 #DCDCDC,5px 5px 0 #CFCFCF,18px 28px 50px rgba(0,0,0,.14),inset 0 0 0 1px rgba(0,0,0,.03),inset 0 0 26px rgba(0,0,0,.035)",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: w * 0.1, top: h * 0.12 + i * (h * 0.76) / Math.max(1, bars - 1), width: w * (i % 3 === 2 ? 0.5 : 0.78), height: Math.max(8, h * 0.022), borderRadius: 6, background: "#E6E5E3" }} />
      ))}
    </div>
  </div>
);

/** the background layer: paper sheets peeking in at the frame edges behind the subject (parallax 0.7), each fluttering
 *  a pixel when `bump` frames hit; `layout` picks a pair of positions so scenes differ */
export const BackSheets: React.FC<{ f: number; layout?: 0 | 1 | 2; opacity?: number; inP?: number; dx?: number }> = ({ f, layout = 0, opacity = 1, inP = 1, dx = 0 }) => {
  const L = [
    [
      { x: -250, y: 560, w: 380, h: 500, rot: -9 },
      { x: 930, y: 900, w: 360, h: 470, rot: 8 },
    ],
    [
      { x: 950, y: 470, w: 360, h: 460, rot: 7 },
      { x: -260, y: 960, w: 380, h: 480, rot: -6 },
    ],
    [
      { x: -270, y: 700, w: 380, h: 520, rot: -7 },
      { x: 960, y: 640, w: 360, h: 500, rot: 9 },
    ],
  ][layout];
  return (
    <Parallax rate={0.7}>
      <div style={{ position: "absolute", inset: 0, opacity: inP <= 0.001 ? 0 : opacity }}>
        {L.map((s, i) => (
          <Sheet key={i} {...s} x={dx + s.x + (s.x < 0 ? -320 : 320) * (1 - inP)} rot={s.rot + 0.3 * Math.sin((f + 37 * i) / 71)} flutter={1.2 * Math.sin((f + 19 * i) / 23)} />
        ))}
      </div>
    </Parallax>
  );
};
