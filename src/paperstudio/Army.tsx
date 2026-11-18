import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, mix, prog, theme } from "./theme";
import { Exit, enterState, drift as driftAt } from "./motion";
import { PHOTO05, ROBOT_ASPECT, reveal } from "./kit05";
import { RimImage } from "./Hero";

// ------------------------------------------------------------- ChatBubble
export type ChatBubbleProps = {
  text: string;
  /** final top-left of the bubble */
  x: number;
  y: number;
  /** source point it pops out of (e.g. the brand burst's centre) */
  ox: number;
  oy: number;
  /** frame it starts popping out */
  at: number;
  dur?: number;
  /** sideways lift of the arc, px (default 70; negative bends the other way) */
  arc?: number;
  /** tail corner (default left: bottom-left, like a received message) */
  tail?: "left" | "right";
  /** font size (default 40) */
  fs?: number;
  /** extra vertical offset (ChatStack pushes older bubbles up with it) */
  dy?: number;
  exit?: Exit;
  opacity?: number;
};

export const bubbleHeight = (fs = 40) => Math.round(fs * 1.2 + fs * 0.62 * 2);

/** Tail shape: a soft hook from the bubble's bottom corner. */
const Tail: React.FC<{ side: "left" | "right"; s: number }> = ({ side, s }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 40 40"
    style={{ position: "absolute", bottom: -s * 0.42, [side]: -s * 0.38, transform: side === "right" ? "scaleX(-1)" : undefined }}
    aria-hidden
  >
    <path d="M40 0 C 34 18, 22 30, 0 36 C 18 36, 32 30, 40 22 Z" fill={theme.color.ink} />
  </svg>
);

/**
 * A black rounded chat bubble with white text and a tail, popping out of a source point along a short arc
 * (scale 0.2 to 1 from its tail corner, quick fade), then holding with a tiny drift.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, x, y, ox, oy, at, dur = 12, arc = 70, tail = "left", fs = 40, dy = 0, exit, opacity = 1 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur, EASE.enter);
  if (p <= 0) return null;
  const ex = enterState(f, undefined, exit);
  const h = bubbleHeight(fs);
  // the tail corner travels from the source point to its rest point on an arc
  // travel is measured from the bubble's bottom-left corner (the scale origin for a left tail)
  const sx = ox - x;
  const sy = oy - (y + h);
  const lift = arc * Math.sin(Math.PI * p);
  const cx = mix(sx, 0, p) - lift * 0.35;
  const cy = mix(sy, 0, p) - lift;
  const d = driftAt(f, 2, 80, at);
  const s = mix(0.2, 1, p);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + dy,
        transform: `translate(${(cx + d.x + ex.dx).toFixed(2)}px,${(cy + d.y + ex.dy).toFixed(2)}px) scale(${(s * ex.s).toFixed(4)})`,
        transformOrigin: tail === "left" ? "0% 100%" : "100% 100%",
        opacity: Math.min(1, p * 2.2) * ex.o * opacity,
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
          borderRadius: Math.round(h * 0.42),
          fontFamily: INTER,
          fontWeight: 700,
          fontSize: fs,
          letterSpacing: -0.5,
          whiteSpace: "nowrap",
        }}
      >
        <Tail side={tail} s={Math.round(fs * 0.9)} />
        <span style={{ position: "relative" }}>{text}</span>
      </div>
    </div>
  );
};

export type ChatStackProps = {
  /** where the newest bubble rests (top-left), older bubbles stack upward */
  x: number;
  y: number;
  ox: number;
  oy: number;
  bubbles: { text: string; at: number; tail?: "left" | "right"; dx?: number }[];
  gap?: number;
  fs?: number;
  arc?: number;
  exit?: Exit;
};

/** Bubbles popping out of one source point; each new bubble lands at (x, y) and pushes the older ones up. */
export const ChatStack: React.FC<ChatStackProps> = ({ x, y, ox, oy, bubbles, gap = 26, fs = 40, arc = 70, exit }) => {
  const f = useCurrentFrame();
  const h = bubbleHeight(fs) + gap;
  return (
    <>
      {bubbles.map((b, i) => {
        const up = bubbles.slice(i + 1).reduce((a, nb) => a + h * prog(f, nb.at - 1, nb.at + 8, EASE.cam), 0);
        return <ChatBubble key={i} text={b.text} x={x + (b.dx ?? 0)} y={y} dy={-up} ox={ox} oy={oy} at={b.at} tail={b.tail} fs={fs} arc={arc} exit={exit} />;
      })}
    </>
  );
};

// ------------------------------------------------------------- SpriteGrid
const seeded = (seed: number) => {
  let r = seed;
  return () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
};

