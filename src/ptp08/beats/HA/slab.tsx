// ===========================================================================
// The GitHub slab (builder HA, ep08): the skill's "heavy chip" treatment, a charcoal slab with a thick bottom edge,
// a matte top-left sheen, GitHub's official white Invertocat (github-white.svg, uniform scale) and the lowercase
// "github" label under it. Base size 180 x 200 (the contract's 180 px slab); beats draw it bigger with a uniform
// scale (`s`), so the slab looks the same at every size. Light from the top left, shadow down-right.
// Also the slab's back face (the white GitHub chip, kit LogoDisc) for the flip onto BodyA's card.
// ===========================================================================
import React from "react";
import { Img } from "remotion";
import { INTER } from "../../../paperstudio";
import { HA_LOGO } from "./assets";

export const SLAB = { w: 180, h: 200 } as const;

/**
 * The slab, drawn with its top-left corner at (0, 0) in a SLAB.w x SLAB.h box (the edge and shadow hang below).
 * `sheen` 0..1 = a soft matte light band crossing the face left to right (-1 = none).
 */
export const GithubSlab: React.FC<{ sheen?: number }> = ({ sheen = -1 }) => {
  const { w, h } = SLAB;
  const R = 0.16 * w;
  const EDGE = 0.05 * w;
  const mark = 0.5 * w;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      {/* thickness: the slab's lower body, seen below its face, and the cast shadow down-right */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: EDGE,
          width: w,
          height: h,
          borderRadius: R,
          background: "linear-gradient(180deg,#151516 0%,#070708 100%)",
          boxShadow: `${0.025 * w}px ${0.045 * w}px ${0.065 * w}px rgba(0,0,0,.26),${0.07 * w}px ${0.115 * w}px ${0.17 * w}px rgba(0,0,0,.15)`,
        }}
      />
      {/* face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: R,
          background: "linear-gradient(158deg,#3b3b3e 0%,#262628 42%,#1a1a1c 100%)",
          boxShadow: "inset 0 1.6px 0 rgba(255,255,255,.30),inset 1px 0 0 rgba(255,255,255,.08),inset 0 -2px 0 rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 42%)" }} />
        {/* matte top edge catching the top-left light */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h * 0.1, background: "linear-gradient(180deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,0) 100%)" }} />
        {sheen >= 0 && sheen <= 1 ? (
          <div
            style={{
              position: "absolute",
              top: -h * 0.2,
              height: h * 1.4,
              left: -w * 0.7 + sheen * w * 1.9,
              width: w * 0.42,
              transform: "rotate(18deg)",
              background: "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.10) 50%,rgba(255,255,255,0) 100%)",
            }}
          />
        ) : null}
        {HA_LOGO.githubWhite ? (
          <Img src={HA_LOGO.githubWhite} style={{ position: "absolute", left: (w - mark) / 2, top: h * 0.14, width: mark, height: mark * (96 / 98), objectFit: "contain" }} />
        ) : (
          <div style={{ position: "absolute", left: (w - mark) / 2, top: h * 0.14, width: mark, height: mark, borderRadius: "50%", background: "#fff" }} />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: w,
            top: h * 0.68,
            textAlign: "center",
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 0.2 * w,
            letterSpacing: -0.4,
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
