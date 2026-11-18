// ===========================================================================
// HA depth and material helpers (builder HA, ep08, STYLE UPLIFT 2026-11-07): parallax layers under the kit Camera,
// a faint paper grain, and a plain paper sheet with thickness. Local to HA, not kit.
// ===========================================================================
import React from "react";
import { useCamera, theme } from "../../../paperstudio";

/**
 * A world layer at depth k under the current Camera (1 = the subject, 0.7 = far behind, > 1 = in front): it pans and
 * zooms k times as much as the subject (zoom^k), so a push or a track separates the layers. At the identity pose every
 * layer coincides with the subject (hand-off frames are unaffected).
 */
export const Depth: React.FC<{ k: number; children: React.ReactNode }> = ({ k, children }) => {
  const { pose, anchor } = useCamera();
  if (k === 1) return <>{children}</>;
  const zk = Math.pow(pose.zoom, k);
  const s = zk / pose.zoom;
  const pkx = anchor.x + (pose.x - anchor.x) * k;
  const pky = anchor.y + (pose.y - anchor.y) * k;
  const tx = pose.x - pkx * s;
  const ty = pose.y - pky * s;
  const ident = Math.abs(s - 1) < 1e-6 && Math.abs(tx) < 1e-3 && Math.abs(ty) < 1e-3;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: ident ? undefined : `translate(${tx.toFixed(3)}px,${ty.toFixed(3)}px) scale(${s.toFixed(5)})` }}>
      {children}
    </div>
  );
};

/** a faint paper grain over a card face (fractal noise multiplied at a few percent) and a soft inner edge */
export const PaperGrain: React.FC<{ id: string; opacity?: number }> = ({ id, opacity = 0.06 }) => (
  <>
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, mixBlendMode: "multiply" }} aria-hidden>
      <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${id})`} />
    </svg>
    <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.035), inset 0 0 22px rgba(0,0,0,.035), inset 0 2px 0 rgba(255,255,255,.9)" }} />
  </>
);

/** a plain paper sheet with a thickness edge, the card shadow, the grain; centred at (cx, cy), rotated `rot` deg */
export const Sheet: React.FC<{ id: string; cx: number; cy: number; w: number; h: number; rot?: number; tf?: string; sheets?: number; opacity?: number }> = ({
  id,
  cx,
  cy,
  w,
  h,
  rot = 0,
  tf = "",
  sheets = 0,
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transformOrigin: "50% 50%", transform: `rotate(${rot.toFixed(3)}deg) ${tf}`, opacity }}>
    {Array.from({ length: sheets }, (_, k) => sheets - k).map((i) => (
      <div key={i} style={{ position: "absolute", left: i * 26, top: i * 9, width: w, height: h - i * 6, background: theme.color.sheet, borderRadius: theme.radius.card - 2, boxShadow: theme.shadow.sheet }} />
    ))}
    <div style={{ position: "absolute", inset: 0, background: theme.color.paper, borderRadius: theme.radius.card, boxShadow: theme.shadow.card, overflow: "hidden" }}>
      <PaperGrain id={id} />
    </div>
  </div>
);
