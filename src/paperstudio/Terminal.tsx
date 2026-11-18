import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { Enter, Exit, enterState } from "./motion";
import { Pill } from "./Pill";
import { TERM, TERM_BY_TITLE, theme } from "./theme";

export type TerminalCardProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** a real JCode capture; defaults by `title` (jcode = demo-1, worker = demo-2, helper = demo-4, boss/swarm = swarm) */
  src?: string;
  title?: string;
  /** white bezel width (default max(7, w/58), about 14 px on a big card) */
  bezel?: number;
  /** 3D tilt around Y in degrees (perspective 1600) */
  tiltY?: number;
  /** 3D tilt around X in degrees */
  tiltX?: number;
  /** extra transform appended */
  tf?: string;
  /** scroll the capture up inside the screen, px */
  scroll?: number;
  objectPosition?: string;
  /** dim the whole card (0..1 of opacity removed) */
  dim?: number;
  enter?: Enter;
  exit?: Exit;
  children?: React.ReactNode;
};

/** A real terminal screenshot in a white bezel with rounded corners and a deep shadow, like a monitor lying on the paper. */
export const TerminalCard: React.FC<TerminalCardProps> = ({
  x,
  y,
  w,
  h,
  src,
  title = "jcode",
  bezel,
  tiltY = 0,
  tiltX = 0,
  tf = "",
  scroll = 0,
  objectPosition = "left top",
  dim = 0,
  enter,
  exit,
  children,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  const bz = bezel ?? Math.max(7, Math.round(w / 58));
  const img = src ?? TERM_BY_TITLE[title] ?? TERM.demo1;
  const lean = tiltY || tiltX ? `perspective(1600px) rotateY(${tiltY}deg) rotateX(${tiltX}deg) ` : "";
  const o = e.o * (1 - dim);
  if (o <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "#fff",
        borderRadius: bz + 5,
        boxShadow: theme.shadow.terminal,
        transform: `${e.transform} ${lean}${tf}`,
        transformOrigin: "center",
        opacity: o,
      }}
    >
      <div style={{ position: "absolute", inset: bz, borderRadius: 5, overflow: "hidden", background: theme.color.termBody, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.4)" }}>
        <Img
          src={img}
          style={{ position: "absolute", left: 0, top: -scroll, width: "100%", height: scroll ? "auto" : "100%", objectFit: "cover", objectPosition, display: "block" }}
        />
        {children}
      </div>
    </div>
  );
};

export type StripPane = { src: string; label?: string; lightLabel?: boolean };

/**
 * A wide strip of several captures panning right to left inside one terminal frame that stays in the safe box.
 * offset(f) = panStart + speed * f. Optional pills ride above each pane and pop as the pane arrives.
 */
export const TerminalStrip: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  panes: StripPane[];
  /** pane width (default: the capture aspect 1.6 x the screen height) */
  paneW?: number;
  gap?: number;
  panStart?: number;
  /** px per frame (storyboard: about 4) */
  speed?: number;
  /** clamp the pan so the strip never runs out (default true) */
  clampEnd?: boolean;
  bezel?: number;
  enter?: Enter;
  exit?: Exit;
}> = ({ x, y, w, h, panes, paneW, gap = 18, panStart = 0, speed = 4, clampEnd = true, bezel, enter, exit }) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  const bz = bezel ?? Math.max(7, Math.round(w / 58));
  const screenW = w - 2 * bz;
  const screenH = h - 2 * bz;
  const pw = paneW ?? Math.round(screenH * 1.6);
  const total = panes.length * pw + (panes.length - 1) * gap;
  const maxOff = Math.max(0, total - screenW);
  let off = panStart + speed * f;
  if (clampEnd) off = Math.max(0, Math.min(maxOff, off));
  if (e.o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: e.transform, opacity: e.o }}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: bz + 5, boxShadow: theme.shadow.terminal }} />
      <div style={{ position: "absolute", inset: bz, borderRadius: 5, overflow: "hidden", background: theme.color.termBody, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.4)" }}>
        {panes.map((p, i) => (
          <Img
            key={i}
            src={p.src}
            style={{ position: "absolute", left: i * (pw + gap) - off, top: 0, width: pw, height: screenH, objectFit: "cover", objectPosition: "left top", display: "block" }}
          />
        ))}
        {panes.map((_, i) =>
          i ? <div key={`g${i}`} style={{ position: "absolute", left: i * (pw + gap) - gap - off, top: 0, width: gap, height: screenH, background: "#2A2A2E" }} /> : null,
        )}
      </div>
      {/* pills above the panes, clipped to the frame width so they ride the pan */}
      <div style={{ position: "absolute", left: 0, top: -140, width: w + 40, height: 138, overflow: "hidden" }}>
        {panes.map((p, i) => {
          if (!p.label) return null;
          const cx = bz + i * (pw + gap) + Math.min(pw / 2, 160) - off;
          // the frame at which this pill's centre comes inside the frame (pop then)
          const arriveOff = bz + i * (pw + gap) + Math.min(pw / 2, 160) - (w - 120);
          const at = speed > 0 ? Math.max(0, Math.ceil((arriveOff - panStart) / speed)) : 0;
          return <Pill key={i} x={cx} y={44} text={p.label} light={p.lightLabel} at={at} />;
        })}
      </div>
    </div>
  );
};
