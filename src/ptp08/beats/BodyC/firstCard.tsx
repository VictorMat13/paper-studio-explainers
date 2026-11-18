// ===========================================================================
// BodyC's first card (C01a): the laptop with one app card on its screen and the '1 copy' pill on its lid. It is
// the hand-off target of every hook (HA, HB, HC branch on bodyOf(variant) and draw <FirstCard t={0} /> full size on
// their last frame). Imports only the kit and ./assets (the laptop is the kit's own copy, always bundled).
//
// <FirstCard t={0} /> with no other props is EXACTLY BodyC's frame 0: world px (before the shell's 0.9 pad, the same
// world px a hook's own Camera uses), camera at identity, no ground (the camera draws it). For t > 0 only ambient
// motion is added, and it starts from rest (so t = 0 and every t < 0 are the rest pose): the laptop floats 2 px, the
// glass sheen drifts, the pill sways a fraction of a degree, the caret in the app blinks.
//
// The text beat "Here's the / problem." (110 px on screen) is NOT part of FirstCard: BodyC draws it in its camera hud
// on the spoken words, and its first word lands on the body's frame 0 or later with zero opacity, so the hand-off
// frame shows no text. Keep the band above the laptop (world y 236-560, see FC.textBand) clear on the hook's last
// frames.
//
// Look (storyboard C01a): the ep06 laptop cut-out (laptop.png, three-quarter view) 900 px wide, its lid's black screen
// showing a dark desktop with a white to-do app window in front (title 'to-do', three rows with black ticks, a fourth
// row with a caret) and the project's file tree card peeking out behind it to the right (mono: index.html,
// package.json, src/App.jsx, src/List.jsx, styles.css). A white pill with a 4 px ink rim reading '1 copy' sits on the
// lid's top-left corner, leaning with the lid (-5 deg). One light top left: the laptop casts the kit's cut-out shadow.
// ===========================================================================
import React from "react";
import { Img } from "remotion";
import { INTER, META06, MONO, mix, quadMatrix3d, theme, type P2, type Quad } from "../../../paperstudio";
import { ASPECT, KIT_LAPTOP } from "./assets";

// ------------------------------------------------------------------ geometry (world px)
/** the laptop photo box on frame 0 */
export const LAP = { x: 90, y: 556, w: 900, h: 900 / ASPECT.laptop } as const;
/** screen content size (content px); children of <LaptopScreen> are drawn at this size and mapped onto the glass */
export const SCREEN = { w: 1600, h: 1000 } as const;
/** the screen's corners as fractions of the photo (ep06 measurement, META06.laptop.quad) */
export const QUAD_F: Quad = META06.laptop.quad;

/** the screen quad in world px for a laptop box */
export const screenQuad = (box: { x: number; y: number; w: number; h: number } = LAP): Quad => QUAD_F.map(([u, v]) => [box.x + u * box.w, box.y + v * box.h] as P2) as Quad;

/** world point of a content point (u, v) on the glass of a laptop box (the same homography as the matrix3d) */
export const screenPoint = (u: number, v: number, box: { x: number; y: number; w: number; h: number } = LAP): { x: number; y: number } => {
  const q = screenQuad(box);
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  const s = u / SCREEN.w;
  const t = v / SCREEN.h;
  const w = g * s + h * t + 1;
  return { x: (a * s + b * t + x0) / w, y: (d * s + e * t + y0) / w };
};

/** the app window and the file tree card on the glass (content px) */
export const APP = { x: 110, y: 170, w: 860, h: 760, r: 30 } as const;
export const TREE = { x: 880, y: 92, w: 680, h: 740, r: 26 } as const;
/** the five files of the project (the order BodyC reshuffles) */
export const FILES = ["index.html", "package.json", "src/App.jsx", "src/List.jsx", "styles.css"] as const;
/** the to-do rows */
export const ROWS = ["buy groceries", "reply to emails", "book flights"] as const;

/** everything a hook needs to aim at (world px, identity camera) */
export const FC = {
  /** visual centre of the laptop */
  centre: { x: 540, y: LAP.y + LAP.h / 2 },
  laptop: LAP,
  quad: screenQuad(LAP),
  /** the app window's centre on the glass */
  app: screenPoint(APP.x + APP.w / 2, APP.y + APP.h / 2),
  /** the '1 copy' pill: centre, rotation, font size */
  pill: { cx: 196, cy: 638, rot: -5, fs: 46, text: "1 copy" },
  /** the text beat's band above the laptop (BodyC hud draws "Here's the / problem." here on the spoken words) */
  textBand: { y0: 236, y1: 560 },
} as const;

