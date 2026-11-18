import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, MONO, mix, prog, theme } from "./theme";

/** Rounded label pill ("boss", "worker", "main.rs"). x is the centre. Pops in at `at` if given. */
export const Pill: React.FC<{
  x: number;
  y: number;
  text: React.ReactNode;
  light?: boolean;
  mono?: boolean;
  fs?: number;
  at?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ x, y, text, light = false, mono = false, fs = 34, at, opacity = 1, style }) => {
  const f = useCurrentFrame();
  const p = at === undefined ? 1 : prog(f, at, at + 9, EASE.pop);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateX(-50%) scale(${mix(0.55, 1, p).toFixed(4)})`,
        transformOrigin: "50% 100%",
        opacity: Math.min(1, p * 2) * opacity,
        background: light ? "#fff" : theme.color.ink,
        color: light ? theme.color.ink : "#fff",
        border: `3px solid ${theme.color.ink}`,
        borderRadius: 40,
        padding: "8px 24px",
        fontSize: fs,
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: theme.shadow.pill,
        fontFamily: mono ? MONO : INTER,
        lineHeight: 1.15,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** The shared hook overlay: the end result the viewer gets, same on every hook version, band y 290-440. */
export const HookOverlay: React.FC<{ text?: React.ReactNode; opacity?: number }> = ({
  text = (
    <>
      How to get a faster
      <br />
      coding agent for free
    </>
  ),
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: 100,
      top: 296,
      width: 880,
      height: 130,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      fontFamily: INTER,
      fontSize: 56,
      fontWeight: 800,
      lineHeight: 1.08,
      letterSpacing: -1,
      color: theme.color.ink,
      opacity,
    }}
  >
    <div>{text}</div>
  </div>
);
