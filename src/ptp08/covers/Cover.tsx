// ===========================================================================
// GithubEp08Cover (AGENT COVERS, 2026-11-07): the Reel cover for each ep08 hook, a 1080 x 1920 still in the Paper
// Studio look built as a poster: one huge hero group, one headline, nothing else. Lit paper ground with the 135 px
// grid, one top-left light, floating shadows, one CRT pass over the finished frame.
//
//   A  "What actually IS GitHub?"   the charcoal GitHub slab tilted in 3D, a "?" card leaning on it, three robots at
//                                    laptops below saying "GitHub"
//   B  "One bad prompt wiped it ALL" the laptop with its screen cracked, the to-do app card half erased by the eraser
//                                    mid-sweep, rubber crumbs, the "add dark mode" bubble above
//   C  "What they actually mean"    three huge word chips (commit, push, branch) on a git-log wire, each with its
//                                    icon chip turning over, the robot peeking from behind the middle chip
//
// Readable things (headline, logo, bubbles, chip words) stay inside the Instagram safe box (x 65-1015, y 269-1248)
// and inside the centred 4:5 (y 285-1635) and 3:4 (y 240-1680) crops. Reel px.
// ===========================================================================
import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { CrtPass, Ground, INTER, META06, PaperCard, ShatterOverlay, WireNode, quadMatrix3d, theme, type P2, type Quad } from "../../paperstudio";
import { WordChip, wordChipSize } from "../beats/Shared/wordChip";
import { SolidIcon, type IconKind } from "../beats/HC/icons";
import { ASPECT, Bubble, COVER_ASSET, Crumbs, Headline, RobotAtLaptop, Slab, robotHead } from "./parts";

export type CoverProps = { hook: "A" | "B" | "C" };

// =================================================================== A
const CoverA: React.FC = () => {
  // the slab, huge, a little left of centre so the "?" card can lean on its right side
  const slabW = 392;
  const slab = { x: 264, y: 624 };
  // the robot row along the bottom (heads under the bubble row, bodies and laptops below the safe box)
  const row = { bottom: 1632, lapW: 264, robotH: 328 };
  const xs = [196, 540, 884];
  const leans = [6, 0, -6];
  const heads = xs.map((cx) => robotHead(cx, row.bottom, row.lapW, row.robotH));
  return (
    <>
      <Headline
        top={304}
        size={136}
        lines={[
          [{ t: "What" }, { t: "actually" }],
          [{ t: "IS", key: true }, { t: "GitHub?" }],
        ]}
      />
      <Slab w={slabW} x={slab.x} y={slab.y} tf="perspective(1600px) rotateY(-12deg) rotateX(5deg) rotate(-2deg)" />
      {/* the "?" card leaning on the slab's right side (its top tips toward the slab) */}
      <PaperCard x={640} y={704} w={272} h={344} sheets={1} tf="rotate(-8deg)">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: 272,
            lineHeight: 1,
            letterSpacing: -6,
            color: theme.color.ink,
            paddingTop: 12,
          }}
        >
          ?
        </div>
      </PaperCard>
      {/* the three robots at their laptops, leaning toward the slab */}
      {xs.map((cx, i) => (
        <RobotAtLaptop key={i} cx={cx} bottom={row.bottom} lapW={row.lapW} robotH={row.robotH} lean={leans[i]} />
      ))}
      {/* one bubble over each robot, tails down to the heads */}
      {heads.map((h, i) => (
        <Bubble key={i} text="GitHub" cx={h.x} y={1096} fs={46} tail="center" />
      ))}
    </>
  );
};

// =================================================================== B
/** the laptop cut-out with content on its glass (the ep06 measured screen quad), drawn at size */
const LaptopGlass: React.FC<{ x: number; y: number; w: number; children: React.ReactNode }> = ({ x, y, w, children }) => {
  const h = w / ASPECT.laptop;
  const GW = 1600;
  const GH = 1000;
  const q = META06.laptop.quad.map(([u, v]) => [u * w, v * h] as P2) as Quad;
  const m = quadMatrix3d(GW, GH, q);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, filter: theme.shadow.cutout }}>
        {COVER_ASSET.laptop ? <Img src={COVER_ASSET.laptop} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} /> : null}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: GW, height: GH, transformOrigin: "0 0", transform: m, background: "#141518", overflow: "hidden" }}>
        {children}
        {/* glass: a soft diagonal sheen from the top-left light, an inner edge */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(118deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.04) 30%, rgba(255,255,255,0) 46%)" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(0,0,0,.55), inset 0 0 40px rgba(0,0,0,.35)" }} />
      </div>
    </div>
  );
};