export type SpriteGridProps = {
  /** sprite image (default the Paper Studio robot) */
  src?: string;
  /** sprite width / height (default the robot's) */
  aspect?: number;
  cols: number;
  rows: number;
  /** the grid's box */
  x: number;
  y: number;
  w: number;
  h: number;
  /** sprite height as a fraction of the cell height (default 0.86) */
  size?: number;
  /** how many sprites (default cols x rows) */
  count?: number;
  /** explicit pop frame per sprite (in pop order); else `at` + i * `rate` */
  starts?: number[];
  at?: number;
  rate?: number;
  /** pop order: row by row (default) or seeded shuffle */
  order?: "row" | "shuffle";
  seed?: number;
  /** pop-order indices that pop bigger then settle */
  big?: number[];
  bigScale?: number;
  /** a counter label that counts the sprites (optionally mapped to `to`, e.g. 16 sprites count to 71) */
  counter?: { x: number; y: number; to?: number; suffix?: string; size?: number; align?: "left" | "center" | "right"; w?: number };
  rim?: number;
  exit?: Exit;
};

/**
 * The army fill: one sprite per beat into an n x m grid (row by row or shuffled), each popping in with no
 * overshoot; the `big` ones pop to bigScale and ease back down. Every sprite floats with its own small shadow and
 * a gentle seeded bob. Optional counter label.
 */
