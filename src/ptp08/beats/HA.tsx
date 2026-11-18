import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { Camera, LogoDisc, PaperCard, WirePath, camPath, drift, mix, theme, type CapWord } from "../../paperstudio";
import { bodyOf, useVariant, useWords } from "../timing";
// read-only: the bodies' first cards (their builders own the looks), so the last hook frame IS the body's frame 0
import { FC as FCA, FirstCard as FirstCardA } from "./BodyA/firstCard";
import { FIRST_CARD as FCB, FirstCard as FirstCardB } from "./BodyB/firstCard";
import { AppScreen, FC as FCC, FirstCard as FirstCardC, InkPill, LAP as LAP_C, Laptop as LaptopC } from "./BodyC/firstCard";
import { HA_LOGO, HA_PHOTO, LAPTOP_SCREEN } from "./HA/assets";
import { Depth, PaperGrain, Sheet } from "./HA/depth";
import { CaptionBlocks, HOOK_ID, cap1, findWord, hookPose, restyle, toLine, useHook } from "./HA/hook";
import { HO_POINT, comeRound, handoffClock, hingeOf, projectRound, turnAwayTf, type Rect } from "./HA/handoff";
import { CHIP_R, ROW_RECT, ROW_X, RobotAtLaptop, WIRE_Y, chipCentre, rowGeom, wirePulse } from "./HA/row";
import { GithubSlab, SLAB } from "./HA/slab";
import { Bubble, PopNode, bump, io } from "./HA/smooth";

// ===========================================================================
// HA: hook A "the reel's hook, kept close" (builder HA, ep08; STYLE UPLIFT + SMOOTHNESS 2026-11-07).
// "What actually is GitHub, and why does everyone building with AI keep mentioning it?"
//   HA1  frame 0 is a finished poster (the video's cover): the charcoal GitHub slab (official white Invertocat,
//        'github' under it) at rest on a white paper card in the top row, three robots (300 px) at their laptops on
//        a paper stage under it, the caption lane still empty (the first word reveals from frame 1); from frame 0 the
//        scene settles (20-frame eased camera
//        settle, the card easing its lean) and breathes. On "GitHub" the slab lifts a little off its card while a
//        matte sheen crosses it, the card flutters, and the camera leans toward it. Layers: stage sheet 0.7, card
//        0.85, slab and row 1.0.
//   HA2  each robot hops (lifts 18 px and settles) on its spoken word ("why", "does", "everyone"); the stage
//        flutters as it comes down; the camera returns to the whole row.
//   HA3  a Claude chip pops onto each laptop's screen, one per word ("building", "with", "AI"); the robots lean toward
//        the slab; a 7 px wire draws under the row, nodes popping as it passes, then a small node rides along it.
//   HA4  "GitHub" chat bubbles pop out of the three robots one after another on "keep mentioning"; the slab bobs once.
//   Hand-off (the last word's tail plus the silent frames, about 18 frames, one continuous eased flip; ./HA/handoff):
//     A  the slab heads for BodyA's GitHub chip while everything turns away; BodyA's stack card comes round on their
//        back with the slab's back face, the white GitHub chip, riding on its chip slot.
//     B  the three Claude chips lift off the laptops, converge and turn; BodyB's terminal card comes round with the
//        merged chip riding on its corner Claude chip.
//     C  the middle laptop comes forward and grows into BodyC's laptop while everything else turns away; its screen
//        becomes the to-do app and the '1 copy' pill pops on its lid.
//   On the last hook frame only the body's FirstCard (t = 0) is drawn, untransformed, camera at identity.
// SMOOTHNESS: every value eases in and out (EASE.travel / sine bumps), entrances 14-20 frames, pops 12-14, the flip
// about 18, camera moves 22-24; drifts are sines of the frame (periods 64-120).
// Every frame from ../timing (group-local). The shell draws the overlay band (y 290-440) and the CRT pass.
// World px (the shell pads by 0.9 about 540 x 758.5): hook box on screen y 460-1240 = world y 427-1293.
// ===========================================================================