// ------------------------------------------------------------------ ambient (0 at t <= 0, eases in over 20 frames)
export const amb = (t: number, amp: number, period: number, phase: number) => {
  if (t <= 0) return 0;
  const ramp = Math.min(1, t / 20);
  return amp * ramp * (Math.sin((t / period) * Math.PI * 2 + phase) - Math.sin(phase));
};

// ------------------------------------------------------------------ the laptop with content on its glass
export type LaptopProps = {
  /** body-local frame (drives only the sheen drift; rest at t <= 0) */
  t: number;
  box?: { x: number; y: number; w: number; h: number };
  /** screen background under the content (#000 = the photo's own black) */
  screenBg?: string;
  /** 0..1 how lit the screen is (1 = on; 0 = dark grey, dead) */
  power?: number;
  /** extra over the whole laptop (world px, inside the laptop's transform) */
  over?: React.ReactNode;
  /** content px drawn on the glass above the power veil (e.g. a crack in the glass) */
  glass?: React.ReactNode;
  /** content px, SCREEN.w x SCREEN.h */
  children?: React.ReactNode;
  shadow?: boolean;
};

/** the laptop cut-out (the kit's laptop.png, drawn fallback if missing) with `children` mapped onto its glass */
export const Laptop: React.FC<LaptopProps> = ({ t, box = LAP, screenBg = "#16171A", power = 1, over, glass, children, shadow = true }) => {
  const q = QUAD_F.map(([u, v]) => [u * box.w, v * box.h] as P2) as Quad;
  const m = quadMatrix3d(SCREEN.w, SCREEN.h, q);
  const sx = amb(t, 18, 150, 0);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h }}>
      <div style={{ position: "absolute", inset: 0, filter: shadow ? theme.shadow.cutout : undefined }}>
        {KIT_LAPTOP ? (
          <Img src={KIT_LAPTOP} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />
        ) : (
          <DrawnLaptop w={box.w} h={box.h} />
        )}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w, height: SCREEN.h, transformOrigin: "0 0", transform: m, background: screenBg, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: power, filter: power < 0.999 ? `grayscale(${(1 - power).toFixed(3)})` : undefined }}>{children}</div>
        {power < 0.999 ? <div style={{ position: "absolute", inset: 0, background: "#2A2B2E", opacity: (1 - power) * 0.85 }} /> : null}
        {glass}
        {/* glass: a soft diagonal sheen from the top-left light, an inner edge */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(118deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.04) ${(30 + sx * 0.2).toFixed(2)}%, rgba(255,255,255,0) ${(46 + sx * 0.2).toFixed(2)}%, rgba(255,255,255,0) 100%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(0,0,0,.55), inset 0 0 40px rgba(0,0,0,.35)" }} />
      </div>
      {over}
    </div>
  );
};

/** a plain drawn laptop with a black lid, used only if the kit's laptop.png is missing from the bundle */
const DrawnLaptop: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const q = QUAD_F.map(([u, v]) => [u * w, v * h]);
  const lid = `M${q[0][0] - 14} ${q[0][1] - 16} L${q[1][0] + 10} ${q[1][1] - 16} L${q[2][0] + 14} ${q[2][1] + 12} L${q[3][0] - 10} ${q[3][1] + 16} Z`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={`M${q[3][0] - 10} ${q[3][1] + 16} L${q[2][0] + 14} ${q[2][1] + 12} L${w * 0.99} ${h * 0.72} L${w * 0.27} ${h * 0.98} Z`} fill="#D6D7DA" />
      <path d={lid} fill="#26272B" />
      <path d={`M${q.map((p) => p.join(" ")).join(" L")} Z`} fill="#050506" />
    </svg>
  );
};

