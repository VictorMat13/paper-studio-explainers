import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { Enter, Exit, enterState } from "./motion";
import { theme } from "./theme";

export type PaperCardProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0-3 sheets peeking out behind, stepping +30 px right / +10 px down */
  sheets?: number;
  /** slight 3D lean: true = rotateY(-6deg), a number = that many degrees */
  tilt?: boolean | number;
  /** extra transform appended after the lean (scale, rotate...) */
  tf?: string;
  bg?: string;
  /** a real page capture filling the face (cover, top aligned) */
  src?: string;
  objectPosition?: string;
  /** content scroll inside the face, px (pans a tall capture up) */
  scroll?: number;
  radius?: number;
  enter?: Enter;
  exit?: Exit;
  opacity?: number;
  /** style on the card face */
  faceStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * White paper card with real thickness: hard 3 px and 5 px edges down-right, a two-layer soft shadow,
 * 0-3 sheets stacked behind it. Children render inside the face (positioned relative to it).
 */
export const PaperCard: React.FC<PaperCardProps> = ({
  x,
  y,
  w,
  h,
  sheets = 0,
  tilt = false,
  tf = "",
  bg = theme.color.paper,
  src,
  objectPosition = "center top",
  scroll = 0,
  radius = theme.radius.card,
  enter,
  exit,
  opacity = 1,
  faceStyle,
  children,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  const deg = tilt === true ? -6 : tilt === false ? 0 : tilt;
  const lean = deg ? `perspective(2200px) rotateY(${deg}deg) ` : "";
  const transform = `${e.transform} ${lean}${tf}`;
  const n = Math.max(0, Math.min(3, Math.round(sheets)));
  if (e.o * opacity <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform, transformOrigin: "center", opacity: e.o * opacity }}>
      {Array.from({ length: n }, (_, k) => n - k).map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * 30,
            top: i * 10,
            width: w,
            height: h - i * 6,
            background: theme.color.sheet,
            borderRadius: radius - 2,
            boxShadow: theme.shadow.sheet,
          }}
        />
      ))}
      <div style={{ position: "absolute", inset: 0, background: bg, borderRadius: radius, boxShadow: theme.shadow.card, overflow: "hidden", ...faceStyle }}>
        {src ? (
          <Img
            src={src}
            style={{ position: "absolute", left: 0, top: -scroll, width: "100%", height: scroll ? "auto" : "100%", objectFit: "cover", objectPosition, display: "block" }}
          />
        ) : null}
        {children}
      </div>
    </div>
  );
};