/** the slab's pose (visual centre, scale) in the top row, a little left so two bubbles fit on its right; P1.s is the
 *  scale the card offset was measured at */
const P1 = { s: 2.7 };
const P2 = { cx: 490, cy: 578, s: 1.35 };
/** the paper card behind the slab (HA1 size) and its centre offset from the slab centre at P1 */
const CARD = { w: 800, h: 560, dx: 22, dy: -20 };
/** the stage sheet under the robot row (from frame 0) */
const BACK2 = { cx: 540, cy: 940, w: 1010, h: 440, rot: -1 };
/** HA4 bubbles: rest positions (top-left), tails; pop order left, middle, right robot */
const BUBBLES = [
  { x: 52, y: 596, tail: "right" as const },
  { x: 712, y: 462, tail: "left" as const },
  { x: 742, y: 596, tail: "left" as const },
];
const BUBBLE_FS = 40;
/** the wire under the row */
const WX0 = 60;
const WX1 = 1020;

type SlabPose = { cx: number; cy: number; s: number; ry: number; sx?: number; sy?: number };

/** the slab at a pose (centre, scale, 3D turn), with an optional soft squash about its bottom edge */
const SlabAt: React.FC<{ p: SlabPose; sheen?: number }> = ({ p, sheen }) => (
  <div
    style={{
      position: "absolute",
      left: p.cx - SLAB.w / 2,
      top: p.cy - SLAB.h / 2,
      width: SLAB.w,
      height: SLAB.h,
      transformOrigin: "50% 50%",
      transform: `perspective(1600px) rotateY(${p.ry.toFixed(2)}deg) scale(${p.s.toFixed(4)})`,
      willChange: "transform",
    }}
  >
    <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%", transform: p.sx || p.sy ? `scale(${(p.sx ?? 1).toFixed(4)},${(p.sy ?? 1).toFixed(4)})` : undefined }}>
      <GithubSlab sheen={sheen} />
    </div>
  </div>
);

