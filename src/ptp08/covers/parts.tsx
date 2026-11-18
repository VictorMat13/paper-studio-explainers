// ===========================================================================
// ep08 cover parts (AGENT COVERS, 2026-11-07): the pieces the three Reel covers are built from. Everything is drawn at
// its final pixel size (no CSS scale-up), so the stills stay crisp under the 3D tilts. Same objects as the hooks: the
// charcoal GitHub slab (HA's look), the robot behind its laptop (HA's row), black chat bubbles (the kit's look), white
// paper cards (the kit's PaperCard), BA's shared WordChip and HC's solid icons (imported). One light from the top left,
// every shadow falls down-right. Reel px, 1080 x 1920.
// ===========================================================================
import React from "react";
import { Img, staticFile } from "remotion";
import { INTER, hasStatic, theme } from "../../paperstudio";

// ------------------------------------------------------------------ assets (own copies in public/ptp08/covers)
const own = (f: string): string | undefined => (hasStatic(`ptp08/covers/${f}`) ? staticFile(`ptp08/covers/${f}`) : undefined);
export const COVER_ASSET = {
  githubWhite: own("github-white.svg"),
  github: own("github.svg"),
  claude: own("claude.svg"),
  robot: own("robot.png"),
  laptop: own("laptop.png"),
  eraser: own("eraser.png"),
};
/** w / h of the cut-outs (ep06 / ep07 files, unchanged) */
export const ASPECT = { robot: 1134 / 1574, laptop: 1890 / 1506, eraser: 1823 / 1047 };

// ------------------------------------------------------------------ headline
const HALO = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((a) => `${(7 * Math.cos((a * Math.PI) / 180)).toFixed(1)}px ${(7 * Math.sin((a * Math.PI) / 180)).toFixed(1)}px 0 #F6F5F4`)
  .join(",");
export type HeadWord = { t: string; key?: boolean };

/**
 * The poster headline: Inter 800, black, centred, tight tracking; the one key word in bold italic with a thin black
 * bar under it. `top` = the first line box's top; each line box is `size * lead` tall.
 */
