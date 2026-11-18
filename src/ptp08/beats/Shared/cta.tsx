// ep08 shared CTA scene (owner BA). BodyA, BodyB and BodyC all render this one file (BB and BC import it from
// beats/Shared/cta.tsx, never copy it) with their own shot ids:
//   <CtaScene ctaShot="A15a" tailShot="A15x" />   BodyA
//   <CtaScene ctaShot="B10a" tailShot="B10x" />   BodyB
//   <CtaScene ctaShot="C10a" tailShot="C10x" />   BodyC
// Assets: public/ptp08/Shared/ (robot.png = ep06's robot, guide-mock-github.png = the ASSETS agent's guide mock);
// without the guide file the kit's drawn PageTurn guide stands in. Self-contained: remotion, the kit, ../../timing.
// Based on ep07's approved CTA (BodyA/cta.tsx after RED TEAM fix round 2), keyword, guide and promise caption changed.
//
// Instagram (the CTA shot + the tail hold), spoken "Comment COMMIT and I'll send you the exact prompts to set up GitHub
// with Claude Code.": "Comment" above a wide white paper speech bubble that points at the robot; COMMIT (200 px) lands
// in it like a caption word on its spoken word (three soft dots wait before it), with one pulse on the hit. The Paper
// Studio robot (robot.png) stands left of centre with a soft contact shadow, blinks, tilts toward the bubble, breathes;
// the guide mock (guide-mock-github.png) turns in at its right and lifts once on "exact prompts". The promise caption
// runs full width under them, in two blocks ("and I'll send you / the exact prompts", "to set up GitHub / with Claude
// Code").
// YouTube Shorts cuts (*YT): the voice says "Subscribe to learn more about AI."; the bubble reads SUBSCRIBE, no
// "Comment", no keyword, no guide, no DM; the caption "to learn / more about AI".
// Tail hold: drifts, one more blink, nothing new. Camera: its own kit Camera, identity at its first and last frame.
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { CAM_BOX, Camera, EASE, INTER, PageTurn, camPath, hasStatic, mix, mixColor, prog, theme, zoomAt, type CapWord } from "../../../paperstudio";
import { SmoothCaption, smoothCaptionHeight as captionHeight } from "./smoothCaption";
import { Easing } from "remotion";
import { isYT, useShot, useVariant, useWords, type Span } from "../../timing";

/** SMOOTHNESS (Victor 2026-11-07): in-out curve, zero velocity at both ends, no overshoot */
const SMOOTH = Easing.bezier(0.4, 0, 0.2, 1);

/** robot.png (1134 x 1574, ep06's) eye boxes in image px, for the blink */
const RW = 1134;
const RH = 1574;
const EYES = [
  { x0: 374, y0: 334, x1: 458, y1: 500 },
  { x0: 732, y0: 383, x1: 823, y1: 546 },
];
const VISOR = "#1E1D21";

/** world px (before the shell's 0.9 pad) */
// Layout (fix round 2, red team B-13 / W-01): the CTA opens on its full composition (robot, bubble with its waiting
// dots, "Comment" in grey, the guide mock) from its first frame, so a crossing into it always carries content.
// Safe box on screen x 65-1015, y 269-1248 = world/hud x 12-1068, y 215-1302 at identity.
// Instagram: "Comment" box 236-314, bubble 316-536, robot 544 tall with its feet at 1092, guide on its right, caption
// block 1099-1299 (screen 1063-1243). Until the first caption word the camera holds a 1.12 push about (540, 316) (the
// robot and the guide fill the lower frame; "Comment" stays at screen 278+, the bubble inside x 68-1012), then pulls back
// to identity before the caption lands; after that only a 1-1.5% drift about (540, 1080) (the feet stay above the caption).
// YouTube: no "Comment", no guide; the robot is big on the left (700 tall, feet at 1250) and "to learn / more about /
// AI" fills the column on its right (ep05/ep06's approved YT CTA), so no band is left empty.
type BubbleBox = { x0: number; y0: number; x1: number; y1: number; r: number; tail: { a: number; b: number; tx: number; ty: number } };
const BUB_IG: BubbleBox = { x0: 90, y0: 316, x1: 990, y1: 536, r: 50, tail: { a: 300, b: 392, tx: 368, ty: 562 } };
const BUB_YT: BubbleBox = { x0: 90, y0: 316, x1: 990, y1: 536, r: 50, tail: { a: 230, b: 322, tx: 296, ty: 562 } };
const ROBOT_IG = { h: 544, x: 168, bottom: 1092 };
const ROBOT_YT = { h: 700, x: 48, bottom: 1250 };
const GUIDE = { x: 470, y: 650, w: 620 };
const CAP_CY = 1199;
const CAP_YT = { cx: 806, w: 500, cy: 970 };
const OPEN_C = { x: 540, y: 316 };
const OPEN_ZOOM = 1.12;
const HOLD_C = { x: 540, y: 1080 };
const CAP_K = 1.68;