export const HA: React.FC = () => {
  const f = useCurrentFrame();
  const body = bodyOf(useVariant()); // the body this hook hands off into: A (own video), B (AB), C (AC)
  const hk = useHook(["HA1", "HA2", "HA3", "HA4"], 18);
  const [s1, s2, s3, s4] = hk.spans;
  const { end, words } = hk;
  const last = end - 1;

  // ---- word cues (group-local), found in order on the transcript; fallbacks never fire on a healthy timeline
  let cursor = -Infinity;
  const cue = (re: RegExp, fb: number) => {
    const w = findWord(words, re, cursor);
    if (!w) return fb;
    cursor = w.f + 1;
    return w.f;
  };
  const githubAt = cue(/^github$/i, s1.end - 10);
  const andAt = cue(/^and$/i, s2.start);
  const whyAt = cue(/^why$/i, andAt + 6);
  const doesAt = cue(/^does$/i, whyAt + 6);
  const everyoneAt = cue(/^everyone$/i, doesAt + 6);
  const buildingAt = cue(/^building$/i, s3.start);
  const withAt = cue(/^with$/i, buildingAt + 8);
  const aiAt = cue(/^ai$/i, withAt + 8);
  const keepAt = cue(/^keep$/i, aiAt + 8);
  const mentioningAt = cue(/^mentioning$/i, s4.start);
  const itAt = cue(/^it$/i, mentioningAt + 10);
  // the hand-off: one flip from the word "it?" through the silent frames (14-20 frames), landing on the last frame
  const ho = Math.min(end - 14, Math.max(end - 20, itAt));
  const H = handoffClock(f, ho, end);

  // ---- frame 0 is the poster (Victor's covers are frame 0): the slab at rest on its card in the top row, the three
  // robots at their laptops on the stage under it, the first caption word fully on. From frame 0 the scene settles
  // (a 20-frame eased camera settle, the card easing its lean) and breathes.
  const settle0 = io(f, 0, 20);
  // HA1: on "GitHub" the slab lifts a little off its card while a matte sheen crosses it; the card flutters
  const sheen = f >= githubAt - 2 && f < githubAt + 20 ? io(f, githubAt - 2, githubAt + 20) : -1;
  const lift = -12 * bump(f, githubAt - 3, 22);
  const bobIt = -10 * bump(f, mentioningAt - 2, 18);
  const dS = drift(f, 2.5, 110, 1);
  const breathe = 1 + 0.004 * Math.sin((f / 64) * Math.PI * 2);
  const slab: SlabPose = {
    cx: P2.cx + dS.x,
    cy: P2.cy + dS.y + bobIt + lift,
    s: P2.s * breathe,
    ry: mix(5, 8, settle0),
  };
  const cardK = 0.45;
  const cardC = { x: slab.cx + CARD.dx * (slab.s / P1.s), y: P2.cy + dS.y * 0.6 + CARD.dy * (slab.s / P1.s) };
  const cardRot = mix(-5, -4, settle0);
  const cardJolt = 2 * bump(f, githubAt + 4, 16);
  const back = BACK2;

  // ---- HA2: the robots are already at their laptops; each one hops (lifts 18 px and settles, 16 frames) on its
  // spoken word ("why", "does", "everyone") and the stage flutters as it comes back down
  const hops = [whyAt - 2, doesAt - 2, everyoneAt - 2];
  const hopY = (i: number) => -18 * bump(f, hops[i], 16);
  const chips = [buildingAt, withAt, aiAt];
  const leanP = io(f, buildingAt - 2, buildingAt + 14);
  const LEAN = [6, -2, -6];
  const LIFT = [0, 3, 0];
  const flutter = hops.reduce((a, at) => a + 1.4 * bump(f, at + 8, 12), 0);
  // the wire draws once, eased, at most 900 px per 30 frames; a node pops where the tip passes each laptop
  const wA = buildingAt - 3;
  const wB = Math.max(aiAt + 12, wA + Math.ceil(((WX1 - WX0) / 900) * 30));
  const tipX = (fr: number) => mix(WX0, WX1, io(fr, wA, wB));
  const passAt = (x: number) => {
    for (let t = wA; t <= wB; t += 0.25) if (tipX(t) >= x) return t;
    return wB;
  };
  const nodeAt = ROW_X.map((x) => passAt(x) - 2);
  const pulse = wirePulse(f, wB + 2, WX0 + 20, WX1 - 20, 64);

  // ---- captions: one line per shot; "keep" (end of HA3) opens the last block; the first word lands on frame 0
  const w1 = useWords("HA1");
  const w2 = useWords("HA2");
  const w3 = useWords("HA3");
  const w4 = useWords("HA4");
  const isKeep = (w: { w: string }) => /^keep/i.test(w.w.replace(/[^\w]/g, ""));
  // frame 0 (the cover) has an empty caption lane: the first word's reveal starts on frame 1, fully on by frame 11
  const l1: CapWord[] = cap1(restyle(toLine(w1), /^GitHub$/, "bi")).map((tk, i) => (i === 0 ? { ...tk, at: 1 } : tk));
  const l2: CapWord[] = restyle(toLine(w2), /^everyone$/, "bi");
  const l3: CapWord[] = restyle(toLine(w3.filter((w) => !isKeep(w))), /^AI$/, "bi");
  const l4: CapWord[] = restyle(toLine([...w3.filter(isKeep), ...w4]), /^mentioning$/, "bi");
  // the last line fades out (5 frames) while "it?" is still being said, before anything of the hand-off reaches it
  const lastExit = Math.min(itAt + 2, ho + 3);

  // ---- camera: hold-move-hold, moves 22-24 frames, drifts between; at identity before the hand-off, still during it
  // (zooms about a low point, y 1100, so the wire stays above the caption; hooks track sideways)
  const keys = camPath(hookPose({ x: 540, y: 1100 }, 1.025))
    .to(0, hookPose({ x: 540, y: 1100 }, 1.0), 20) // frame 0: the poster settles (20 frames, eased)
    .to(githubAt - 3, hookPose({ x: 540, y: 1100 }, 1.02, -30), 22) // HA1: lean toward the slab as it lifts on "GitHub"
    .to(andAt - 2, hookPose({ x: 540, y: 1100 }, 1.0), 24) // HA2: back to the whole row as the robots hop
    .push(ho - 24, 0.02) // HA3-HA4: slow push about the row
    .to(ho - 24, HOOK_ID, 22) // identity before the hand-off; no move during it
    .hold(end).keys;

  // ---- hand-off geometry
  const cardRect: Rect = { x: cardC.x - (CARD.w * cardK) / 2, y: cardC.y - (CARD.h * cardK) / 2, w: CARD.w * cardK, h: CARD.h * cardK };
  const backRect: Rect = { x: back.cx - back.w / 2, y: back.cy - back.h / 2, w: back.w, h: back.h };
  const round = comeRound(H.tIn);
  // A: BodyA's GitHub chip slot; B: BodyB's corner Claude chip; C: the middle laptop grows into BodyC's laptop box
  const slotA = { x: FCA.chipX, y: FCA.githubY };
  const slotB = { x: FCB.chip.cx, y: FCB.chip.cy };
  const midLap = rowGeom(ROW_X[1]).lap;
  // the riders (A's slab, B's chips) travel over the whole window and land on their slot as projected on the card at
  // this frame (the card turning in), so they arrive exactly where the card's own chip is, at zero velocity
  const ride = io(f, ho, last - 1);
  const slotANow = projectRound(slotA, round.deg, round.s);
  const slotBNow = projectRound(slotB, round.deg, round.s);

  // the slab during the hand-off: A rides (no turn) onto BodyA's GitHub chip, shrinking to cover it, and dissolves into
  // it over the last 8 frames; B and C turn it away with the rest
  let slabH: SlabPose = slab;
  let slabO = 1;
  if (H.started) {
    if (body === "A") {
      // a leftward arc keeps it clear of the card's labels while the card turns in; it reaches chip size early
      slabH = {
        cx: mix(slab.cx, slotANow.x, ride) - 70 * Math.sin(Math.PI * ride),
        cy: mix(slab.cy, slotANow.y, ride),
        s: mix(slab.s, 0.95 * round.s * slotANow.k, io(f, ho, ho + 11)),
        ry: mix(slab.ry, 0, ride),
      };
      slabO = 1 - io(f, last - 8, last - 1);
    } else {
      // B, C: the slab folds away about its left edge with the rest (its centre slides toward that edge as it turns)
      const half = (SLAB.w / 2) * slab.s;
      const turn = mix(slab.ry, 90, H.tOut);
      slabH = { ...slab, cx: slab.cx - half + half * Math.cos((turn * Math.PI) / 180), s: slab.s * mix(1, 0.92, H.tOut), ry: turn };
    }
  }
  const turnTf = H.started ? turnAwayTf(H.tOut) : undefined;
  const rowTf = turnTf;
  const cardTf = turnTf;
  const backTf = turnTf;
  const rowC = hingeOf(ROW_RECT);
  const cC = hingeOf(cardRect);
  const bC = hingeOf(backRect);
  const hookShown = !H.last && H.objShown; // the hook's objects until they are edge-on
  const slabShown = !H.last && (body === "A" ? slabO > 0.001 : H.objShown);
  const cardOn = H.cardShown && !H.last; // the body's card coming round

  // B: the three Claude chips fly from their screens to the slot (they leave the row as the hand-off starts)
  const chipFly = body === "B" && H.started && !H.last;
  // C: the middle laptop leaves the row as the hand-off starts and grows into BodyC's laptop (14 frames, eased)
  const lapFly = body === "C" && H.started && !H.last;
  const lp = io(f, ho + 2, last);
  const dMid = drift(f, 2, 79, 4); // the middle robot's bob, so the laptop leaves the row without a jump
  const lapBox = { x: mix(midLap.x + dMid.x, LAP_C.x, lp), y: mix(midLap.y + dMid.y, LAP_C.y, lp), w: mix(midLap.w, LAP_C.w, lp), h: mix(midLap.h, LAP_C.h, lp) };
  const lapK = lapBox.w / LAP_C.w;
  const appIn = io(f, ho + 5, last - 1);
  const pillP = io(f, last - 12, last);

  return (
    <AbsoluteFill>
      <Camera box="hook" keys={keys} blur={false} hud={<CaptionBlocks f={f} blocks={[[l1], [l2], [l3], [l4]]} lastExit={lastExit} />}>
        {/* the body's first card comes round from behind the turning hook objects (A, B) */}
        {body === "A" && cardOn ? <FirstCardA t={f - last} tf={round.tf} /> : null}
        {body === "B" && cardOn ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${HO_POINT.x}px ${HO_POINT.y}px`, transform: round.tf }}>
            <FirstCardB t={f - last} />
          </div>
        ) : null}
        {hookShown ? (
          <>
            {/* back layer (0.7): the big sheet behind the card in HA1, the stage under the robot row from HA2 */}
            <Depth k={0.7}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${bC.x}px ${bC.y}px`, transform: backTf }}>
                <Sheet id="ha-back" cx={back.cx} cy={back.cy + flutter} w={back.w} h={back.h} rot={back.rot} sheets={1} />
              </div>
            </Depth>

            {/* middle layer (0.85): the paper card behind the slab (leans 6 deg and 8 deg in 3D; shrinks into the top row) */}
            <Depth k={0.85}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${cC.x}px ${cC.y}px`, transform: cardTf }}>
                <PaperCard
                  x={cardC.x - CARD.w / 2}
                  y={cardC.y - CARD.h / 2 + cardJolt}
                  w={CARD.w}
                  h={CARD.h}
                  sheets={2}
                  tilt={-4}
                  tf={`rotate(${cardRot.toFixed(3)}deg) scale(${cardK.toFixed(4)})`}
                >
                  <PaperGrain id="ha-card" />
                </PaperCard>
              </div>
            </Depth>

            {/* the robot row, its wire and the bubbles (they turn over as one sheet in the hand-off) */}
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${rowC.x}px ${rowC.y}px`, transform: rowTf }}>
              {f >= wA ? <WirePath d={`M${WX0} ${WIRE_Y} L${WX1} ${WIRE_Y}`} p={(tipX(f) - WX0) / (WX1 - WX0)} /> : null}
              {ROW_X.map((x, i) => (
                <PopNode key={i} cx={x} cy={WIRE_Y} at={nodeAt[i]} />
              ))}
              {pulse ? (
                <div
                  style={{
                    position: "absolute",
                    left: pulse.x - 9,
                    top: WIRE_Y - 9,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: theme.color.ink,
                    opacity: pulse.o,
                    boxShadow: "4px 6px 5px rgba(0,0,0,.22)",
                  }}
                />
              ) : null}
              {ROW_X.map((x, i) => (
                <RobotAtLaptop
                  key={i}
                  f={f}
                  i={i}
                  cx={x}
                  at={-30}
                  chipAt={chips[i]}
                  lean={LEAN[i] * leanP}
                  lift={LIFT[i] * leanP}
                  bob={(() => {
                    const d = drift(f, 2, 70 + i * 9, i + 3);
                    return { x: d.x, y: d.y + hopY(i) };
                  })()}
                  hideLaptop={lapFly && i === 1}
                  hideChip={chipFly}
                />
              ))}
              {BUBBLES.map((b, i) => {
                const g = rowGeom(ROW_X[i]);
                return <Bubble key={i} text="GitHub" x={b.x} y={b.y} ox={g.head.x} oy={g.head.y} at={keepAt - 2 + 5 * i} dur={14} tail={b.tail} fs={BUBBLE_FS} seed={i} exitAt={ho} />;
              })}
            </div>
          </>
        ) : null}

        {/* the slab (turns away with the rest in the hand-off; A: heading for BodyA's GitHub chip) */}
        {slabShown && body !== "A" ? <SlabAt p={H.started ? slabH : slab} sheen={sheen} /> : null}

        {/* ---------------- hand-off A: BodyA's stack card comes round, the slab's back face (the white GitHub chip)
            riding on its chip slot, concentric and bigger than the card's own chip until it lands */}
        {body === "A" && H.last ? <FirstCardA t={0} /> : null}
        {/* A's slab rides in front of everything and dissolves into the card's own GitHub chip */}
        {slabShown && body === "A" ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: slabO }}>
            <SlabAt p={H.started ? slabH : slab} sheen={sheen} />
          </div>
        ) : null}

        {/* ---------------- hand-off B: the three Claude chips lift off the laptops, converge and turn away; BodyB's
            terminal card comes round on the back of the turning row and slab with the merged chip riding on its corner
            chip slot (concentric and bigger until it lands, so the card's own chip never shows twice) */}
        {body === "B" && H.last ? <FirstCardB t={0} /> : null}
        {chipFly
          ? ROW_X.map((x, i) => {
              const c = chipCentre(x);
              const d = drift(f, 2, 70 + i * 9, i + 3); // the row's bob, so the chip leaves its screen without a jump
              const cx = mix(c.x + d.x, slotBNow.x, ride);
              const cy = mix(c.y + d.y, slotBNow.y, ride) - 60 * Math.sin(Math.PI * ride);
              // always a little bigger than the card's own (turning) chip under it, equal on the last frames
              const r = mix(CHIP_R, FCB.chip.r * round.s * slotBNow.k * mix(1.15, 1, H.tIn), ride);
              // the three merge into one: the two followers fade once they overlap the leader
              const o = i === 1 ? 1 : 1 - io(f, last - 7, last - 2);
              return o > 0.001 ? (
                <div key={i} style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, opacity: o, willChange: "transform" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 2 * CHIP_R, height: 2 * CHIP_R, transformOrigin: "0 0", transform: `scale(${(r / CHIP_R).toFixed(4)})` }}>
                    <LogoDisc name="Claude" src={HA_LOGO.claude} r={CHIP_R} />
                  </div>
                </div>
              ) : null;
            })
          : null}

        {/* ---------------- hand-off C: the middle laptop comes forward and grows into BodyC's laptop; its screen becomes
            the to-do app and the '1 copy' pill pops on its lid */}
        {body === "C" && H.last ? <FirstCardC t={0} /> : null}
        {lapFly ? (
          <>
            <div style={{ position: "absolute", left: lapBox.x, top: lapBox.y, width: lapBox.w, height: lapBox.h, willChange: "transform" }}>
              {HA_PHOTO.laptop ? <Img src={HA_PHOTO.laptop} style={{ width: "100%", height: "100%", objectFit: "fill", filter: theme.shadow.cutout }} /> : null}
            </div>
            {/* the Claude chip rides the screen while the app comes up over it */}
            {(() => {
              const k = lapBox.w / midLap.w;
              const sx = lapBox.x + LAPTOP_SCREEN.cx * lapBox.w;
              const sy = lapBox.y + LAPTOP_SCREEN.cy * lapBox.h - 6 * k;
              const r = CHIP_R * (k * 0.6 + 0.4);
              const o = 1 - appIn;
              return o > 0.001 ? (
                <div style={{ position: "absolute", left: sx - r, top: sy - r, width: 2 * r, height: 2 * r, opacity: o }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: 2 * CHIP_R, height: 2 * CHIP_R, transformOrigin: "0 0", transform: `scale(${(r / CHIP_R).toFixed(4)})` }}>
                    <LogoDisc name="Claude" src={HA_LOGO.claude} r={CHIP_R} />
                  </div>
                </div>
              ) : null;
            })()}
            {appIn > 0.001 ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: appIn }}>
                <LaptopC t={0} box={lapBox} shadow={false}>
                  <AppScreen t={0} />
                </LaptopC>
              </div>
            ) : null}
            {pillP > 0.001 ? (
              <InkPill
                cx={lapBox.x + (FCC.pill.cx - LAP_C.x) * lapK}
                cy={lapBox.y + (FCC.pill.cy - LAP_C.y) * lapK}
                rot={FCC.pill.rot}
                text={FCC.pill.text}
                fs={FCC.pill.fs}
                scale={lapK}
                p={pillP}
              />
            ) : null}
          </>
        ) : null}
      </Camera>
    </AbsoluteFill>
  );
};