export const SpriteGrid: React.FC<SpriteGridProps> = ({
  src = PHOTO05.robot,
  aspect = ROBOT_ASPECT,
  cols,
  rows,
  x,
  y,
  w,
  h,
  size = 0.86,
  count,
  starts,
  at = 0,
  rate = 2,
  order = "row",
  seed = 11,
  big = [],
  bigScale = 1.38,
  counter,
  rim = 0,
  exit,
}) => {
  const f = useCurrentFrame();
  const n = Math.min(count ?? cols * rows, cols * rows);
  const cellW = w / cols;
  const cellH = h / rows;
  const sh = Math.min(cellH * size, (cellW * size) / aspect);
  const sw = sh * aspect;
  const slots = React.useMemo(() => {
    const idx = Array.from({ length: n }, (_, i) => i);
    if (order === "shuffle") {
      const r = seeded(seed);
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
    }
    return idx;
  }, [n, order, seed]);
  const startOf = (k: number) => (starts && starts[k] !== undefined ? starts[k] : at + k * rate);
  const ex = enterState(f, undefined, exit);
  if (ex.o <= 0.001) return null;
  const shown = slots.reduce((a, _, k) => a + (f >= startOf(k) ? 1 : 0), 0);
  const k0 = Math.round(sh * 0.04);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.o, transform: ex.transform }}>
      {slots.map((cell, k) => {
        const st = startOf(k);
        if (f < st) return null;
        const isBig = big.includes(k);
        let s: number;
        if (isBig) {
          const a = prog(f, st, st + 7, EASE.pop);
          const b = prog(f, st + 7, st + 19, EASE.travel);
          s = mix(0, bigScale, a) * mix(1, 1 / bigScale, b);
        } else s = prog(f, st, st + 8, EASE.pop);
        const o = Math.min(1, prog(f, st, st + 5, EASE.soft) * 1.2);
        const c = cell % cols;
        const r = Math.floor(cell / cols);
        const d = driftAt(f, 2.5, 70 + (cell % 5) * 9, cell);
        const cx = x + (c + 0.5) * cellW + d.x;
        const cy = y + (r + 0.5) * cellH + d.y;
        return (
          <div
            key={cell}
            style={{ position: "absolute", left: cx - sw / 2, top: cy - sh / 2, width: sw, height: sh, transform: `scale(${s.toFixed(4)})`, transformOrigin: "50% 80%", opacity: o }}
          >
            <RimImage
              src={src}
              w={sw}
              h={sh}
              rim={rim}
              shadow={`drop-shadow(${k0}px ${Math.round(k0 * 1.5)}px ${Math.round(k0 * 1.2)}px rgba(0,0,0,.20)) drop-shadow(${k0 * 3}px ${k0 * 4}px ${k0 * 4}px rgba(0,0,0,.14))`}
            />
          </div>
        );
      })}
      {counter ? (
        <div
          style={{
            position: "absolute",
            left: counter.align === "center" ? counter.x - (counter.w ?? 600) / 2 : counter.align === "right" ? counter.x - (counter.w ?? 600) : counter.x,
            top: counter.y,
            width: counter.w ?? 600,
            textAlign: counter.align ?? "left",
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: counter.size ?? 96,
            letterSpacing: -3,
            lineHeight: 1,
            color: theme.color.ink,
            fontVariantNumeric: "tabular-nums",
            opacity: shown ? 1 : 0,
          }}
        >
          {Math.round(((counter.to ?? n) * shown) / n)}
          {counter.suffix ? <span style={{ fontWeight: 500, fontSize: (counter.size ?? 96) * 0.5, letterSpacing: -0.5, marginLeft: 14 }}>{counter.suffix}</span> : null}
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------- LineTrack
export type TrackItem = {
  /** sprite (default the robot) */
  src?: string;
  /** small lead-in on the role card (default "one for") */
  kicker?: string;
  /** the role, bold */
  role: string;
};

export type LineTrackProps = {
  items: TrackItem[];
  /** frame each item's hold starts; the whip to item i (i > 0) runs from holds[i] for `whip` frames */
  holds: number[];
  /** sprite centre line, px (default 760) */
  y?: number;
  /** distance between items along the line (default 1080, one item per screen) */
  spacing?: number;
  whip?: number;
  /** horizontal motion blur cap, px (default 12; light, the reference smears only on the fastest frames) */
  blurMax?: number;
  /** frame the line draws in from the left (undefined = drawn) */
  lineAt?: number;
  lineW?: number;
  /** sprite height (default 420) */
  spriteH?: number;
  /** role card under the sprite (default true; false = plain caption) */
  card?: boolean;
  /** frames after the hold starts that the role text lands (default 3) */
  labelDelay?: number;
  /** role card top, px below the sprite centre (default spriteH * 0.62) */
  cardDy?: number;
  /** caption sizes */
  kickerSize?: number;
  roleSize?: number;
  exit?: Exit;
};

/**
 * A long thin black line across the frame with items spaced along it (sprite + role card). The content whips
 * sideways from item to item (camera-curve ease) with a light horizontal motion blur that scales with speed,
 * the sprites lean into the move, and each item holds while its role lands.
 */
export const LineTrack: React.FC<LineTrackProps> = ({
  items,
  holds,
  y = 760,
  spacing = 1080,
  whip = 10,
  blurMax = 12,
  lineAt,
  lineW = 4,
  spriteH = 420,
  card = true,
  labelDelay = 3,
  cardDy,
  kickerSize = 46,
  roleSize = 70,
  exit,
}) => {
  const f = useCurrentFrame();
  const id = React.useId().replace(/:/g, "");
  const off = (fr: number) => holds.reduce((a, h, i) => (i ? a + spacing * prog(fr, h, h + whip, EASE.cam) : a), 0);
  const o = off(f);
  const v = off(f + 0.5) - off(f - 0.5);
  const blur = Math.min(blurMax, Math.abs(v) * 0.12);
  const ex = enterState(f, undefined, exit);
  if (ex.o <= 0.001) return null;
  const sw = spriteH * ROBOT_ASPECT;
  const lineP = lineAt === undefined ? 1 : prog(f, lineAt, lineAt + 14, EASE.cam);
  const lastX = 540 + (items.length - 1) * spacing;
  const lean = Math.max(-9, Math.min(9, -v * 0.06));
  const cdy = cardDy ?? spriteH * 0.62;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.o, transform: ex.transform }}>
      {blur > 0.3 ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={`pstrack${id}`} x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${(-o).toFixed(2)}px)`, filter: blur > 0.3 ? `url(#pstrack${id})` : undefined }}>
        {/* the line: in from the left edge, through every item, ending at the last one */}
        <div
          style={{
            position: "absolute",
            left: -60,
            top: y - lineW / 2,
            width: (lastX + 60) * lineP,
            height: lineW,
            background: theme.color.ink,
            borderRadius: lineW,
            filter: theme.shadow.wire,
          }}
        />
        {items.map((it, i) => {
          const cx = 540 + i * spacing;
          const lat = holds[i] + (i ? labelDelay : 0);
          const bob = driftAt(f, 4, 60, i * 3);
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "absolute",
                  left: cx - sw / 2,
                  top: y - spriteH * 0.55 + bob.y,
                  width: sw,
                  height: spriteH,
                  transform: `rotate(${lean.toFixed(2)}deg)`,
                  transformOrigin: "50% 90%",
                }}
              >
                <RimImage src={it.src ?? PHOTO05.robot} w={sw} h={spriteH} />
              </div>
              <RoleCard cx={cx} top={y + cdy} kicker={it.kicker ?? "one for"} role={it.role} at={lat} card={card} f={f} ks={kickerSize} rs={roleSize} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const RoleCard: React.FC<{ cx: number; top: number; kicker: string; role: string; at: number; card: boolean; f: number; ks: number; rs: number }> = ({ cx, top, kicker, role, at, card, f, ks, rs }) => {
  const rk = reveal(f, at, { settle: 9 });
  const rr = reveal(f, at + 4, { settle: 10 });
  const cp = prog(f, at - 2, at + 8, EASE.enter);
  return (
    <div style={{ position: "absolute", left: cx - 470, top, width: 940, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          padding: card ? "20px 44px 26px" : 0,
          background: card ? theme.color.paper : "transparent",
          borderRadius: theme.radius.card,
          boxShadow: card ? theme.shadow.card : undefined,
          textAlign: "center",
          fontFamily: INTER,
          opacity: card ? cp : 1,
          transform: card ? `translateY(${((1 - cp) * 24).toFixed(2)}px)` : undefined,
        }}
      >
        <div style={{ fontSize: ks, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.15, ...(f >= at ? rk.style : { opacity: 0 }) }}>{kicker}</div>
        <div style={{ fontSize: rs, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, whiteSpace: "nowrap", ...(f >= at + 4 ? rr.style : { opacity: 0 }) }}>{role}</div>
      </div>
    </div>
  );
};
