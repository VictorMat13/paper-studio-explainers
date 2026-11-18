// BodyB local objects (the kit lacks them): logo buttons with our official SVGs, the GitHub slab, single kit commit
// cards, the snapshot card, the to-do app face, tick / clock / person chips, the magnifier, the paper tag fallback,
// the ring marker, the laptop. Pure components, world px, one light top left (shadows down-right), no line art.
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { CommitStrip, INTER, LogoDisc, MONO, hasStatic, mix, mixColor, prog, theme, type Commit } from "../../../paperstudio";
import { EIO, PaperFace } from "./paper";

const P = "ptp08/BodyB/";
const url = (f: string) => (hasStatic(P + f) ? staticFile(P + f) : undefined);

export const A = {
  robot: () => url("robot.png") ?? (hasStatic("paperstudio/photos/robot.png") ? staticFile("paperstudio/photos/robot.png") : undefined),
  laptop: () => url("laptop.png") ?? (hasStatic("paperstudio/photos/laptop.png") ? staticFile("paperstudio/photos/laptop.png") : undefined),
  scissors: () => url("scissors.png") ?? (hasStatic("paperstudio/photos/scissors.png") ? staticFile("paperstudio/photos/scissors.png") : undefined),
  tag: () => url("paper-tag.png"),
} as const;
export const LOGOS = {
  claude: () => url("claude.svg") ?? (hasStatic("paperstudio/logos/claude.svg") ? staticFile("paperstudio/logos/claude.svg") : undefined),
  git: () => url("git.svg"),
  github: () => url("github.svg"),
  githubWhite: () => url("github-white.svg"),
} as const;
export type LogoKey = "claude" | "git" | "github";
export const ROBOT_ASPECT = 1134 / 1574;
export const LAPTOP_ASPECT = 1890 / 1506;

/** a logo button (the kit LogoDisc look) centred at (cx, cy); p = presence 0..1 (pop), s = extra scale */
export const Logo: React.FC<{ k: LogoKey; cx: number; cy: number; r?: number; p?: number; s?: number; grey?: boolean; label?: string }> = ({ k, cx, cy, r = 44, p = 1, s = 1, grey, label }) => {
  if (p <= 0.001) return null;
  const sc = mix(0.6, 1, p) * s;
  return (
    <>
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, transform: `scale(${sc.toFixed(4)})`, opacity: Math.min(1, p * 2) }}>
        <LogoDisc name={k === "claude" ? "Claude" : k === "git" ? "Git" : "GitHub"} src={LOGOS[k]()} r={r} grey={grey} />
      </div>
      {label ? (
        <div style={{ position: "absolute", left: cx - 140, width: 280, top: cy + r + 14, textAlign: "center", fontFamily: INTER, fontSize: 38, color: theme.color.label, opacity: Math.min(1, p * 2) }}>{label}</div>
      ) : null}
    </>
  );
};