// ------------------------------------------------------------------ the glass content
/** a tiny file glyph (folded corner) in content px */
const FileGlyph: React.FC<{ x: number; y: number; s: number; dark?: boolean }> = ({ x, y, s, dark }) => (
  <svg width={s} height={s * 1.25} style={{ position: "absolute", left: x, top: y, overflow: "visible" }} viewBox="0 0 40 50">
    <path d="M3 3 H26 L37 14 V47 H3 Z" fill={dark ? "#1A1A1A" : "#F1F1F1"} stroke="#1A1A1A" strokeWidth={4} strokeLinejoin="round" />
    <path d="M26 3 V14 H37" fill="none" stroke="#1A1A1A" strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export type TreeCardProps = {
  /** row slot (0..4, fractional while moving) of each file in FILES order; default 0,1,2,3,4 */
  slots?: number[];
  /** 0..1 per file: a black highlight sweeping over a line that was just rewritten */
  hot?: number[];
  x?: number;
  y?: number;
};

/** the project's file tree card (content px): 'my-app' header, the five files in mono, one per row slot */
export const TreeCard: React.FC<TreeCardProps> = ({ slots, hot, x = TREE.x, y = TREE.y }) => {
  const rowH = 112;
  const top = 186;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: TREE.w, height: TREE.h, background: "#FFFFFF", borderRadius: TREE.r, boxShadow: "0 0 0 2px rgba(255,255,255,.4), inset 0 -6px 0 #E4E4E4, 20px 30px 50px rgba(0,0,0,.7)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 128, background: "#F2F2F2", borderBottom: "3px solid #E2E2E2" }} />
      <div style={{ position: "absolute", left: 186, top: 30, fontFamily: MONO, fontWeight: 700, fontSize: 60, color: theme.color.ink, letterSpacing: -1, whiteSpace: "nowrap" }}>my-app/</div>
      {FILES.map((name, i) => {
        const slot = slots ? slots[i] : i;
        const h = hot ? hot[i] : 0;
        const ty = top + slot * rowH;
        return (
          <div key={name} style={{ position: "absolute", left: 0, top: ty, width: TREE.w, height: rowH }}>
            {h > 0.001 ? <div style={{ position: "absolute", left: 168, top: 14, width: (TREE.w - 186) * h, height: rowH - 28, background: "#E6E6E6", borderRadius: 10 }} /> : null}
            <FileGlyph x={186} y={26} s={48} dark={h > 0.5} />
            <div style={{ position: "absolute", left: 254, top: 24, fontFamily: MONO, fontWeight: 600, fontSize: 58, letterSpacing: -1.5, color: theme.color.ink, whiteSpace: "nowrap" }}>{name}</div>
          </div>
        );
      })}
    </div>
  );
};

export type AppCardProps = {
  /** body-local frame (caret blink; steady at t <= 0) */
  t: number;
  /** 0..1 per row: how ticked (default all ticked) */
  ticks?: number[];
  x?: number;
  y?: number;
  /** extra content px over the window (e.g. a crack), positioned in window px */
  children?: React.ReactNode;
};

/** the to-do app window (content px): title bar, three ticked rows, an empty row with a caret */
export const AppCard: React.FC<AppCardProps> = ({ t, ticks, x = APP.x, y = APP.y, children }) => {
  // a soft caret blink (period 40 frames, eased, never a one-frame flip); fully on at t <= 0
  const caret = t <= 0 ? 1 : 0.5 + 0.5 * Math.cos((t / 40) * Math.PI * 2);
  const rowY = (i: number) => 196 + i * 136;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: APP.w, height: APP.h, background: "#FFFFFF", borderRadius: APP.r, boxShadow: "0 0 0 2px rgba(255,255,255,.6), inset 0 -8px 0 #E6E6E6, 30px 44px 60px rgba(0,0,0,.75), 8px 12px 14px rgba(0,0,0,.5)", overflow: "hidden" }}>
      {/* title bar */}
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 120, background: "#F4F4F4", borderBottom: "3px solid #E4E4E4" }} />
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", left: 44 + k * 52, top: 44, width: 32, height: 32, borderRadius: 16, background: "#CFCFCF" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 64, letterSpacing: -1.5, color: theme.color.ink }}>to-do</div>
      {ROWS.map((label, i) => {
        const k = ticks ? ticks[i] : 1;
        return (
          <div key={label} style={{ position: "absolute", left: 60, top: rowY(i), width: APP.w - 120, height: 112, borderBottom: "3px solid #EEEEEE" }}>
            <div style={{ position: "absolute", left: 0, top: 20, width: 72, height: 72, borderRadius: 36, border: `6px solid ${theme.color.ink}`, boxSizing: "border-box", background: k > 0.5 ? theme.color.ink : "#fff" }}>
              <svg width={72} height={72} viewBox="0 0 72 72" style={{ position: "absolute", left: -6, top: -6, opacity: Math.min(1, k * 1.5) }}>
                <path d="M21 37 L32 48 L52 26" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={60} strokeDashoffset={60 * (1 - k)} />
              </svg>
            </div>
            <div style={{ position: "absolute", left: 104, top: 18, fontFamily: INTER, fontWeight: 700, fontSize: 70, letterSpacing: -1.5, color: theme.color.ink, whiteSpace: "nowrap" }}>{label}</div>
          </div>
        );
      })}
      {/* the empty fourth row with a caret */}
      <div style={{ position: "absolute", left: 60, top: rowY(3), width: APP.w - 120, height: 112 }}>
        <div style={{ position: "absolute", left: 0, top: 20, width: 72, height: 72, borderRadius: 36, border: "6px solid #BDBDBD", boxSizing: "border-box" }} />
        <div style={{ position: "absolute", left: 106, top: 22, width: 8, height: 70, background: theme.color.ink, opacity: caret }} />
      </div>
      {children}
    </div>
  );
};