const ROWS = ["buy groceries", "reply to emails", "book flights"];

/** the to-do app's face (title bar, three ticked rows), card px; `ghost` = the erased version (pale, no ink) */
const TodoFace: React.FC<{ w: number; h: number; ghost?: boolean }> = ({ w, h, ghost }) => {
  const ink = ghost ? "#EAE8E6" : theme.color.ink;
  const rowY = (i: number) => 118 + i * 92;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 84, background: ghost ? "#FAFAFA" : "#F3F3F3", borderBottom: `3px solid ${ghost ? "#F2F2F2" : "#E3E3E3"}` }} />
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", left: 28 + k * 34, top: 33, width: 20, height: 20, borderRadius: 10, background: ghost ? "#EEEEEE" : "#CFCFCF" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 14, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 50, letterSpacing: -1.5, color: ink }}>to-do</div>
      {ROWS.map((label, i) => (
        <div key={label} style={{ position: "absolute", left: 34, top: rowY(i), width: w - 68, height: 78, borderBottom: `3px solid ${ghost ? "#F6F6F6" : "#EEEEEE"}` }}>
          <div style={{ position: "absolute", left: 0, top: 12, width: 52, height: 52, borderRadius: 26, background: ink }}>
            {ghost ? null : (
              <svg width={52} height={52} viewBox="0 0 72 72" style={{ position: "absolute", left: 0, top: 0 }}>
                <path d="M21 37 L32 48 L52 26" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ position: "absolute", left: 74, top: 10, fontFamily: INTER, fontWeight: 700, fontSize: 46, letterSpacing: -1.2, color: ink, whiteSpace: "nowrap" }}>{label}</div>
        </div>
      ))}
    </div>
  );
};

