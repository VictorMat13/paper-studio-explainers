import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { EASE, INTER, MONO, mix, prog, theme } from "./theme";
import { Enter, Exit, enterState } from "./motion";
import { ghCount } from "./kit05";

type Rect = { x: number; y: number; w: number; h: number };

// ------------------------------------------------------------- UiCounter
export type UiCounterProps = {
  /** the real UI capture */
  src: string;
  /** its natural size in px */
  srcW: number;
  srcH: number;
  /** the part of the capture shown (capture px); it is scaled to fill the box w x h */
  crop: Rect;
  /** box size (usually the PaperCard / TerminalCard face it sits in) */
  w: number;
  h: number;
  /** the captured number's rect (capture px): covered by a matched patch, the counter is drawn there */
  num: Rect;
  from: number;
  to: number;
  /** frame the count starts and how long it runs (eases out, so it slows into the final value) */
  at: number;
  dur?: number;
  /** number format (default GitHub's compact count: 21.3k, 294k) */
  format?: (n: number) => string;
  /** counter type in capture px, and its colour, weight and face (defaults: GitHub sidebar) */
  fontSize?: number;
  color?: string;
  weight?: number;
  font?: string;
  /** patch colour (match the capture behind the number) */
  bg?: string;
  /** soft highlight + small swell when the count lands (default true) */
  pulse?: boolean;
  /** slow drift of the crop, capture px per frame (x, y) */
  pan?: [number, number];
};

/**
 * A number ticking inside a real UI capture: the capture is cropped and scaled to the box, the captured number is
 * covered by a patch in the capture's own colour and the counter runs from `from` to `to` in the same type,
 * formatted like GitHub ("294k"); when it lands it swells a touch with a soft grey highlight behind it.
 * Put it inside a PaperCard / TerminalCard (children) with w/h = the card face.
 */
export const UiCounter: React.FC<UiCounterProps> = ({
  src,
  srcW,
  srcH,
  crop,
  w,
  h,
  num,
  from,
  to,
  at,
  dur = 26,
  format = ghCount,
  fontSize,
  color = "#1F2328",
  weight = 700,
  font = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", ${INTER}, sans-serif`,
  bg = "#FFFFFF",
  pulse = true,
  pan = [0, 0],
}) => {
  const f = useCurrentFrame();
  const k = w / crop.w;
  const cx = crop.x + pan[0] * f;
  const cy = crop.y + pan[1] * f;
  const t = prog(f, at, at + dur, EASE.enter);
  const v = mix(from, to, t);
  const q = pulse ? prog(f, at + dur - 2, at + dur + 14, EASE.linear) : 0;
  const bump = Math.sin(Math.PI * q);
  const fs = (fontSize ?? num.h * 0.8) * k;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden" }}>
      <Img src={src} style={{ position: "absolute", left: -cx * k, top: -cy * k, width: srcW * k, height: srcH * k, maxWidth: "none" }} />
      <div
        style={{
          position: "absolute",
          left: (num.x - cx) * k,
          top: (num.y - cy) * k,
          width: num.w * k,
          height: num.h * k,
          background: bg,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (num.x - cx) * k - 10 * k,
          top: (num.y - cy) * k - 4 * k,
          height: num.h * k + 8 * k,
          padding: `0 ${10 * k}px`,
          display: "flex",
          alignItems: "center",
          borderRadius: 8 * k,
          background: `rgba(17,17,17,${(0.09 * bump).toFixed(3)})`,
          transform: `scale(${(1 + 0.1 * bump).toFixed(4)})`,
          transformOrigin: "20% 50%",
          fontFamily: font,
          fontWeight: weight,
          fontSize: fs,
          color,
          letterSpacing: -0.2 * k,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {format(v)}
      </div>
    </div>
  );
};

// ------------------------------------------------------------- CommitStrip
export type Commit = { hash: string; msg: string; /** avatar tone 0..1 (grey shade) */ tone?: number };
export type CommitStripProps = {
  /** strip centre line y */
  y: number;
  commits: Commit[];
  cardW?: number;
  cardH?: number;
  gap?: number;
  /** px per frame the strip scrolls right to left (default 6) */
  speed?: number;
  /** left x of the first card at frame `at` (default 140) */
  x0?: number;
  /** frame the strip appears (cards rise in, staggered) */
  at?: number;
  /** fold: every card flies into a target point (staggered), shrinking and fading as it lands */
  fold?: { at: number; x: number; y: number; dur?: number; stagger?: number; scale?: number; arc?: number };
  /** slight 3D lean of the whole strip, degrees around Y */
  tilt?: number;
  exit?: Exit;
};

const CommitCard: React.FC<{ c: Commit; w: number; h: number }> = ({ c, w, h }) => {
  const g = Math.round(200 - (c.tone ?? 0.5) * 120);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: theme.color.paper,
        borderRadius: 12,
        boxShadow: "3px 3px 0 #DCDCDC,10px 16px 26px rgba(0,0,0,.16),28px 40px 60px rgba(0,0,0,.08)",
        display: "flex",
        alignItems: "center",
        gap: h * 0.14,
        padding: `0 ${h * 0.18}px`,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: h * 0.4,
          height: h * 0.4,
          borderRadius: "50%",
          flex: "none",
          background: `radial-gradient(circle at 35% 30%, rgb(${g + 40},${g + 40},${g + 40}) 0%, rgb(${g},${g},${g}) 55%, rgb(${g - 30},${g - 30},${g - 30}) 100%)`,
          boxShadow: "inset 0 -2px 3px rgba(0,0,0,.15),2px 3px 4px rgba(0,0,0,.12)",
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: h * 0.22, color: theme.color.ink, lineHeight: 1.2 }}>{c.hash}</div>
        <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: h * 0.22, color: "#444", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.msg}</div>
      </div>
    </div>
  );
};