/** a plain white button (the LogoDisc body) holding any drawing, centred at (cx, cy) */
export const Btn: React.FC<{ cx: number; cy: number; r: number; p?: number; s?: number; dark?: boolean; children?: React.ReactNode; rot?: number }> = ({ cx, cy, r, p = 1, s = 1, dark, children, rot = 0 }) => {
  if (p <= 0.001) return null;
  const rim = Math.round(r * 0.22);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        transform: `rotate(${rot.toFixed(2)}deg) scale(${(mix(0.6, 1, p) * s).toFixed(4)})`,
        opacity: Math.min(1, p * 2),
        borderRadius: "50%",
        background: "#fff",
        boxShadow: `0 0 0 1px rgba(0,0,0,.05),${Math.round(r * 0.22)}px ${Math.round(r * 0.32)}px ${Math.round(r * 0.6)}px rgba(0,0,0,.20),${Math.round(r * 0.06)}px ${Math.round(r * 0.08)}px ${Math.round(r * 0.12)}px rgba(0,0,0,.10),inset 0 2px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.05)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: rim,
          borderRadius: "50%",
          background: dark ? "#141414" : "#fff",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,.10),inset 0 -2px 2px rgba(255,255,255,.7)",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {children}
        </svg>
      </div>
    </div>
  );
};

/** the tick drawing (for Btn) */
export const TickGlyph: React.FC<{ color?: string; p?: number }> = ({ color = theme.color.ink, p = 1 }) => (
  <path d="M24 53 L42 70 L77 32" fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, Math.min(1, p))} />
);
/** a person icon (solid, for Btn) */
export const PersonGlyph: React.FC = () => (
  <g fill={theme.color.ink}>
    <circle cx={50} cy={36} r={15} />
    <path d="M22 80 C22 60 34 54 50 54 C66 54 78 60 78 80 Z" />
  </g>
);
/** a clock face (for Btn); `a` = minute hand angle in degrees (0 = 12 o'clock) */
export const ClockGlyph: React.FC<{ a: number; h?: number }> = ({ a, h = 300 }) => (
  <g>
    {Array.from({ length: 12 }, (_, i) => {
      const t = (i / 12) * Math.PI * 2;
      const r0 = i % 3 === 0 ? 30 : 34;
      return <line key={i} x1={50 + Math.sin(t) * r0} y1={50 - Math.cos(t) * r0} x2={50 + Math.sin(t) * 40} y2={50 - Math.cos(t) * 40} stroke="#111" strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round" />;
    })}
    <line x1={50} y1={50} x2={50 + Math.sin((h * Math.PI) / 180) * 18} y2={50 - Math.cos((h * Math.PI) / 180) * 18} stroke="#111" strokeWidth={7} strokeLinecap="round" />
    <line x1={50} y1={50} x2={50 + Math.sin((a * Math.PI) / 180) * 28} y2={50 - Math.cos((a * Math.PI) / 180) * 28} stroke="#111" strokeWidth={5} strokeLinecap="round" />
    <circle cx={50} cy={50} r={5} fill="#111" />
  </g>
);

/** the charcoal GitHub slab: thick bottom edge, white Invertocat, 'github' label under it. (cx, cy) = the slab face centre */
export const GitHubSlab: React.FC<{ cx: number; cy: number; w?: number; p?: number; s?: number; label?: boolean; squash?: number }> = ({ cx, cy, w = 240, p = 1, s = 1, label = true, squash = 0 }) => {
  if (p <= 0.001) return null;
  const h = Math.round(w * 0.86);
  const edge = Math.round(w * 0.08);
  const logo = LOGOS.githubWhite();
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h + edge, transform: `scale(${(mix(0.6, 1, p) * s * (1 + 0.06 * squash)).toFixed(4)},${(mix(0.6, 1, p) * s * (1 - 0.08 * squash)).toFixed(4)})`, transformOrigin: `${w / 2}px ${h + edge}px`, opacity: Math.min(1, p * 2) }}>
      <div style={{ position: "absolute", left: 0, top: edge, width: w, height: h, borderRadius: w * 0.17, background: "#0B0B0C", boxShadow: "16px 24px 30px rgba(0,0,0,.26),40px 60px 80px rgba(0,0,0,.14)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          borderRadius: w * 0.17,
          background: "linear-gradient(150deg,#3A3A3F 0%,#26262A 45%,#1C1C1F 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,.16),inset 0 -2px 3px rgba(0,0,0,.4)",
        }}
      >
        {logo ? (
          <Img src={logo} style={{ position: "absolute", left: w * 0.25, top: h * 0.2, width: w * 0.5, height: h * 0.6, objectFit: "contain" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: w * 0.3 }}>GH</div>
        )}
      </div>
      {label ? (
        <div style={{ position: "absolute", left: -60, width: w + 120, top: h + edge + 12, textAlign: "center", fontFamily: INTER, fontSize: 42, fontWeight: 500, color: theme.color.label }}>github</div>
      ) : null}
    </div>
  );
};

/** one kit commit card (the CommitStrip look) centred at (cx, cy); `at` = rise-in frame (undefined = there) */
export const CommitCard: React.FC<{ c: Commit; cx: number; cy: number; w?: number; h?: number; at?: number; tf?: string; opacity?: number; grey?: number }> = ({
  c,
  cx,
  cy,
  w = 380,
  h = 142,
  at,
  tf,
  opacity = 1,
  grey = 0,
}) => {
  // the kit strip culls cards right of x 1300, so the card is drawn at a local x and the wrapper is moved to cx.
  // SMOOTHNESS: the entrance is ours (14 frames, in-out: rises 50 px, scale 0.94 -> 1, fades up), not the kit's 10.
  const f = useCurrentFrame();
  const e = at === undefined ? 1 : prog(f, at, at + 14, EIO);
  if (e <= 0.001 || opacity <= 0.001) return null;
  const enterTf = e < 1 ? `translateY(${(50 * (1 - e)).toFixed(3)}px) scale(${mix(0.94, 1, e).toFixed(5)}) ` : "";
  const PADX = 200;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2 - PADX,
        top: 0,
        width: w + 2 * PADX,
        height: 1920,
        opacity: opacity * e,
        transform: `${enterTf}${tf ?? ""}` || undefined,
        transformOrigin: `${PADX + w / 2}px ${cy}px`,
        filter: grey > 0.01 ? `grayscale(1) opacity(${(1 - 0.45 * grey).toFixed(3)})` : undefined,
      }}
    >
      <CommitStrip y={cy} commits={[c]} cardW={w} cardH={h} speed={0} x0={PADX} at={-1000} />
    </div>
  );
};

export const FILES = ["index.html", "package.json", "src/App.jsx", "src/List.jsx", "styles.css"] as const;

/** a small solid file glyph (paper sheet with a folded corner) */
const FileGlyph: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s * 0.78} height={s} viewBox="0 0 78 100" style={{ display: "block", flex: "none" }}>
    <path d="M6 4 H52 L74 26 V94 Q74 97 71 97 H9 Q6 97 6 94 Z" fill="#2B2B2E" />
    <path d="M52 4 V26 H74" fill="#6A6A70" />
  </svg>
);

/** the file tree lines (mono): `shown` lines visible (fractional = the next one easing in) */
export const FileTree: React.FC<{ x: number; y: number; fs?: number; lineH?: number; shown?: number; files?: readonly string[]; ticks?: number; color?: string }> = ({
  x,
  y,
  fs = 38,
  lineH = 56,
  shown = 5,
  files = FILES,
  ticks = 0,
  color = theme.color.ink,
}) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    {files.map((name, i) => {
      const p = Math.max(0, Math.min(1, shown - i));
      if (p <= 0) return null;
      const tk = Math.max(0, Math.min(1, ticks - i));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: i * lineH,
            height: lineH,
            display: "flex",
            alignItems: "center",
            gap: fs * 0.45,
            fontFamily: MONO,
            fontSize: fs,
            fontWeight: 500,
            color,
            whiteSpace: "nowrap",
            opacity: p,
            transform: `translateY(${((1 - p) * 8).toFixed(2)}px)`,
            letterSpacing: -0.5,
          }}
        >
          <FileGlyph s={fs * 0.9} />
          {name}
          {tk > 0 ? (
            <svg width={fs * 0.8} height={fs * 0.8} viewBox="0 0 100 100" style={{ marginLeft: fs * 0.2 }}>
              <TickGlyph p={tk} />
            </svg>
          ) : null}
        </div>
      );
    })}
  </div>
);

/** the snapshot card: the kit commit card look grown up: avatar dot, hash and message, a rule, the file tree, a note line */
export const SnapshotCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  hash: string;
  msg: string;
  /** file lines shown (0..5, fractional eases the next in) */
  shown?: number;
  /** 0..1 the note line */
  note?: number;
  /** 0..1 inner content (header) opacity, for the grow from the small card */
  inner?: number;
  opacity?: number;
  /** content scale (type and spacing) */
  k?: number;
  /** ticks after the file lines (0..5) */
  ticks?: number;
}> = ({ x, y, w, h, hash, msg, shown = 5, note = 1, inner = 1, opacity = 1, k = 1, ticks = 0 }) => {
  if (opacity <= 0.001) return null;
  const pad = 34 * k;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity }}>
      <div style={{ position: "absolute", left: 14, top: 10, width: w, height: h - 8, background: theme.color.sheet, borderRadius: 12, boxShadow: theme.shadow.sheet }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.color.paper,
          borderRadius: 12,
          boxShadow: "3px 3px 0 #DCDCDC,5px 5px 0 #CFCFCF,18px 28px 50px rgba(0,0,0,.18),48px 70px 120px rgba(0,0,0,.10)",
          overflow: "hidden",
        }}
      >
        <PaperFace radius={12} />
        <div style={{ position: "absolute", left: pad, top: 28 * k, right: pad, height: 76 * k, display: "flex", alignItems: "center", gap: 22 * k, opacity: inner }}>
          <div
            style={{
              width: 58 * k,
              height: 58 * k,
              borderRadius: "50%",
              flex: "none",
              background: "radial-gradient(circle at 35% 30%, #9A9A9A 0%, #6E6E6E 55%, #4E4E4E 100%)",
              boxShadow: "inset 0 -2px 3px rgba(0,0,0,.15),2px 3px 4px rgba(0,0,0,.12)",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 38 * k, color: theme.color.ink, lineHeight: 1.1 }}>{hash}</div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 40 * k, color: "#333", lineHeight: 1.15, whiteSpace: "nowrap" }}>{msg}</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: pad, right: pad, top: 128 * k, height: 3, background: "#E6E6E6", opacity: inner }} />
        <FileTree x={pad} y={146 * k} shown={shown} ticks={ticks} fs={38 * k} lineH={56 * k} />
        {note > 0.001 ? (
          <div style={{ position: "absolute", left: pad, right: pad, bottom: 30 * k, height: 70 * k, opacity: Math.min(1, note * 1.5) }}>
            <div style={{ position: "absolute", inset: 0, background: theme.color.ink, borderRadius: 8, transform: `scaleX(${note.toFixed(4)})`, transformOrigin: "left center" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                paddingLeft: 24 * k,
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 38 * k,
                color: "#fff",
                whiteSpace: "nowrap",
                clipPath: `inset(-10px ${((1 - note) * 100).toFixed(2)}% -10px -10px)`,
              }}
            >
              note: {msg}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/**
 * The to-do app, drawn as a full 1080 x 1920 phone screen for the kit DeviceFrame (no brand, no colour): a title,
 * three rows with check boxes. `ticks` rows checked (fractional = the next tick drawing), `dark` 0..1 the app in dark
 * mode (the risky idea), `grey` 0..1 faded.
 */
export const TodoApp: React.FC<{ ticks?: number; dark?: number; title?: string }> = ({ ticks = 3, dark = 0, title = "To-do" }) => {
  const bg = mixColor("#FFFFFF", "#17171A", dark);
  const ink = mixColor("#111111", "#F2F2F2", dark);
  const rowBg = mixColor("#F4F4F4", "#26262A", dark);
  const rows = ["Buy milk", "Call Sam", "Fix the bike"];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: bg, fontFamily: INTER }}>
      <div style={{ position: "absolute", left: 90, top: 250, fontSize: 150, fontWeight: 800, color: ink, letterSpacing: -5 }}>{title}</div>
      {rows.map((r, i) => {
        const tk = Math.max(0, Math.min(1, ticks - i));
        return (
          <div key={i} style={{ position: "absolute", left: 70, top: 560 + i * 330, width: 940, height: 270, borderRadius: 50, background: rowBg }}>
            <div
              style={{
                position: "absolute",
                left: 60,
                top: 70,
                width: 130,
                height: 130,
                borderRadius: 34,
                boxSizing: "border-box",
                border: `14px solid ${ink}`,
                background: tk > 0.5 ? ink : "transparent",
              }}
            >
              <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: -14, width: 130, height: 130 }}>
                <TickGlyph color={bg} p={tk} />
              </svg>
            </div>
            <div style={{ position: "absolute", left: 250, top: 0, height: 270, display: "flex", alignItems: "center", fontSize: 110, fontWeight: 700, color: ink, letterSpacing: -2 }}>{r}</div>
          </div>
        );
      })}
    </div>
  );
};

/** the hollow ring marker (where you are on the timeline) */
export const RingMarker: React.FC<{ cx: number; cy: number; r?: number; p?: number }> = ({ cx, cy, r = 32, p = 1 }) => {
  if (p <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: theme.shadow.wire, opacity: Math.min(1, p * 2) }}>
      <circle cx={cx} cy={cy} r={r * mix(1.6, 1, p)} fill="none" stroke={theme.color.ink} strokeWidth={9} />
    </svg>
  );
};

/** a solid magnifier (charcoal rim and handle with thickness, pale glass), lens centre (cx, cy) */
export const Magnifier: React.FC<{ cx: number; cy: number; r?: number; rot?: number; opacity?: number }> = ({ cx, cy, r = 92, rot = 40, opacity = 1 }) => {
  if (opacity <= 0.001) return null;
  const L = r * 1.9;
  return (
    <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, opacity, filter: theme.shadow.object }}>
      <div style={{ position: "absolute", left: r - 18, top: r + r * 0.86, width: 36, height: L, borderRadius: 18, background: "linear-gradient(90deg,#3A3A3E,#151517 60%,#0A0A0B)", transformOrigin: `18px ${-r * 0.86}px`, transform: `rotate(${-rot}deg)` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${Math.round(r * 0.2)}px solid #1E1E21`, boxSizing: "border-box", background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,.55) 0%, rgba(235,238,240,.28) 45%, rgba(210,214,218,.22) 100%)", boxShadow: "inset 0 3px 2px rgba(255,255,255,.35),inset -4px -6px 8px rgba(0,0,0,.25)" }} />
    </div>
  );
};