const CoverB: React.FC = () => {
  // the laptop, big, left of centre
  const lap = { x: 24, y: 696, w: 960 };
  // the to-do card on the paper in front of the laptop's right side, half erased
  const card = { x: 560, y: 952, w: 432, h: 424, rot: 5 };
  // the erase boundary in card px: a steep line (the eraser's long axis), erased to its left
  const ang = -71.5; // deg, the eraser's long axis on the card
  const k = Math.cos((ang * Math.PI) / 180) / Math.sin((ang * Math.PI) / 180); // dx per dy
  const bx = (yy: number) => 210 + (yy - card.h / 2) * k;
  const yT = -40;
  const yB = card.h + 40;
  const keep = `polygon(${bx(yT)}px ${yT}px, ${card.w + 60}px ${yT}px, ${card.w + 60}px ${yB}px, ${bx(yB)}px ${yB}px)`;
  const gone = `polygon(-60px ${yT}px, ${bx(yT)}px ${yT}px, ${bx(yB)}px ${yB}px, -60px ${yB}px)`;
  // the eraser (ep07 eraser.png): its long axis is at -11.5 deg in the photo and about 92% of the width
  const eW = 460;
  const eH = eW / ASPECT.eraser;
  const eC = { x: bx(card.h * 0.42) + 26, y: card.h * 0.42 };
  return (
    <>
      <Headline
        top={304}
        size={136}
        lines={[
          [{ t: "One" }, { t: "prompt" }],
          [{ t: "wiped" }, { t: "it" }, { t: "ALL", key: true }],
        ]}
      />
      <LaptopGlass x={lap.x} y={lap.y} w={lap.w}>
        {/* the app after the bad prompt: gone dark, rows greyed out */}
        <div style={{ position: "absolute", left: 120, top: 150, width: 860, height: 700, borderRadius: 30, background: "#202125", boxShadow: "0 0 0 2px rgba(255,255,255,.06)" }}>
          <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 110, borderBottom: "3px solid #2C2D31", background: "#1B1C1F", borderRadius: "30px 30px 0 0" }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 70, top: 180 + i * 130, width: 72, height: 72, borderRadius: 36, background: "#34353A" }} />
          ))}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 180, top: 200 + i * 130, width: 420 - i * 70, height: 32, borderRadius: 16, background: "#2D2E33" }} />
          ))}
        </div>
        {/* the crack web over the glass (drawn at half size and scaled 2x, so its lines read at thumbnail size) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 800, height: 500, transform: "scale(2)", transformOrigin: "0 0" }}>
          <ShatterOverlay x={0} y={0} w={800} h={500} ox={470} oy={200} seed={11} at={-30} radius={0} />
        </div>
      </LaptopGlass>
      {/* rubber crumbs that rolled off the card onto the paper */}
      <Crumbs
        fields={[
          { x: 512, y: 1352, w: 216, h: 96, n: 16, seed: 3, minS: 8, maxS: 15, pink: 0.45 },
          { x: 464, y: 1432, w: 264, h: 88, n: 9, seed: 9, minS: 6, maxS: 12, pink: 0.35 },
        ]}
      />
      {/* the to-do card: crisp right of the eraser, erased to pale paper behind it */}
      <div style={{ position: "absolute", left: card.x, top: card.y, width: card.w, height: card.h, transform: `rotate(${card.rot}deg)`, transformOrigin: "50% 50%" }}>
        <PaperCard x={0} y={0} w={card.w} h={card.h} sheets={1}>
          <div style={{ position: "absolute", inset: 0, clipPath: gone }}>
            <TodoFace w={card.w} h={card.h} ghost />
            {/* rubbing marks along the stroke */}
            <svg width={card.w} height={card.h} style={{ position: "absolute", left: 0, top: 0 }}>
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={bx(-20) - 40 - i * 46}
                  y1={-20}
                  x2={bx(card.h + 20) - 40 - i * 46}
                  y2={card.h + 20}
                  stroke="rgba(0,0,0,.035)"
                  strokeWidth={30 - i * 4}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: keep }}>
            <TodoFace w={card.w} h={card.h} />
          </div>
        </PaperCard>
        {/* crumbs on the erased half, along the eraser's trailing edge */}
        <Crumbs fields={[{ x: bx(card.h * 0.5) - 120, y: 40, w: 110, h: card.h - 60, n: 14, seed: 21, minS: 6, maxS: 12, pink: 0.45 }]} />
        {/* the eraser mid-sweep, lying on the card along the boundary */}
        <div
          style={{
            position: "absolute",
            left: eC.x - eW / 2,
            top: eC.y - eH / 2,
            width: eW,
            height: eH,
            filter: "drop-shadow(0 0 1px rgba(255,255,255,.9)) drop-shadow(8px 12px 7px rgba(0,0,0,.20)) drop-shadow(24px 36px 24px rgba(0,0,0,.20))",
          }}
        >
          <div style={{ position: "absolute", inset: 0, transform: `rotate(${(ang + 11.5).toFixed(2)}deg)` }}>
            {COVER_ASSET.eraser ? <Img src={COVER_ASSET.eraser} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} /> : null}
          </div>
        </div>
      </div>
      {/* the bad prompt */}
      <Bubble text="add dark mode" cx={352} y={624} fs={50} tail="right" />
    </>
  );
};

