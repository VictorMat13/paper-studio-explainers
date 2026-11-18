import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE, H, INTER, W, mix, mixColor, prog, theme } from "./theme";

// ------------------------------------------------------------- DeviceFrame
export type DeviceFrameProps = {
  /** final phone: outer left, top and width (height follows the 9:16 screen + bezel) */
  x: number;
  y: number;
  w: number;
  /** frame the pull-back starts (undefined = the content stays full size, no phone) */
  at?: number;
  dur?: number;
  /** bezel thickness at the final size (default 5% of w) */
  bezel?: number;
  /** screen corner radius at the final size (default 11% of w) */
  radius?: number;
  /** screen background that fades in under the content (default white) */
  screenBg?: string;
  /** dynamic-island pill (default true) */
  notch?: boolean;
  /** the content, drawn as a full 1080x1920 frame (no Ground; the outer ground stays) */
  children: React.ReactNode;
};

/** The phone's outer height for a given outer width (9:16 screen plus the bezel). */
export const deviceHeight = (w: number, bezel?: number) => {
  const b = bezel ?? Math.round(w * 0.05);
  return (w - 2 * b) * (H / W) + 2 * b;
};

/**
 * A phone mock (black bezel, rounded corners, notch) the content pulls back into: the children render full size
 * first, then scale down into the screen while the bezel, the screen background, the notch and the phone's
 * shadow fade in around them (the reference's "all wired together" move).
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({ x, y, w, at, dur = 20, bezel, radius, screenBg = "#ffffff", notch = true, children }) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 0 : prog(f, at, at + dur, EASE.cam);
  const b = bezel ?? Math.round(w * 0.05);
  const sr = radius ?? Math.round(w * 0.11);
  const sw = w - 2 * b;
  const sh = sw * (H / W);
  // screen rect, from the full frame to the final screen
  const L = mix(0, x + b, p);
  const T = mix(0, y + b, p);
  const Wd = mix(W, sw, p);
  const Hd = mix(H, sh, p);
  const R = mix(0, sr, p);
  const s = Wd / W;
  const bz = b * Math.min(1, 0.4 + p * 0.6);
  const fade = prog(f, at ?? 0, (at ?? 0) + dur * 0.7, EASE.soft) * (at === undefined ? 0 : 1);
  return (
    <AbsoluteFill>
      {fade > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: L - bz,
            top: T - bz,
            width: Wd + 2 * bz,
            height: Hd + 2 * bz,
            borderRadius: R + bz,
            background: "linear-gradient(145deg,#2A2A2C 0%,#0E0E0F 40%,#050505 100%)",
            boxShadow: `inset 0 0 0 ${Math.max(1, bz * 0.12).toFixed(1)}px #3A3A3C,inset 0 2px 1px rgba(255,255,255,.18),14px 24px 40px rgba(0,0,0,${(0.24 * fade).toFixed(3)}),40px 64px 110px rgba(0,0,0,${(0.16 * fade).toFixed(3)})`,
            opacity: fade,
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: L, top: T, width: Wd, height: Hd, borderRadius: R, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: screenBg, opacity: fade }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${s.toFixed(5)})`, transformOrigin: "0 0" }}>{children}</div>
        {notch && fade > 0.001 ? (
          <div style={{ position: "absolute", left: Wd / 2 - Wd * 0.15, top: Hd * 0.018, width: Wd * 0.3, height: Wd * 0.085, borderRadius: Wd * 0.05, background: "#050505", opacity: fade }} />
        ) : null}
        {fade > 0.001 ? <div style={{ position: "absolute", inset: 0, borderRadius: R, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.35)", opacity: fade }} /> : null}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- Toggle
export type ToggleProps = {
  /** left, top of the track */
  x: number;
  y: number;
  /** track width (default 120; height is 0.6 w) */
  w?: number;
  /** frame it flips on (undefined = already on; null = stays off) */
  at?: number | null;
  dur?: number;
  /** track colour when on (default ink black; iOS green is #34C759) */
  color?: string;
  /** frame it pops in (undefined = already there) */
  appear?: number;
  /** label to the right of the switch */
  label?: string;
  labelSize?: number;
  opacity?: number;
};

/** An iOS-style switch on the paper: the knob slides right and the track fills when it flips on (logo chips' on/off). */
export const Toggle: React.FC<ToggleProps> = ({ x, y, w = 120, at, dur = 10, color = theme.color.ink, appear, label, labelSize = 40, opacity = 1 }) => {
  const f = useCurrentFrame();
  const a = appear === undefined ? 1 : prog(f, appear, appear + 9, EASE.pop);
  if (a <= 0 || opacity <= 0) return null;
  const on = at === null ? 0 : at === undefined ? 1 : prog(f, at, at + dur, EASE.travel);
  const h = Math.round(w * 0.6);
  const k = h - 8;
  return (
    <div style={{ position: "absolute", left: x, top: y, height: h, display: "flex", alignItems: "center", gap: 22, transform: `scale(${mix(0.6, 1, a).toFixed(4)})`, transformOrigin: "0 50%", opacity: Math.min(1, a * 2) * opacity }}>
      <div
        style={{
          position: "relative",
          width: w,
          height: h,
          borderRadius: h / 2,
          background: mixColor("#E2E2E2", color.length === 7 ? color : "#111111", on),
          boxShadow: `inset 0 2px 4px rgba(0,0,0,${(0.16 * (1 - on) + 0.1).toFixed(3)}),6px 10px 18px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.05)`,
          flex: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 4 + (w - k - 8) * on,
            top: 4,
            width: k,
            height: k,
            borderRadius: "50%",
            background: "linear-gradient(180deg,#FFFFFF 0%,#F2F2F2 100%)",
            boxShadow: "0 3px 7px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.04)",
          }}
        />
      </div>
      {label ? <div style={{ fontFamily: INTER, fontSize: labelSize, fontWeight: 600, letterSpacing: -0.5, color: theme.color.label, whiteSpace: "nowrap" }}>{label}</div> : null}
    </div>
  );
};