export const Headline: React.FC<{ lines: HeadWord[][]; size: number; top: number; lead?: number; bar?: boolean; lane?: boolean }> = ({
  lines,
  size,
  top,
  lead = 1.0,
  bar = true,
  lane = true,
}) => {
  const lh = size * lead;
  const h = lh * lines.length;
  return (
    <div style={{ position: "absolute", left: 0, top, width: 1080, height: h }}>
      {/* a faint paper lane so the grid lines never cut through the letters at thumbnail size */}
      {lane ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: -size * 0.25,
            bottom: -size * 0.3,
            background: "radial-gradient(ellipse 52% 50% at 50% 50%, rgba(255,255,255,.80) 0%, rgba(255,255,255,.55) 55%, rgba(255,255,255,0) 100%)",
          }}
        />
      ) : null}
      {lines.map((ln, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: i * lh,
            height: lh,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: size * 0.24,
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: -size * 0.035,
            color: theme.color.ink,
            whiteSpace: "nowrap",
            isolation: "isolate",
          }}
        >
          {ln.map((w, k) => (
            <span
              key={k}
              style={{
                position: "relative",
                display: "inline-block",
                fontStyle: w.key ? "italic" : "normal",
                paddingRight: w.key ? size * 0.04 : 0,
                // skip-ink: on a key word with descenders, a paper-coloured halo cuts the bar where a descender crosses it
                textShadow: w.key && bar && /[gjpqy]/.test(w.t) ? HALO : undefined,
              }}
            >
              {w.t}
              {w.key && bar ? (
                <span
                  style={{
                    position: "absolute",
                    left: -size * 0.02,
                    right: -size * 0.02,
                    bottom: -size * 0.13,
                    height: Math.max(8, Math.round(size * 0.075)),
                    borderRadius: 4,
                    background: theme.color.ink,
                    zIndex: -1,
                  }}
                />
              ) : null}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ chat bubble
/** a black chat bubble (white Inter 700) centred on cx, top at y, with the kit's tail at a bottom corner */
export const Bubble: React.FC<{ text: string; cx: number; y: number; fs?: number; tail?: "left" | "right" | "center"; rot?: number }> = ({ text, cx, y, fs = 46, tail = "left", rot = 0 }) => {
  const h = Math.round(fs * 2.05);
  const s = Math.round(fs * 0.95);
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: y,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        filter: "drop-shadow(8px 14px 14px rgba(0,0,0,.20)) drop-shadow(2px 4px 3px rgba(0,0,0,.12))",
      }}
    >
      <div
        style={{
          position: "relative",
          height: h,
          display: "inline-flex",
          alignItems: "center",
          padding: `0 ${Math.round(fs * 0.74)}px`,
          background: theme.color.ink,
          color: "#fff",
          borderRadius: Math.round(h * 0.42),
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: fs,
          letterSpacing: -0.5,
          whiteSpace: "nowrap",
        }}
      >
        {tail === "center" ? (
          <svg width={s} height={s * 0.6} viewBox="0 0 40 24" style={{ position: "absolute", bottom: -s * 0.5, left: "50%", marginLeft: -s / 2 }} aria-hidden>
            <path d="M2 0 L38 0 C 30 6, 24 14, 21.5 22 C 20.8 24, 19.2 24, 18.5 22 C 16 14, 10 6, 2 0 Z" fill={theme.color.ink} />
          </svg>
        ) : (
          <svg
            width={s}
            height={s}
            viewBox="0 0 40 40"
            style={{ position: "absolute", bottom: -s * 0.42, [tail]: -s * 0.3, transform: tail === "right" ? "scaleX(-1)" : undefined }}
            aria-hidden
          >
            <path d="M40 0 C 34 18, 22 30, 0 36 C 18 36, 32 30, 40 22 Z" fill={theme.color.ink} />
          </svg>
        )}
        <span style={{ position: "relative" }}>{text}</span>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ the GitHub slab (HA's look, drawn at size)
/**
 * The heavy charcoal GitHub slab at its final size (w x 1.11w): charcoal face with a matte top-left sheen, a thick
 * lower body for thickness, GitHub's official white Invertocat (uniform scale, flat, no effect on the mark) and the
 * lowercase "github" label. Top-left corner at (0, 0); `tilt` = the 3D lean applied to the whole slab.
 */
export const Slab: React.FC<{ w: number; x: number; y: number; tf?: string }> = ({ w, x, y, tf = "" }) => {
  const h = w * 1.11;
  const R = 0.16 * w;
  const EDGE = 0.06 * w;
  const mark = 0.5 * w;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: tf, transformOrigin: "50% 60%", transformStyle: "preserve-3d" }}>
      {/* thickness (the slab's lower body) and the cast shadow down-right */}
      <div
        style={{
          position: "absolute",
          left: EDGE * 0.35,
          top: EDGE,
          width: w,
          height: h,
          borderRadius: R,
          background: "linear-gradient(180deg,#141415 0%,#060607 100%)",
          boxShadow: `${0.03 * w}px ${0.05 * w}px ${0.07 * w}px rgba(0,0,0,.26),${0.09 * w}px ${0.14 * w}px ${0.2 * w}px rgba(0,0,0,.17)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: R,
          background: "linear-gradient(158deg,#3d3d40 0%,#27272a 42%,#1a1a1c 100%)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,.20),inset 2px 0 0 rgba(255,255,255,.07),inset 0 -3px 0 rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.11) 0%,rgba(255,255,255,0) 44%)" }} />
        {/* a soft matte light band across the upper face */}
        <div
          style={{
            position: "absolute",
            top: -h * 0.2,
            height: h * 1.4,
            left: w * 0.62,
            width: w * 0.3,
            transform: "rotate(18deg)",
            background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.06) 50%,rgba(255,255,255,0) 100%)",
          }}
        />
        {COVER_ASSET.githubWhite ? (
          <Img src={COVER_ASSET.githubWhite} style={{ position: "absolute", left: (w - mark) / 2, top: h * 0.15, width: mark, height: mark * (96 / 98), objectFit: "contain" }} />
        ) : (
          <div style={{ position: "absolute", left: (w - mark) / 2, top: h * 0.15, width: mark, height: mark, borderRadius: "50%", background: "#fff" }} />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: w,
            top: h * 0.69,
            textAlign: "center",
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 0.2 * w,
            letterSpacing: -0.01 * w,
            lineHeight: 1,
            color: "#fff",
          }}
        >
          github
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ robot behind its laptop (HA's row, at size)
/** laptop.png screen corners (TL TR BR BL, fractions of the photo; ASSETS measurement) and the screen's centre */
const LAP_Q = [
  [28 / 1890, 186 / 1506],
  [1236 / 1890, 41 / 1506],
  [1365 / 1890, 792 / 1506],
  [162 / 1890, 1006 / 1506],
];
const LAP_SC = { x: LAP_Q.reduce((a, p) => a + p[0], 0) / 4, y: LAP_Q.reduce((a, p) => a + p[1], 0) / 4 };

/** the Claude logo button (the kit's LogoDisc look, drawn at size; centre cx, cy) */
export const ClaudeChip: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => {
  const rim = Math.round(r * 0.22);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: `0 0 0 1px rgba(0,0,0,.05),${Math.round(r * 0.22)}px ${Math.round(r * 0.32)}px ${Math.round(r * 0.6)}px rgba(0,0,0,.24),${Math.round(r * 0.06)}px ${Math.round(r * 0.08)}px ${Math.round(r * 0.12)}px rgba(0,0,0,.12),inset 0 2px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.05)`,
      }}
    >
      <div style={{ position: "absolute", inset: rim, borderRadius: "50%", background: "#fff", boxShadow: "inset 0 2px 4px rgba(0,0,0,.10),inset 0 -2px 2px rgba(255,255,255,.7)", overflow: "hidden" }}>
        {COVER_ASSET.claude ? (
          <Img src={COVER_ASSET.claude} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: Math.round(r * 0.2), boxSizing: "border-box", objectFit: "contain" }} />
        ) : null}
      </div>
    </div>
  );
};

/**
 * One robot standing behind its laptop: the laptop (lapW wide) sits with its bottom at `bottom`, centred near cx; the
 * robot (robotH tall) stands behind the lid so its head, waving arm and chest show above it (`show` of its height),
 * leaning `lean` degrees about the lid line; a Claude chip sits on the black screen.
 */
export const RobotAtLaptop: React.FC<{ cx: number; bottom: number; lapW: number; robotH: number; lean?: number; show?: number; chip?: boolean; lift?: number }> = ({
  cx,
  bottom,
  lapW,
  robotH,
  lean = 0,
  show = 0.64,
  chip = true,
  lift = 0,
}) => {
  const lapH = lapW / ASPECT.laptop;
  const robotW = robotH * ASPECT.robot;
  const lapX = cx - 0.45 * lapW;
  const lapY = bottom - lapH;
  const scr = { x: lapX + LAP_SC.x * lapW, y: lapY + LAP_SC.y * lapH };
  const rX = scr.x - robotW / 2;
  const rY = lapY - show * robotH - lift;
  const pivot = { x: scr.x - rX, y: lapY + 18 - rY };
  const clipH = lapY + 0.62 * lapH - rY;
  return (
    <>
      {/* the robot behind the lid, clipped at the lid's lower edge (margins keep its shadow whole) */}
      <div style={{ position: "absolute", left: rX - 90, top: rY - 160, width: robotW + 280, height: clipH + 160, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 90, top: 160, width: robotW, height: robotH, transformOrigin: `${pivot.x}px ${pivot.y}px`, transform: `rotate(${lean}deg)` }}>
          {COVER_ASSET.robot ? (
            <Img src={COVER_ASSET.robot} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: theme.shadow.cutout }} />
          ) : null}
        </div>
      </div>
      {/* the laptop in front */}
      <div style={{ position: "absolute", left: lapX, top: lapY, width: lapW, height: lapH }}>
        {COVER_ASSET.laptop ? <Img src={COVER_ASSET.laptop} style={{ width: "100%", height: "100%", objectFit: "contain", filter: theme.shadow.cutout }} /> : null}
      </div>
      {chip ? <ClaudeChip cx={scr.x} cy={scr.y - 4} r={Math.round(lapW * 0.15)} /> : null}
    </>
  );
};

/** where a RobotAtLaptop's head top is (for aiming a bubble's tail) */
export const robotHead = (cx: number, bottom: number, lapW: number, robotH: number, show = 0.64) => {
  const lapH = lapW / ASPECT.laptop;
  const lapX = cx - 0.45 * lapW;
  const lapY = bottom - lapH;
  return { x: lapX + LAP_SC.x * lapW, y: lapY - show * robotH };
};

// ------------------------------------------------------------------ crumbs (rubber bits and grey paper flakes)
const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export type CrumbField = { x: number; y: number; w: number; h: number; n: number; seed: number; minS?: number; maxS?: number; pink?: number };

/** a scatter of small rolled rubber crumbs (grey and faint pink) and paper flakes, each with its own little shadow */
export const Crumbs: React.FC<{ fields: CrumbField[] }> = ({ fields }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {fields.map((fd, fi) => {
      const r = seeded(fd.seed);
      return Array.from({ length: fd.n }, (_, i) => {
        const x = fd.x + r() * fd.w;
        const y = fd.y + r() * fd.h;
        const s = (fd.minS ?? 5) + r() * ((fd.maxS ?? 14) - (fd.minS ?? 5));
        const rot = r() * 180;
        const kind = r();
        const pink = r() < (fd.pink ?? 0.35);
        const fill = pink ? "#E9C9CF" : kind < 0.5 ? "#C9C6C3" : "#B9B6B3";
        const shade = pink ? "#D2A9B2" : "#A3A09D";
        const len = s * (1.3 + r() * 1.4);
        return (
          <g key={`${fi}-${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
            <ellipse cx={s * 0.22} cy={s * 0.34} rx={len / 2} ry={s / 2} fill="rgba(0,0,0,.18)" style={{ filter: "blur(1.6px)" }} />
            <ellipse cx={0} cy={0} rx={len / 2} ry={s / 2} fill={fill} />
            <ellipse cx={len * 0.08} cy={s * 0.14} rx={len * 0.42} ry={s * 0.3} fill={shade} opacity={0.55} />
            <ellipse cx={-len * 0.14} cy={-s * 0.16} rx={len * 0.22} ry={s * 0.14} fill="#fff" opacity={0.55} />
          </g>
        );
      });
    })}
  </svg>
);