// =================================================================== C
/** a white logo-style button holding a solid icon, caught half way through its turn (rotateY), with its thickness */
const FlipDisc: React.FC<{ cx: number; cy: number; r: number; icon: IconKind; turn: number }> = ({ cx, cy, r, icon, turn }) => {
  const rim = Math.round(r * 0.2);
  const depth = Math.round(r * 0.16);
  return (
    <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, perspective: 900 }}>
      {/* the shadow stays flat on the paper (down-right), squeezed by the turn */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          transform: `translate(${r * 0.2}px, ${r * 0.3}px) scaleX(${Math.cos((turn * Math.PI) / 180).toFixed(3)})`,
          background: "rgba(0,0,0,.20)",
          filter: `blur(${Math.round(r * 0.22)}px)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${turn}deg)` }}>
        {/* thickness: a stack of rims behind the face */}
        {Array.from({ length: depth }, (_, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", background: i < depth - 1 ? "#D5D3D1" : "#C9C7C5", transform: `translateZ(${-(i + 1)}px)` }} />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "inset 0 2px 0 #fff, inset 0 -4px 6px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.05)",
          }}
        >
          <div style={{ position: "absolute", inset: rim, borderRadius: "50%", background: "#fff", boxShadow: "inset 0 3px 5px rgba(0,0,0,.10), inset 0 -2px 2px rgba(255,255,255,.7)" }}>
            <SolidIcon kind={icon} cx={r - rim} cy={r - rim} h={r * 0.98} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CoverC: React.FC = () => {
  const spineX = 208;
  const rows = [
    { word: "commit", icon: "camera" as IconKind, y: 736, minW: 704 },
    { word: "push", icon: "push" as IconKind, y: 960, minW: 0 },
    { word: "branch", icon: "branch" as IconKind, y: 1184, minW: 704 },
  ];
  const chipSize = 116;
  const chipH = Math.round(chipSize * 1.72);
  const chipX = 276; // chips' left edge (the disc overlaps its rounded end)
  const discR = 100;
  // the robot stands behind the column; only its head shows, in the notch right of the short "push" chip
  const rh = 400;
  const rw = rh * ASPECT.robot;
  const robot = { x: 680, y: 872 };
  const hideBelow = rows[2].y - chipH / 2 + 28;
  return (
    <>
      <Headline
        top={304}
        size={136}
        lines={[
          [{ t: "What" }, { t: "they" }],
          [{ t: "actually", key: true }, { t: "mean" }],
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: robot.x - 120,
          top: robot.y - 160,
          width: rw + 300,
          height: hideBelow - robot.y + 160,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 calc(100% - 16px), transparent 100%)",
          maskImage: "linear-gradient(180deg, #000 0%, #000 calc(100% - 16px), transparent 100%)",
        }}
      >
        <div style={{ position: "absolute", left: 120, top: 160, width: rw, height: rh, transform: "rotate(8deg)", transformOrigin: "50% 40%" }}>
          {COVER_ASSET.robot ? <Img src={COVER_ASSET.robot} style={{ width: "100%", height: "100%", objectFit: "contain", filter: theme.shadow.cutout }} /> : null}
        </div>
      </div>
      {/* the git-log spine: a thick raised wire, a stub into each chip, a hollow node at each end */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: theme.shadow.wire }}>
        <defs>
          <linearGradient id="cov-hist" x1="0" y1="1338" x2="0" y2="1584" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={theme.color.ink} stopOpacity={0.9} />
            <stop offset="1" stopColor={theme.color.ink} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`M${spineX} ${rows[0].y} V1316`} stroke={theme.color.ink} strokeWidth={10} strokeLinecap="round" fill="none" />
        {/* the older history fading out below */}
        <path d={`M${spineX} 1338 V1584`} stroke="url(#cov-hist)" strokeWidth={10} fill="none" />
        <circle cx={spineX} cy={1424} r={13} fill={theme.color.node} stroke={theme.color.ink} strokeWidth={6} opacity={0.5} />
        <circle cx={spineX} cy={1512} r={11} fill={theme.color.node} stroke={theme.color.ink} strokeWidth={5} opacity={0.22} />
      </svg>
      <WireNode cx={spineX} cy={1320} r={18} ring={7} />
      {rows.map((r) => {
        const w = Math.max(r.minW, wordWidth(r.word, chipSize));
        return <WordChip key={r.word} word={r.word} size={chipSize} minW={r.minW} x={chipX + w / 2} y={r.y} />;
      })}
      {rows.map((r) => (
        <FlipDisc key={r.word} cx={spineX} cy={r.y} r={discR} icon={r.icon} turn={-34} />
      ))}
    </>
  );
};

/** WordChip's own width for a word */
const wordWidth = (w: string, size: number) => wordChipSize(w, size).w;

// =================================================================== root
export const GithubEp08Cover: React.FC<CoverProps> = ({ hook }) => (
  <CrtPass>
    <AbsoluteFill>
      <Ground />
      {hook === "A" ? <CoverA /> : hook === "B" ? <CoverB /> : <CoverC />}
    </AbsoluteFill>
  </CrtPass>
);