/** what the glass shows on frame 0: the file tree card behind, the app window in front (content px) */
export const AppScreen: React.FC<{ t: number; tree?: TreeCardProps; ticks?: number[]; appChildren?: React.ReactNode; children?: React.ReactNode }> = ({ t, tree, ticks, appChildren, children }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 20%, #2C2E34 0%, #1A1B1F 55%, #111215 100%)" }} />
    {/* a desktop menu bar, so the glass reads as a real screen with windows on it */}
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 44, background: "rgba(255,255,255,.14)" }} />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ position: "absolute", left: 40 + i * 120, top: 14, width: i === 0 ? 30 : 84, height: 16, borderRadius: 8, background: "rgba(255,255,255,.42)" }} />
    ))}
    <TreeCard {...tree} />
    <AppCard t={t} ticks={ticks}>
      {appChildren}
    </AppCard>
    {children}
  </>
);

// ------------------------------------------------------------------ the pill
/** a white pill with a thick ink rim (Inter 800), centred at (cx, cy), rotated `rot` deg; p 0..1 pops it (no overshoot) */
export const InkPill: React.FC<{ cx: number; cy: number; text: string; fs?: number; rot?: number; p?: number; scale?: number; opacity?: number; strike?: number }> = ({
  cx,
  cy,
  text,
  fs = FC.pill.fs,
  rot = 0,
  p = 1,
  scale = 1,
  opacity = 1,
  strike = 0,
}) => {
  if (p <= 0.001 || opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, willChange: "transform", transform: `translate(${cx.toFixed(3)}px,${cy.toFixed(3)}px) rotate(${rot.toFixed(3)}deg) scale(${(mix(0.6, 1, p) * scale).toFixed(4)})`, opacity: Math.min(1, p * 1.6) * opacity }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-50%,-50%)",
          background: "#FFFFFF",
          color: theme.color.ink,
          border: `${Math.round(fs * 0.09)}px solid ${theme.color.ink}`,
          borderRadius: 999,
          padding: `${Math.round(fs * 0.16)}px ${Math.round(fs * 0.52)}px ${Math.round(fs * 0.2)}px`,
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: fs,
          letterSpacing: -fs * 0.025,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          boxShadow: "2px 3px 0 #D4D4D4, 8px 14px 18px rgba(0,0,0,.18)",
        }}
      >
        {text}
        {strike > 0.001 ? (
          <div style={{ position: "absolute", left: "8%", top: "50%", width: `${(84 * strike).toFixed(2)}%`, height: Math.max(6, fs * 0.16), marginTop: -Math.max(3, fs * 0.08), background: theme.color.ink, borderRadius: 3 }} />
        ) : null}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ the first card
export type FirstCardProps = {
  /** body-local frame (0 = BodyC's frame 0); only ambient motion, which starts from rest */
  t: number;
  /** extra transform on the whole card, origin FC.centre (hook hand-offs) */
  tf?: string;
  opacity?: number;
  /** hide parts while a hook flies its objects into them (default all shown) */
  show?: { laptop?: boolean; screen?: boolean; pill?: boolean };
  /** extra world content drawn over the card */
  children?: React.ReactNode;
};

/** the first card's ambient offsets at body-local frame t (all 0 at t <= 0): laptop float, pill sway and bob */
export const cardAmbient = (t: number) => ({ bob: amb(t, 2, 96, 0.4), sway: amb(t, 0.7, 74, 1.3), pillBob: amb(t, 1.6, 66, 2.2) });

export const FirstCard: React.FC<FirstCardProps> = ({ t, tf = "", opacity = 1, show, children }) => {
  const { bob, sway, pillBob } = cardAmbient(t);
  const showLaptop = show?.laptop !== false;
  const showScreen = show?.screen !== false;
  const showPill = show?.pill !== false;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${FC.centre.x}px ${FC.centre.y}px`, transform: tf || undefined, opacity }}>
      {showLaptop ? (
        <div style={{ position: "absolute", inset: 0, transform: bob ? `translateY(${bob.toFixed(3)}px)` : undefined }}>
          <Laptop t={t}>{showScreen ? <AppScreen t={t} /> : null}</Laptop>
          {showPill ? <InkPill cx={FC.pill.cx} cy={FC.pill.cy + pillBob} rot={FC.pill.rot + sway} text={FC.pill.text} fs={FC.pill.fs} /> : null}
        </div>
      ) : showPill ? (
        <InkPill cx={FC.pill.cx} cy={FC.pill.cy + pillBob} rot={FC.pill.rot + sway} text={FC.pill.text} fs={FC.pill.fs} />
      ) : null}
      {children}
    </div>
  );
};