/**
 * A horizontal strip of small commit cards (short hash, message, avatar dot) scrolling past right to left; with
 * `fold` every card flies (staggered, on an arc) into a target point, shrinking and fading as it lands, e.g. into
 * the card that "learns" from them.
 */
export const CommitStrip: React.FC<CommitStripProps> = ({ y, commits, cardW = 340, cardH = 128, gap = 26, speed = 6, x0 = 140, at = 0, fold, tilt = 0, exit }) => {
  const f = useCurrentFrame();
  const ex = enterState(f, undefined, exit);
  if (ex.o <= 0.001 || f < at) return null;
  const xAt = (i: number, fr: number) => x0 + i * (cardW + gap) - speed * (fr - at);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: ex.o,
        transform: `${ex.transform}${tilt ? ` perspective(2400px) rotateY(${tilt}deg)` : ""}`,
      }}
    >
      {commits.map((c, i) => {
        const appear = prog(f, at + i * 2, at + i * 2 + 10, EASE.enter);
        let left = xAt(i, f);
        let top = y - cardH / 2 + (1 - appear) * 40;
        let s = 1;
        let o = appear;
        let rot = 0;
        if (fold) {
          const t0 = fold.at + i * (fold.stagger ?? 2);
          const d = fold.dur ?? 14;
          const p = prog(f, t0, t0 + d, EASE.travel);
          if (p > 0) {
            const sx = xAt(i, t0);
            const sy = y - cardH / 2;
            const tx = fold.x - cardW / 2;
            const ty = fold.y - cardH / 2;
            left = mix(sx, tx, p);
            top = mix(sy, ty, p) - (fold.arc ?? 140) * Math.sin(Math.PI * p);
            s = mix(1, fold.scale ?? 0.25, p);
            o = appear * (1 - prog(f, t0 + d * 0.65, t0 + d, EASE.soft));
            rot = 10 * Math.sin(Math.PI * p);
          }
        }
        if (o <= 0.001 || left > 1300 || left < -cardW - 300) return null;
        return (
          <div key={i} style={{ position: "absolute", left, top, width: cardW, height: cardH, opacity: o, transform: `scale(${s.toFixed(4)}) rotate(${rot.toFixed(2)}deg)` }}>
            <CommitCard c={c} w={cardW} h={cardH} />
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------- PageTurn
export type PageTurnProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** frame the first page starts lifting */
  at: number;
  dur?: number;
  /** how many pages turn (default 1), `stagger` frames apart */
  turns?: number;
  stagger?: number;
  /** cover title (the guide mock look: white cover, teal spine strip, bold title) */
  title?: string;
  /** a flat cover image instead of the drawn cover */
  coverSrc?: string;
  /** spine strip colour (default the guide mock teal) */
  spine?: string;
  /** 3D lean of the whole guide lying on the paper (degrees) */
  leanX?: number;
  leanZ?: number;
  /** slide the guide right by half its width as the first page opens, so the open spread stays centred where the
   * closed guide was (default true) */
  recenter?: boolean;
  enter?: Enter;
  exit?: Exit;
};

const PageLines: React.FC<{ w: number; h: number; seed: number; heading?: boolean }> = ({ w, h, seed, heading = true }) => {
  const rows = 11;
  return (
    <div style={{ position: "absolute", left: w * 0.12, top: h * 0.1, width: w * 0.76 }}>
      {heading ? <div style={{ height: h * 0.045, width: "62%", background: "#2A2A2A", borderRadius: 4, marginBottom: h * 0.04 }} /> : null}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ height: h * 0.018, width: `${88 - ((i * 37 + seed * 13) % 30)}%`, background: "#C9C9C9", borderRadius: 3, marginBottom: h * 0.032 }} />
      ))}
    </div>
  );
};