/** paper-tag.png (617 x 1938): hang point (top of the twine), the blank face centre and width, in image px */
export const TAG_IMG = { w: 617, h: 1938, hang: { x: 313, y: 0 }, face: { cx: 310, cy: 1400, w: 540 } } as const;

/**
 * The paper tag reading `text`, hanging from (x, y) (the twine's top), rotated by `rot` about that point. Uses the
 * ASSETS cut-out paper-tag.png (kraft tag on twine) with the skill's cut-out shadow; a drawn kraft tag stands in when
 * the file is missing. `w` = the tag image width (the body is about w wide, the twine about 1.25 w long).
 */
export const PaperTag: React.FC<{ x: number; y: number; text: string; w?: number; rot?: number; textP?: number; opacity?: number }> = ({ x, y, text, w = 190, rot = 0, textP = 1, opacity = 1 }) => {
  if (opacity <= 0.001) return null;
  const src = A.tag();
  const k = w / TAG_IMG.w;
  const h = TAG_IMG.h * k;
  const fcx = (TAG_IMG.face.cx - TAG_IMG.hang.x) * k;
  const fcy = TAG_IMG.face.cy * k;
  const fs = TAG_IMG.face.w * k * 0.62;
  const label = (
    <div
      style={{
        position: "absolute",
        left: fcx - 200,
        top: fcy - fs * 0.62,
        width: 400,
        height: fs * 1.24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: fs,
        letterSpacing: -fs * 0.04,
        color: theme.color.ink,
        transform: `skewY(-2deg) translateY(${((1 - textP) * 8).toFixed(2)}px)`,
        opacity: textP,
        filter: textP < 0.99 ? `blur(${(5 * (1 - textP)).toFixed(2)}px)` : undefined,
      }}
    >
      {text}
    </div>
  );
  if (src) {
    return (
      <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transform: `rotate(${rot.toFixed(2)}deg)`, opacity }}>
        <div style={{ position: "absolute", left: -TAG_IMG.hang.x * k, top: 0, width: w, height: h, filter: theme.shadow.cutout }}>
          <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
        {label}
      </div>
    );
  }
  // drawn fallback: kraft card with a punched hole and a string
  const string = 773 * k;
  const bw = w * 0.98;
  const bh = 1118 * k;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transform: `rotate(${rot.toFixed(2)}deg)`, opacity }}>
      <svg width={30} height={string + 40} style={{ position: "absolute", left: -15, top: 0, overflow: "visible" }}>
        <path d={`M15 0 C 5 ${string * 0.4}, 25 ${string * 0.6}, 15 ${string + 30}`} stroke="#9C8A6E" strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: -bw / 2, top: string, width: bw, height: bh, borderRadius: w * 0.08, background: "linear-gradient(150deg,#D9B98A,#C49C68)", boxShadow: "3px 3px 0 #A9875A,14px 22px 26px rgba(0,0,0,.22)" }}>
        <div style={{ position: "absolute", left: bw / 2 - 16, top: bh * 0.11, width: 32, height: 32, borderRadius: 16, background: "#F4F3F2", boxShadow: "0 0 0 10px #E3CBA2" }} />
      </div>
      {label}
    </div>
  );
};

/** the robot cut-out (feet at (cx, bottom)), with the cut-out shadow stack */
export const Robot: React.FC<{ cx: number; bottom: number; h: number; rot?: number; opacity?: number; dy?: number }> = ({ cx, bottom, h, rot = 0, opacity = 1, dy = 0 }) => {
  const src = A.robot();
  if (opacity <= 0.001) return null;
  const w = h * ROBOT_ASPECT;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: bottom - h + dy, width: w, height: h, transform: `rotate(${rot.toFixed(2)}deg)`, transformOrigin: "50% 95%", opacity, filter: theme.shadow.cutout }}>
      {src ? <Img src={src} style={{ width: "100%", height: "100%", display: "block" }} /> : <div style={{ position: "absolute", inset: "10% 15%", borderRadius: "40%", background: "#fff", border: "6px solid #222" }} />}
    </div>
  );
};
