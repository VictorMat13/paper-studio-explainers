import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { H, W, theme } from "./theme";

/**
 * The light neutral CRT pass. Wrap the finished frame ONCE (never per element).
 * - soft bloom on whites only: highlights above ~67% blurred 9 px, multiplied by the source (so black ink and
 *   captions keep full contrast), screened back at 45%
 * - fine neutral scanlines, 1 px every 6 px at 3% multiply
 * - fractal grain at 8% soft-light (re-seeded each frame)
 * - 12% vignette, screen corners rounded at r 34 on #111
 * No colour fringe, no RGB triad, no tint, no curvature, no flicker.
 */
export const CrtPass: React.FC<{ children: React.ReactNode; enabled?: boolean; grain?: number; bloom?: number }> = ({
  children,
  enabled = true,
  grain = 0.08,
  bloom = 0.45,
}) => {
  const frame = useCurrentFrame();
  const id = React.useId().replace(/:/g, "");
  if (!enabled) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ background: theme.color.crtMat }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={`pscrt${id}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="3 0 0 0 -2  0 3 0 0 -2  0 0 3 0 -2  0 0 0 1 0" result="hi" />
            <feGaussianBlur in="hi" stdDeviation="9" result="bl" />
            <feComposite in="bl" in2="SourceGraphic" operator="arithmetic" k1={bloom} k2="0" k3="0" k4="0" result="bloom" />
            <feBlend in="SourceGraphic" in2="bloom" mode="screen" />
          </filter>
          <filter id={`psgrain${id}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: `url(#pscrt${id})`, borderRadius: theme.radius.crt, overflow: "hidden" }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{ mixBlendMode: "multiply", background: "repeating-linear-gradient(0deg,rgba(18,18,18,.03) 0 1px,transparent 1px 6px)", pointerEvents: "none" }}
      />
      <svg style={{ position: "absolute", left: 0, top: 0, opacity: grain, mixBlendMode: "soft-light" }} width={W} height={H}>
        <rect width={W} height={H} filter={`url(#psgrain${id})`} />
      </svg>
      <AbsoluteFill style={{ borderRadius: theme.radius.crt, boxShadow: `inset 0 0 150px rgba(0,0,0,.12),0 0 0 80px ${theme.color.crtMat}` }} />
    </AbsoluteFill>
  );
};