/**
 * The CTA guide with a 3D page turn: a guide (white cover, teal spine strip, bold title, sheets under it for
 * thickness) lying on the paper with a slight lean; a page lifts from the right edge and turns left around the
 * spine, shading as it turns, casting a soft moving shadow on the page under it, then lies open on the left.
 */
export const PageTurn: React.FC<PageTurnProps> = ({
  x,
  y,
  w,
  h,
  at,
  dur = 24,
  turns = 1,
  stagger = 8,
  title = "Setup guide",
  coverSrc,
  spine = "#22A99A",
  leanX = 24,
  leanZ = -8,
  recenter = true,
  enter,
  exit,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o <= 0.001) return null;
  const angles = Array.from({ length: turns }, (_, i) => {
    const p = prog(f, at + i * stagger, at + i * stagger + dur, EASE.travel);
    return 180 * p;
  });
  // the topmost page still lying on the right casts the moving shadow
  const live = angles.findIndex((a) => a > 0 && a < 180);
  const th = live >= 0 ? angles[live] : 0;
  const rad = (th * Math.PI) / 180;
  const edgeX = w * Math.cos(rad); // where the lifted page's free edge projects (spine at 0)
  const shadowO = 0.42 * Math.sin(rad);
  const slide = recenter ? (w / 2) * prog(f, at, at + dur, EASE.cam) : 0;
  const cover =
    coverSrc ? (
      <Img src={coverSrc} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w * 0.04, background: spine }} />
        <div style={{ position: "absolute", left: w * 0.12, top: h * 0.12, width: w * 0.8, fontFamily: INTER, fontWeight: 800, fontSize: w * 0.11, letterSpacing: -1.5, color: theme.color.ink, lineHeight: 1.05 }}>
          {title}
        </div>
      </>
    );
  return (
    <div style={{ position: "absolute", left: x + slide, top: y, width: w, height: h, transform: e.transform, opacity: e.o }}>
      {/* ground contact shadow, under the 3D block */}
      <div style={{ position: "absolute", left: -w * 0.1, top: h * 0.7, width: w * 1.25, height: h * 0.42, borderRadius: "50%", background: "rgba(0,0,0,.22)", filter: "blur(34px)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `perspective(2600px) rotateX(${leanX}deg) rotateZ(${leanZ}deg)`, transformStyle: "preserve-3d" }}>
        {/* page block thickness */}
        {[3, 2, 1].map((i) => (
          <div key={i} style={{ position: "absolute", left: i * 3, top: i * 4, width: w, height: h, background: i === 3 ? "#D6D6D6" : "#EDEDED", borderRadius: 6, boxShadow: i === 3 ? "18px 26px 40px rgba(0,0,0,.18)" : undefined }} />
        ))}
        {/* the page underneath */}
        <div style={{ position: "absolute", inset: 0, background: "#FCFCFC", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w * 0.04, background: spine, opacity: 0.25 }} />
          <PageLines w={w} h={h} seed={turns} />
          {/* moving shadow from the lifting page */}
          {shadowO > 0.01 && th < 90 ? (
            <div
              style={{
                position: "absolute",
                left: Math.max(0, edgeX - w * 0.05),
                top: 0,
                bottom: 0,
                width: w * 0.32 * Math.sin(rad) + 20,
                background: `linear-gradient(90deg, rgba(0,0,0,${shadowO.toFixed(3)}) 0%, rgba(0,0,0,0) 100%)`,
              }}
            />
          ) : null}
          {shadowO > 0.01 && th >= 90 ? (
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w * 0.25 * Math.sin(rad) + 10, background: `linear-gradient(90deg, rgba(0,0,0,${(shadowO * 0.7).toFixed(3)}) 0%, rgba(0,0,0,0) 100%)` }} />
          ) : null}
        </div>
        {/* turning pages, top page last so it draws above */}
        {angles
          .map((a, i) => ({ a, i }))
          .reverse()
          .map(({ a, i }) => {
            const r = (a * Math.PI) / 180;
            const shade = 0.28 * Math.sin(r);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "0% 50%",
                  transform: `translateZ(${(1 + (turns - i) * 0.5).toFixed(1)}px) rotateY(${(-a).toFixed(3)}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* front */}
                <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: 6, overflow: "hidden", backfaceVisibility: "hidden", boxShadow: "inset -1px 0 0 rgba(0,0,0,.06)" }}>
                  {i === 0 ? cover : <PageLines w={w} h={h} seed={i} />}
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(270deg, rgba(0,0,0,${shade.toFixed(3)}) 0%, rgba(0,0,0,${(shade * 0.25).toFixed(3)}) 60%, rgba(0,0,0,0) 100%)` }} />
                </div>
                {/* back */}
                <div style={{ position: "absolute", inset: 0, background: "#F6F6F6", borderRadius: 6, overflow: "hidden", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <PageLines w={w} h={h} seed={i + 5} heading={false} />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${(shade * 0.8).toFixed(3)}) 0%, rgba(255,255,255,0) 70%)` }} />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