const bubblePath = (B: BubbleBox) => {
  const { x0, y0, x1, y1, r, tail } = B;
  return [
    `M${x0 + r} ${y0}`,
    `H${x1 - r}`,
    `Q${x1} ${y0} ${x1} ${y0 + r}`,
    `V${y1 - r}`,
    `Q${x1} ${y1} ${x1 - r} ${y1}`,
    `H${tail.b}`,
    `Q${tail.b - 18} ${y1 + 20} ${tail.tx} ${tail.ty}`,
    `Q${tail.a + 20} ${y1 + 16} ${tail.a} ${y1}`,
    `H${x0 + r}`,
    `Q${x0} ${y1} ${x0} ${y1 - r}`,
    `V${y0 + r}`,
    `Q${x0} ${y0} ${x0 + r} ${y0}`,
    "Z",
  ].join(" ");
};

const pulse01 = (f: number, a: number, d: number) => (f < a || f >= a + d ? 0 : Math.sin(Math.PI * ((f - a) / d)));
const norm = (w: string) => w.replace(/[.,!?;:"]+/g, "").toLowerCase();

export type CtaSceneProps = {
  ctaShot?: string;
  tailShot?: string;
  /** public folder holding robot.png and guide-mock-github.png (default ptp08/Shared) */
  assetDir?: string;
  /** frames the scene draws before the CTA shot (the robot already rising while the previous scene leaves) */
  lead?: number;
  /** false while another Camera below still draws the ground */
  ground?: boolean;
};

export const CtaScene: React.FC<CtaSceneProps> = ({ ctaShot = "A15a", tailShot = "A15x", assetDir = "ptp08/Shared", lead = 10, ground = true }) => {
  const f = useCurrentFrame();
  const yt = isYT(useVariant());
  const cta = useShot(ctaShot) as Span | null;
  const tail = useShot(tailShot) as Span | null;
  const ws = useWords(ctaShot);
  if (!cta) return null;
  const end = tail ? tail.end : cta.end;
  if (f < cta.start - lead || f >= end) return null;

  const robotSrc = hasStatic(`${assetDir}/robot.png`) ? staticFile(`${assetDir}/robot.png`) : hasStatic("paperstudio/photos/robot.png") ? staticFile("paperstudio/photos/robot.png") : undefined;
  const guideSrc = hasStatic(`${assetDir}/guide-mock-github.png`) ? staticFile(`${assetDir}/guide-mock-github.png`) : undefined;

  const wAt = (re: RegExp, fb: number) => ws.find((w) => re.test(norm(w.w)))?.f ?? cta.start + fb;
  const commentAt = yt ? cta.start : wAt(/^comment$/, 2);
  const kwAt = yt ? wAt(/^subscribe$/, 2) : wAt(/^commit$/, 12);
  const sendAt = yt ? kwAt + 10 : wAt(/^send$/, 40);
  const fullAt = yt ? kwAt + 20 : wAt(/^exact$/, 60);
  const withAt = yt ? kwAt + 30 : wAt(/^to$/, 84);
  const lastW = ws.length ? ws[ws.length - 1].f : cta.end - 10;

  // robot: there from the CTA's first frame (a short settle, no rise from below), blinks, tilts toward the bubble on
  // the keyword, nods to the guide, breathes
  const R = yt ? ROBOT_YT : ROBOT_IG;
  const BUB = yt ? BUB_YT : BUB_IG;
  const RS = R.h / RH;
  const rw = RW * RS;
  const start0 = cta.start - lead;
  const robotAt = start0;
  const rise = prog(f, start0, start0 + 16, SMOOTH);
  const tailStart = tail ? tail.start : cta.end;
  const blink = Math.max(pulse01(f, kwAt + 16, 9), pulse01(f, tailStart + 10, 9));
  const tilt = -3 * pulse01(f, kwAt + 2, 26) + (yt ? 0 : 3 * pulse01(f, sendAt, 24)) + 2 * pulse01(f, tailStart + 4, 28);
  const breathe = 1 + 0.008 * Math.sin(((f - robotAt) / 50) * Math.PI * 2);

  // bubble: open from the first frame (dots waiting), the keyword lands on its word, one pulse on the hit
  const bubbleAt = start0;
  const bp = prog(f, bubbleAt, bubbleAt + 14, SMOOTH);
  const kp = prog(f, kwAt, kwAt + theme.caption.settle + 2, SMOOTH);
  const ko = prog(f, kwAt, kwAt + 10, SMOOTH);
  const dotsO = 1 - prog(f, kwAt - 8, kwAt, SMOOTH);
  const hit = 0.035 * pulse01(f, kwAt + 4, 14);
  const bob = 3 * Math.sin(((f - bubbleAt) / 64) * Math.PI * 2);
  const cp = prog(f, commentAt, commentAt + theme.caption.settle + 2, SMOOTH);

  // guide (Instagram): there from the first frame (it settles flat over 12 frames), lifts once on "full breakdown"
  const gIn = prog(f, start0, start0 + 16, SMOOTH);
  const gLift = pulse01(f, fullAt - 2, 20);
  const gw = GUIDE.w;
  const gh = gw / 1.5;

  // captions (hud): two blocks under the robot and the guide
  const PROPER: Record<string, string> = { "i'll": "I'll", ai: "AI", github: "GitHub", claude: "Claude", code: "Code" };
  const tok = (w: { w: string; f: number }, s: CapWord["s"]): CapWord => ({ t: PROPER[norm(w.w)] ?? norm(w.w), s, at: w.f });
  let blocks: CapWord[][][];
  if (yt) {
    const rest = ws.filter((w) => !/^subscribe$/.test(norm(w.w)));
    const more = rest.find((w) => norm(w.w) === "more")?.f ?? Infinity;
    const ai = rest.find((w) => norm(w.w) === "ai")?.f ?? Infinity;
    const st = (w: { w: string }) => (/^(more|ai)$/.test(norm(w.w)) ? "bi" : "reg");
    blocks = [[rest.filter((w) => w.f < more).map((w) => tok(w, "reg")), rest.filter((w) => w.f >= more && w.f < ai).map((w) => tok(w, st(w))), rest.filter((w) => w.f >= ai).map((w) => tok(w, st(w)))]];
  } else {
    const after = ws.filter((w) => w.f > kwAt);
    const the = after.find((w) => norm(w.w) === "the")?.f ?? Infinity;
    const b1 = after.filter((w) => w.f < withAt);
    const b2 = after.filter((w) => w.f >= withAt);
    const with2 = b2.find((w, i) => i > 0 && norm(w.w) === "with")?.f ?? Infinity;
    blocks = [
      [b1.filter((w) => w.f < the).map((w) => tok(w, "reg")), b1.filter((w) => w.f >= the).map((w) => tok(w, /^(exact|prompts)$/.test(norm(w.w)) ? "bi" : "reg"))],
      [b2.filter((w) => w.f < with2).map((w) => tok(w, /^github$/.test(norm(w.w)) ? "bold" : "reg")), b2.filter((w) => w.f >= with2).map((w) => tok(w, /^(claude|code)$/.test(norm(w.w)) ? "bold" : "reg"))],
    ];
  }
  // block 1 stays until its last word ("prompts") has settled, then fades over 10 frames; block 2's words wait for it
  const b1Last = yt ? withAt : ws.filter((w) => w.f < withAt).reduce((a, w) => Math.max(a, w.f), cta.start);
  // words start their ease 3 frames before they are spoken; block 1 is gone (8-frame eased fade) by the frame before
  // block 2's first word starts
  const b1Exit = Math.max(b1Last - 3 + 6, withAt - 3 - 1 - 8);

  // camera. Instagram: open on a 1.12 push about the bubble's top edge (robot and guide fill the lower frame while the
  // keyword lands), drift +1%, pull back to identity before the first caption word, then only a slow 1-1.5% drift.
  // YouTube: identity, a slow 2% push about (540, 760).
  const ID = { x: (CAM_BOX.body.x0 + CAM_BOX.body.x1) / 2, y: (CAM_BOX.body.y0 + CAM_BOX.body.y1) / 2, zoom: 1 };
  const firstCap = ws.find((w) => w.f > kwAt)?.f ?? withAt;
  const keys = yt
    ? camPath({ f: start0 }).to(start0, zoomAt({ x: 540, y: 760 }, 1.02), Math.max(8, end - start0), EASE.drift).keys
    : camPath({ f: start0, ...zoomAt(OPEN_C, OPEN_ZOOM) })
        .to(start0, zoomAt(OPEN_C, OPEN_ZOOM * 1.01), Math.max(8, firstCap - 26 - start0), EASE.drift)
        .to(firstCap - 26, ID, 24)
        .to(firstCap - 2, zoomAt(HOLD_C, 1.01), Math.max(8, lastW - firstCap), EASE.drift)
        .to(lastW + 6, zoomAt(HOLD_C, 1.015), Math.max(8, end - lastW - 6), EASE.drift).keys;

  const hud = (
    <>
      {blocks.map((b, i) => {
        const lines = b.filter((l) => l.length).map((l) => l.map((w) => ({ ...w, at: i > 0 ? Math.max(w.at - 3, b1Exit + 9) : w.at - 3 })));
        if (!lines.length) return null;
        const first = Math.min(...lines.flat().map((w) => w.at));
        const exit = i === 0 && blocks.length > 1 ? b1Exit : undefined;
        if (f < first - 1 || (exit !== undefined && f >= exit + 8)) return null;
        const hh = captionHeight(lines, 4, CAP_K);
        return yt ? (
          <SmoothCaption key={i} lines={lines} y={CAP_YT.cy - hh / 2} x={CAP_YT.cx - CAP_YT.w / 2} w={CAP_YT.w} scale={CAP_K} lineGap={4} />
        ) : (
          <SmoothCaption key={i} lines={lines} y={CAP_CY - hh / 2} x={40} w={1000} scale={CAP_K} lineGap={4} exit={exit !== undefined ? { at: exit, dur: 8 } : undefined} />
        );
      })}
    </>
  );

  return (
    <Camera keys={keys} ground={ground ? {} : false} breathe={1.5} hud={hud} blur={false}>
      {/* STYLE UPLIFT: a warm paper sheet the robot and the guide stand on (a stage), fluttering 1 px */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 590 + 1.2 * Math.sin((f - start0) / 47),
          width: 1000,
          height: 560,
          transform: `rotate(${(-2 + 0.3 * Math.sin((f - start0) / 53)).toFixed(3)}deg)`,
          borderRadius: 10,
          background: "linear-gradient(160deg,#F9F8F5 0%,#F1EFEB 100%)",
          boxShadow: "2px 2px 0 #E2E0DC,10px 16px 28px rgba(0,0,0,.09),30px 46px 80px rgba(0,0,0,.05),inset 0 0 0 1px rgba(0,0,0,.025)",
          opacity: Math.min(1, rise * 2),
        }}
      />
      {/* guide (Instagram): the photographed mock turns in, or the kit's drawn guide with a page turn */}
      {!yt && gIn > 0.001 ? (
        guideSrc ? (
          <div
            style={{
              position: "absolute",
              left: GUIDE.x,
              top: GUIDE.y - 8 * gLift,
              width: gw,
              height: gh,
              transformOrigin: "0% 60%",
              transform: `perspective(1600px) rotateY(${mix(-36, -6, gIn).toFixed(2)}deg) rotate(${(-3 + 1.5 * Math.sin((f - sendAt) / 40)).toFixed(3)}deg)`,
              opacity: Math.min(1, gIn * 3),
              filter: `drop-shadow(${mix(8, 18, gIn).toFixed(1)}px ${(22 + 10 * gLift).toFixed(1)}px ${(18 + 8 * gLift).toFixed(1)}px rgba(0,0,0,.22))`,
            }}
          >
            <Img src={guideSrc} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ position: "absolute", left: 0, top: -8 * gLift, width: 1080, height: 1920, opacity: Math.min(1, gIn * 3) }}>
            <PageTurn x={GUIDE.x + 60} y={GUIDE.y + 20} w={250} h={300} at={fullAt - 2} dur={24} title="GitHub with Claude Code: the exact prompts" recenter={false} enter={{ at: start0, dur: 16, from: "right", dist: 120 }} />
          </div>
        )
      ) : null}
      {/* contact shadow under the robot's feet */}
      <div
        style={{
          position: "absolute",
          left: R.x + rw * 0.12,
          top: R.bottom - 22,
          width: rw * 0.8,
          height: 42,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 45% 50%, rgba(0,0,0,.30) 0%, rgba(0,0,0,.12) 45%, rgba(0,0,0,0) 72%)",
          transform: `translateX(10px) scale(${mix(0.4, 1, rise).toFixed(4)})`,
          opacity: rise,
        }}
      />
      {rise > 0.001 && robotSrc ? (
        <div
          style={{
            position: "absolute",
            left: R.x,
            top: R.bottom - R.h,
            width: rw,
            height: R.h,
            transform: `translateY(${(24 * (1 - rise)).toFixed(1)}px) scale(${mix(0.94, 1, rise).toFixed(4)}) rotate(${tilt.toFixed(3)}deg) scaleY(${breathe.toFixed(4)})`,
            transformOrigin: "50% 100%",
            opacity: Math.min(1, rise * 2),
            filter: "drop-shadow(14px 22px 18px rgba(0,0,0,.18))",
          }}
        >
          <Img src={robotSrc} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          {blink > 0.01
            ? EYES.map((e, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: (e.x0 - 4) * RS,
                    top: (e.y0 - 6) * RS,
                    width: (e.x1 - e.x0 + 8) * RS,
                    height: (e.y1 - e.y0 + 12) * RS * blink,
                    background: VISOR,
                    borderRadius: `0 0 ${(46 * RS).toFixed(1)}px ${(46 * RS).toFixed(1)}px / 0 0 ${(30 * RS).toFixed(1)}px ${(30 * RS).toFixed(1)}px`,
                    filter: "blur(1.2px)",
                  }}
                />
              ))
            : null}
        </div>
      ) : null}
      {/* "Comment" above the bubble (Instagram): laid out in light grey from the first frame, inks in on its word */}
      {!yt && bp > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: 240,
            width: 600,
            top: 236 + 4 * (1 - cp) + bob,
            textAlign: "center",
            fontFamily: INTER,
            fontSize: 78,
            fontWeight: 400,
            lineHeight: 1,
            color: mixColor("#D9D8D5", theme.color.ink, cp),
            opacity: Math.min(1, bp * 2),
          }}
        >
          Comment
        </div>
      ) : null}
      {/* the speech bubble */}
      {bp > 0.001 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${bob.toFixed(2)}px) scale(${(mix(0.3, 1, bp) * (1 + hit)).toFixed(4)})`,
            transformOrigin: `${BUB.tail.tx}px ${BUB.tail.ty}px`,
            opacity: Math.min(1, bp * 2),
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(3px 3px 0 #DCDCDC) drop-shadow(2px 2px 0 #CFCFCF) drop-shadow(16px 26px 24px rgba(0,0,0,.15)) drop-shadow(36px 56px 60px rgba(0,0,0,.08))" }}>
            <path d={bubblePath(BUB)} fill={theme.color.paper} />
          </svg>
          <div
            style={{
              position: "absolute",
              left: BUB.x0,
              top: BUB.y0,
              width: BUB.x1 - BUB.x0,
              height: BUB.y1 - BUB.y0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: INTER,
              fontSize: yt ? 134 : 200,
              fontWeight: 800,
              letterSpacing: yt ? -4 : -6,
              lineHeight: 1,
              color: theme.color.ink,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                display: "inline-block",
                opacity: ko,
                transform: `translateY(${(theme.caption.rise * (1 - kp)).toFixed(2)}px) scale(${(1 + 0.04 * Math.sin(Math.PI * kp)).toFixed(4)})`,
                color: mixColor(theme.color.ghost, theme.color.ink, kp),
              }}
            >
              {yt ? "SUBSCRIBE" : "COMMIT"}
            </span>
            {dotsO > 0.001 ? (
              <span style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 34, opacity: dotsO }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 34, height: 34, borderRadius: 17, background: "#C9C9C9", transform: `translateY(${(-9 * Math.max(0, Math.sin(((f - bubbleAt) / 16 - i / 3) * Math.PI * 2))).toFixed(2)}px)` }} />
                ))}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </Camera>
  );
};
