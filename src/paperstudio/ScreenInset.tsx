import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { EASE, mix, prog, theme } from "./theme";
import { Enter, Exit, enterState } from "./motion";
import { META06, P2, Quad, quadMatrix3d } from "./kit06";

/** the drawn fallback laptop (three-quarter view, silver, black screen), 1000 x 760, and its screen corners */
const FALLBACK = { w: 1000, h: 760, quad: [[160, 64], [836, 120], [828, 482], [168, 532]] as Quad };

const DrawnLaptop: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} viewBox={`0 0 ${FALLBACK.w} ${FALLBACK.h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <linearGradient id="psLapLid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3A3C40" />
        <stop offset="1" stopColor="#1C1D20" />
      </linearGradient>
      <linearGradient id="psLapDeck" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#F2F2F3" />
        <stop offset="0.6" stopColor="#D9DADD" />
        <stop offset="1" stopColor="#BEC0C4" />
      </linearGradient>
      <linearGradient id="psLapEdge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#A9ABAF" />
        <stop offset="1" stopColor="#8E9094" />
      </linearGradient>
    </defs>
    {/* deck front edge (thickness) */}
    <path d="M58 734 L986 640 L986 660 L60 756 Z" fill="url(#psLapEdge)" />
    {/* deck */}
    <path d="M140 558 L862 506 L986 640 L58 734 Z" fill="url(#psLapDeck)" />
    {/* keyboard well */}
    <path d="M205 574 L820 530 L880 600 L170 652 Z" fill="#C9CACD" />
    {Array.from({ length: 4 }, (_, r) => {
      const t0 = r / 4;
      const t1 = (r + 0.8) / 4;
      const L = (t: number): P2 => [205 + (170 - 205) * t, 574 + (652 - 574) * t];
      const R = (t: number): P2 => [820 + (880 - 820) * t, 530 + (600 - 530) * t];
      const a = L(t0);
      const b = R(t0);
      const c = R(t1);
      const d = L(t1);
      return <path key={r} d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]} L${c[0]} ${c[1]} L${d[0]} ${d[1]} Z`} fill="#A9AAAE" opacity={0.55} />;
    })}
    {/* trackpad */}
    <path d="M430 666 L640 650 L664 690 L428 708 Z" fill="#D2D3D6" stroke="#B4B5B9" strokeWidth={2} />
    {/* lid */}
    <path d="M134 32 L866 92 L862 508 L140 560 Z" fill="url(#psLapLid)" />
    <path d="M134 32 L866 92" stroke="#6A6C70" strokeWidth={3} />
    {/* screen (black) */}
    <path d={`M${FALLBACK.quad.map((p) => p.join(" ")).join(" L")} Z`} fill="#050506" />
    {/* hinge */}
    <path d="M140 560 L862 506 L866 516 L144 572 Z" fill="#7C7E82" />
  </svg>
);

export type ScreenInsetProps = {
  /** the photo cut-out box in reel px (w x h should match the photo's aspect; h defaults from it) */
  x: number;
  y: number;
  w: number;
  h?: number;
  /** the photo (e.g. the laptop cut-out); undefined draws the built-in laptop */
  src?: string;
  /** photo aspect w/h when `src` is given (default META06.laptop.aspect) */
  aspect?: number;
  /** the screen's corners TL, TR, BR, BL as fractions of the photo (default META06.laptop.quad, or the drawn laptop's) */
  quad?: Quad;
  /** children's own size; they are mapped onto the screen quad with matrix3d */
  contentW?: number;
  contentH?: number;
  /** screen background under the content */
  screenBg?: string;
  /** glass sheen over the screen (default true) and its strength (default 0.12) */
  sheen?: boolean;
  sheenStrength?: number;
  /** the screen powers on: content fades up from black over `dur` frames from `at` */
  on?: { at: number; dur?: number };
  /** floating cut-out shadow stack on the photo (default true) */
  shadow?: boolean;
  enter?: Enter;
  exit?: Exit;
  tf?: string;
  opacity?: number;
  children?: React.ReactNode;
};

/**
 * Composites children onto the screen of a photo cut-out (the laptop): the content is drawn at contentW x contentH
 * and mapped onto the screen's four corner points with a matrix3d homography, with a soft glass sheen. Without a
 * photo it draws its own three-quarter laptop with a black screen.
 */
export const ScreenInset: React.FC<ScreenInsetProps> = ({
  x,
  y,
  w,
  h: hIn,
  src,
  aspect,
  quad,
  contentW = 1600,
  contentH = 1000,
  screenBg = "#0B0C0E",
  sheen = true,
  sheenStrength = 0.12,
  on,
  shadow = true,
  enter,
  exit,
  tf = "",
  opacity = 1,
  children,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o * opacity <= 0.001) return null;
  const asp = aspect ?? (src ? META06.laptop.aspect : FALLBACK.w / FALLBACK.h);
  const h = hIn ?? w / asp;
  const qf: Quad = quad ?? (src ? META06.laptop.quad : (FALLBACK.quad.map(([qx, qy]) => [qx / FALLBACK.w, qy / FALLBACK.h]) as Quad));
  const q = qf.map(([u, v]) => [u * w, v * h] as P2) as Quad;
  const m = quadMatrix3d(contentW, contentH, q);
  const onP = on ? prog(f, on.at, on.at + (on.dur ?? 10), EASE.soft) : 1;
  // a slow diagonal sheen drifting across the glass
  const sx = mix(-40, 40, (Math.sin(f / 70) + 1) / 2);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `${e.transform} ${tf}`, transformOrigin: "center", opacity: e.o * opacity }}>
      <div style={{ position: "absolute", inset: 0, filter: shadow ? theme.shadow.cutout : undefined }}>
        {src ? <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} /> : <DrawnLaptop w={w} h={h} />}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: contentW, height: contentH, transformOrigin: "0 0", transform: m, background: screenBg, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: onP, filter: onP < 0.999 ? `brightness(${mix(1.6, 1, onP).toFixed(3)})` : undefined }}>{children}</div>
        {sheen ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(118deg, rgba(255,255,255,${(sheenStrength * 1.1).toFixed(3)}) 0%, rgba(255,255,255,${(sheenStrength * 0.35).toFixed(3)}) ${(30 + sx * 0.2).toFixed(1)}%, rgba(255,255,255,0) ${(46 + sx * 0.2).toFixed(1)}%, rgba(255,255,255,0) 100%)`,
            }}
          />
        ) : null}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(0,0,0,.55), inset 0 0 40px rgba(0,0,0,.35)" }} />
      </div>
    </div>
  );
};

/** the screen quad of a ScreenInset in reel px (for wires or rings anchored to the screen) */
export const screenQuad = (x: number, y: number, w: number, h: number, quad: Quad): Quad => quad.map(([u, v]) => [x + u * w, y + v * h] as P2) as Quad;
