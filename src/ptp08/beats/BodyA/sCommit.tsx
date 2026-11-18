// A04a-A08a (world part): the project folder card and the instant camera (save = shutter + flash, commit = the print),
// the print growing into a snapshot of every file, linked to the one before it, five commits on one wire (the app's
// timeline), a prompt breaking the last one, Claude going back two nodes; in A08a the whole row shrinks toward the
// laptop's screen (sLaptop.tsx takes over on the screen).
import React from "react";
import { ChatBubble, EASE, INTER, LogoChip, MONO, WirePath, WireNode, mix, prog, theme } from "../../../paperstudio";
import { CH, COMMITS, CW, CommitCard } from "./commit";
import { PaperCard } from "../../../paperstudio";
import type { Cues } from "./cues";
import { CAMERA_PRINT, CAMERA_W, CAMERA_SLOT, FileTree, FolderCard, InstantCamera, RingMarker, cameraH } from "./objects";
import { LOGOS, PHOTOS } from "./assets";
import { MAIN_NODES, MAIN_Y, TimelineRow, cardCentre, type TLState } from "./timeline";
import { TerminalPrompt, typedChars } from "../BodyB/terminalPrompt";
import { pulse, SM } from "./util";
import { Sheets } from "./depth";
import { Pop } from "./pop";

/** world layout */
export const FOLDER = { x: 60, y: 650, w: 480, h: 500 } as const;
export const CAM = { cx: 800, cy: 850, w: CAMERA_W } as const;
const camH = cameraH(CAM.w);
const SLOT_Y = CAM.cy - camH / 2 + camH * CAMERA_SLOT;
/** where the print lands on the paper */
export const PRINT = { cx: 760, cy: 1190, rot: -4 } as const;
/** the snapshot photo (A05a) */
export const PHOTO = { cx: 520, cy: 950, w: 560, h: 520, rot: -1.5 } as const;
/** where the camera parks during A05a: behind the snapshot's upper right, smaller (the print in front of the camera that took it) */
export const CAM_PARK = { cx: 830, cy: 772, w: 300 } as const;
/** the group squeeze for the terminal (A07b) and the terminal itself */
export const SQUEEZE = { s: 1, ox: 540, oy: MAIN_Y } as const;
export const TERM = { x: 300, y: 1110, w: 790, h: 280 } as const;
export const CLAUDE_CHIP = { cx: 228, cy: 1222, r: 50 } as const;
/** the white stage card under the row (A05b-A07b) */
export const STAGE = { x: -800, y: 800, w: 2100, h: 380 } as const;

export const commitCues = (c: Cues) => {
  const a4 = c.s.A04a.start;
  const save = c.at("A04a", /^save$/, 30);
  const thats = c.at("A04a", /^that's$/, 60);
  const commit = c.at("A04a", /^commit$/, 80);
  const a5 = c.s.A05a.start;
  const every = c.at("A05a", /^every$/, 30);
  const tickAt = [0, 1, 2, 3, 4].map((i) => c.w.A05a[4 + i]?.f ?? every + i * 8);
  const a5b = c.s.A05b.start;
  const linked = c.at("A05b", /^linked$/, 2);
  const before = c.at("A05b", /^before$/, 30);
  const a6 = c.s.A06a.start;
  const land6 = [c.nth("A06a", 0, 2), c.at("A06a", /^up$/, 12), c.at("A06a", /^that's$/, 30)];
  const timeline = c.at("A06a", /^timeline$/, 60);
  const a7 = c.s.A07a.start;
  const prompt = c.at("A07a", /^prompt$/, 8);
  const breaks = c.at("A07a", /^breaks$/, 30);
  const a7b = c.s.A07b.start;
  const claude = c.at("A07b", /^claude$/, 8);
  const go = c.at("A07b", /^go$/, 20);
  const goWords = c.w.A07b.filter((w) => w.f >= go).map((w) => w.f);
  const lastW = c.at("A07b", /^last$/, 70);
  const worked = c.at("A07b", /^worked$/, 100);
  const a8 = c.s.A08a.start;
  const laptopW = c.at("A08a", /^laptop$/, 60);
  return { a4, save, thats, commit, a5, every, tickAt, a5b, linked, before, a6, land6, timeline, a7, prompt, breaks, a7b, claude, go, goWords, lastW, worked, a8, laptopW };
};
export type CommitCues = ReturnType<typeof commitCues>;

/** the snapshot photo: an instant print with a white border, the file tree photographed inside, the commit's hash and
 *  message written in the thick bottom margin */
const Snapshot: React.FC<{ f: number; q: CommitCues; w: number; h: number }> = ({ f, q, w, h }) => {
  const b = 26;
  const bottom = 104;
  // the whole tree (header + five lines, 470 px tall at 1x) fits the picture area
  const TREE_K = Math.min((w - 2 * b - 12) / 480, (h - b - bottom - 8) / 470);
  const ticks = q.tickAt.map((t) => prog(f, t, t + 8, SM));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "#FFFFFF", boxShadow: "3px 3px 0 #DCDCDC,5px 5px 0 #CFCFCF,18px 28px 50px rgba(0,0,0,.18),48px 70px 120px rgba(0,0,0,.10)" }} />
      <div style={{ position: "absolute", left: b, top: b, width: w - 2 * b, height: h - b - bottom, borderRadius: 4, overflow: "hidden", background: "linear-gradient(160deg,#F7F5F1 0%,#ECE9E3 100%)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06),inset 0 0 40px rgba(0,0,0,.06)" }}>
        <div style={{ position: "absolute", left: (w - 2 * b - 480 * TREE_K) / 2, top: 4, width: 480, transform: `scale(${TREE_K.toFixed(4)})`, transformOrigin: "0 0" }}>
          <FileTree w={480} ticks={ticks} />
        </div>
      </div>
      <div style={{ position: "absolute", left: b + 6, top: h - bottom + 14, fontFamily: MONO, fontWeight: 700, fontSize: 36, color: theme.color.ink }}>{COMMITS[2].hash}</div>
      <div style={{ position: "absolute", left: b + 6, top: h - bottom + 56, fontFamily: INTER, fontWeight: 500, fontSize: 32, color: "#444" }}>{COMMITS[2].msg}</div>
    </div>
  );
};

/** timeline states per node at frame f (A05b-A08a) */
export const rowStates = (f: number, q: CommitCues): TLState[] => {
  const land3 = prog(f, q.a5b - 2, q.a5b + 14, SM);
  const land2 = prog(f, q.land6[0], q.land6[0] + 14, SM);
  const land1 = prog(f, q.land6[1], q.land6[1] + 14, SM);
  const land0 = prog(f, q.land6[2], q.land6[2] + 14, SM);
  // the "timeline" ripple: nodes fill left to right
  const fill = (i: number) => pulse(f, q.timeline + i * 3, 16);
  const back = prog(f, q.worked - 2, q.worked + 16, EASE.cam);
  const greyLast = prog(f, q.worked, q.worked + 14, SM);
  return [
    { land: land0, fill: fill(0) },
    { land: land1, fill: fill(1) },
    { land: land2, fill: fill(2) },
    { land: land3, node: prog(f, q.linked - 4, q.linked + 8, SM), fill: fill(3), lift: 18 * back },
    {
      land: 1,
      node: prog(f, q.before - 6, q.before + 6, SM),
      fill: fill(4),
      crackAt: f >= q.breaks - 1 ? q.breaks : undefined,
      tilt: 6 * prog(f, q.breaks + 2, q.breaks + 20, EASE.cam),
      grey: greyLast,
    },
  ];
};

export type Squeeze = { tf: string; o: number; x0: number; x1: number };
/** layer "base" draws the scene; layer "top" draws only the timeline row while it flies onto the laptop's screen in
 *  A08a (drawn over the laptop, which LaptopScene draws between the two layers) */
export const CommitScene: React.FC<{ f: number; q: CommitCues; laptopSqueeze: (f: number) => Squeeze; layer?: "base" | "top" }> = ({ f, q, laptopSqueeze, layer = "base" }) => {
  if (f < q.a4 - 14 || f >= q.a8 + 40) return null;

  // ---- folder card and camera (A04a, leave in A05a)
  // the folder card arrives from the right in the same pan that takes the A03a text card off left (sIntro)
  const folderIn = prog(f, q.a4 - 10, q.a4 + 16, EASE.cam);
  const sheetsIn = prog(f, q.a4 - 14, q.a4 + 4, SM);
  const out5 = prog(f, q.a5, q.a5 + 18, SM);
  const folderX = 1300 * (1 - folderIn) - 760 * out5;
  const camIn = prog(f, q.a4 - 4, q.a4 + 22, EASE.cam);
  // the camera parks behind the snapshot during A05a, then slides off right in A05b
  const camPark = prog(f, q.a5 - 2, q.a5 + 16, EASE.cam);
  const camOut = prog(f, q.a5b - 4, q.a5b + 14, SM);
  const camX = 1300 * (1 - camIn) + 760 * camOut;
  const camCx = mix(CAM.cx, CAM_PARK.cx, camPark) + camX;
  const camCy = mix(CAM.cy, CAM_PARK.cy, camPark);
  const camW = mix(CAM.w, CAM_PARK.w, camPark);
  const flash = 0.7 * pulse(f, q.save + 1, 14);
  const press = pulse(f, q.save - 2, 12);
  const camBob = 3 * Math.sin((f - q.a4) / 13);

  // ---- the print: ejects (thats .. commit), drops to the paper on "commit", grows into the snapshot (A05a),
  // shrinks back to a card on the timeline (A05b)
  const eject = prog(f, q.thats - 2, q.thats + 12, SM);
  const drop = prog(f, q.commit - 1, q.commit + 13, EASE.cam);
  const grow = prog(f, q.a5 - 1, q.a5 + 15, EASE.cam);
  const back = prog(f, q.a5b - 2, q.a5b + 14, EASE.cam);
  const camLeft = CAM.cx + camX;
  const ejectY = mix(SLOT_Y - CH / 2 - 6, SLOT_Y + CH / 2 + 4, eject);
  // with the photo camera the commit face develops on its print (thats .. commit), then the print lifts off its
  // picture area on "commit"; the drawn camera ejects the card from its slot instead
  const photoCam = !!PHOTOS.camera;
  const camRot = -2 + 2 * camIn;
  const develop = photoCam ? prog(f, q.thats - 2, q.commit, SM) : 0;
  const printLeft = photoCam ? 1 - prog(f, q.commit - 2, q.commit + 8, SM) : 1;
  const pc = { x: CAM.cx + camX - CAM.w / 2 + CAMERA_PRINT.u * CAM.w, y: CAM.cy + camBob - camH / 2 + CAMERA_PRINT.v * camH };
  const p0 = photoCam ? { x: pc.x, y: pc.y, rot: CAMERA_PRINT.rot + camRot } : { x: camLeft, y: ejectY, rot: 0 };
  const s0 = photoCam ? 0.62 : 1;
  const p1 = { x: PRINT.cx, y: PRINT.cy, rot: PRINT.rot };
  const p2 = { x: PHOTO.cx, y: PHOTO.cy, rot: PHOTO.rot };
  const node4 = cardCentre(MAIN_NODES[4], MAIN_Y);
  const p3 = { x: node4.x, y: node4.y, rot: 0 };
  let px = mix(p0.x, p1.x, drop);
  let py = mix(p0.y, p1.y, drop) - 60 * Math.sin(Math.PI * drop);
  let prot = mix(p0.rot, p1.rot, drop);
  px = mix(px, p2.x, grow);
  py = mix(py, p2.y, grow);
  prot = mix(prot, p2.rot, grow);
  px = mix(px, p3.x, back);
  py = mix(py, p3.y, back);
  prot = mix(prot, p3.rot, back);
  // photo size: grows from the card size (340 x 128) to the photo (560 x 520) and back
  const photoK = grow * (1 - back);
  const showPrint = photoCam ? f >= q.commit - 1 : f >= q.thats - 2;
  const dropS = mix(s0, 1, drop);
  const cardO = 1 - prog(f, q.a5 - 1, q.a5 + 7, SM) + prog(f, q.a5b + 4, q.a5b + 12, SM);
  const photoO = prog(f, q.a5 + 1, q.a5 + 9, SM) * (1 - prog(f, q.a5b + 2, q.a5b + 10, SM));
  const pw = mix(CW, PHOTO.w, photoK);
  const ph = mix(CH, PHOTO.h, photoK);

  // ---- timeline (A05b on): row states, the linking wire, the full wire in A06a
  const st = rowStates(f, q);
  const linkP = prog(f, q.linked - 1, q.before + 2, EASE.travel);
  // A06a: the wire grows left to the next node in time for its card (600 px in 20+ frames), then on off the frame;
  // and right off the frame (wire draws stay under 900 px per 30 frames)
  const leftP = prog(f, q.land6[0] - 22, q.land6[0] - 2, EASE.travel);
  const farP = prog(f, q.land6[0] - 2, q.land6[0] + 52, EASE.travel);
  const rightP = prog(f, q.a6 - 6, q.a6 + 24, EASE.travel);
  const wideP = Math.min(leftP, farP, rightP);
  const inRow = f >= q.a5b - 4;
  // after the print has become card 4 the row draws it (the moving print hides)
  const printIsCard = f >= q.a5b + 14;
  st[4] = { ...st[4], opacity: printIsCard ? 1 : 0 };

  // ---- A07a: the prompt bubble; A07b: squeeze for the terminal, Claude chip, typing, the ring marker going back
  const sq = prog(f, q.a7b - 4, q.a7b + 18, EASE.cam);
  const k = mix(1, SQUEEZE.s, sq);
  const termIn = prog(f, q.a7b + 2, q.a7b + 18, SM);
  const typed = typedChars("go back to the last version that worked", q.goWords, f);
  const mk = prog(f, q.lastW - 2, q.worked + 4, EASE.cam);
  const n4 = MAIN_NODES[4].x;
  const n3 = MAIN_NODES[3].x;
  const markerX = mix(n4, n3, mk);
  const markerP = prog(f, q.lastW - 10, q.lastW, SM) * (1 - prog(f, q.a8 + 4, q.a8 + 16, SM));
  const bubbleOut = 1 - prog(f, q.a7b + 2, q.a7b + 10, SM);

  // ---- A08a: the row shrinks toward the laptop screen (sLaptop draws the inset)
  const lap = laptopSqueeze(f);

  const groupTf = `translate(${SQUEEZE.ox}px, ${SQUEEZE.oy}px) scale(${k.toFixed(4)}) translate(${-SQUEEZE.ox}px, ${-SQUEEZE.oy}px)`;

  // the stage sheets: under the folder card and the camera (A04a-A05a), one long sheet behind the timeline (A05b on)
  const rowSheet = prog(f, q.a5b - 6, q.a5b + 14, SM);
  const stageOut = prog(f, q.a8 - 4, q.a8 + 18, SM);
  const rowOnTop = f >= q.a8 - 2;
  const base = layer === "base";
  return (
    <>
      {base && f < q.a5b + 16 ? (
        <Sheets
          f={f}
          sheets={[
            { x: 24 + folderX, y: 606, w: 600, h: 620, rot: -3, tone: 1 },
            { x: 570 + camX, y: 640, w: 560, h: 560, rot: 4 },
          ]}
          dy={-24 * (1 - sheetsIn)}
          opacity={1 - rowSheet}
        />
      ) : null}
      {/* the row's stage (A05b-A07b): two paper sheets peeking behind at parallax and a long white stage card with a lean,
          sliding in under the first pair and dropping away as the laptop rises */}
      {base && rowSheet > 0.001 && stageOut < 0.999 ? (
        <>
          <Sheets
            f={f}
            sheets={[
              { x: -620, y: 690, w: 600, h: 640, rot: -4, tone: 1 },
              { x: 1060, y: 740, w: 560, h: 600, rot: 5 },
              { x: 330, y: 1150, w: 640, h: 420, rot: 2 },
            ]}
            dy={700 * (1 - rowSheet) + 900 * stageOut}
          />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(800 * (1 - rowSheet) + 900 * stageOut).toFixed(1)}px)` }}>
            <PaperCard x={STAGE.x} y={STAGE.y + 0.8 * Math.sin(f / 61)} w={STAGE.w} h={STAGE.h} sheets={2} tf={`perspective(2600px) rotateX(${(5 + 0.3 * Math.sin(f / 83)).toFixed(3)}deg)`} />
          </div>
        </>
      ) : null}
      {/* folder card and camera (the camera parks behind the snapshot in A05a) */}
      {base && f < q.a5b + 16 ? (
        <>
          {f < q.a5 + 20 ? <FolderCard x={FOLDER.x + folderX} y={FOLDER.y} w={FOLDER.w} h={FOLDER.h} flash={flash} sheets={1} /> : null}
          {/* the print sits behind the camera while it ejects */}
          {!photoCam && showPrint && drop < 0.5 ? (
            <CommitCard cx={px} cy={py} c={COMMITS[2]} rot={prot} opacity={cardO} />
          ) : null}
          <InstantCamera cx={camCx} cy={camCy + camBob} w={camW} press={press} flash={flash} rot={camRot + 6 * camPark} develop={develop} printO={printLeft} />
        </>
      ) : null}
      {/* the timeline (from A05b), squeezed in A07b, shrinking into the laptop in A08a (then on the top layer) */}
      {inRow && lap.o > 0.001 && (layer === "top") === rowOnTop ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `${lap.tf} ${groupTf}`, transformOrigin: "0 0", opacity: lap.o }}>
          {/* A05b: the link between the two cards; A06a: the wire runs off both edges */}
          {wideP < 0.999 ? (
            <>
              <WirePath d={`M${MAIN_NODES[3].x} ${MAIN_Y} L${MAIN_NODES[4].x} ${MAIN_Y}`} p={linkP} />
              <WirePath d={`M${MAIN_NODES[3].x} ${MAIN_Y} L${MAIN_NODES[2].x} ${MAIN_Y}`} p={leftP} />
              <WirePath d={`M${MAIN_NODES[2].x} ${MAIN_Y} L-1800 ${MAIN_Y}`} p={farP} />
              <WirePath d={`M${MAIN_NODES[4].x} ${MAIN_Y} L1800 ${MAIN_Y}`} p={rightP} />
            </>
          ) : null}
          <TimelineRow nodes={MAIN_NODES} states={st} wireP={wideP >= 0.999 ? 1 : 0} x0={lap.x0} x1={lap.x1} t={f} />
          <RingMarker cx={markerX} cy={MAIN_Y} p={markerP} />
          {f >= q.prompt - 1 && bubbleOut > 0.001 ? (
            <ChatBubble text="add dark mode" x={n4 - 400} y={MAIN_Y - 44 - 107} ox={n4} oy={MAIN_Y - 20} at={q.prompt - 2} dur={14} fs={44} tail="right" arc={40} opacity={bubbleOut} />
          ) : null}
        </div>
      ) : null}
      {/* the moving print / snapshot (above everything while it travels) */}
      {base && showPrint && (photoCam || !(drop < 0.5)) && !printIsCard ? (
        <>
          {cardO > 0.001 ? <CommitCard cx={px} cy={py} c={COMMITS[2]} rot={prot} opacity={Math.min(1, cardO) * (photoCam ? prog(f, q.commit - 2, q.commit + 6, SM) : 1)} s={(pw / CW) * (grow > 0 ? 1 : dropS)} /> : null}
          {photoO > 0.001 ? (
            <div style={{ position: "absolute", left: px - PHOTO.w / 2, top: py - PHOTO.h / 2, width: PHOTO.w, height: PHOTO.h, transform: `rotate(${prot.toFixed(3)}deg) scale(${(pw / PHOTO.w).toFixed(4)}, ${(ph / PHOTO.h).toFixed(4)})`, opacity: photoO }}>
              <Snapshot f={f} q={q} w={PHOTO.w} h={PHOTO.h} />
            </div>
          ) : null}
        </>
      ) : null}
      {/* A07b: the Claude chip and the terminal */}
      {base && termIn > 0.001 && f < q.a8 + 8 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${(1250 * prog(f, q.a8 - 16, q.a8 + 6, EASE.cam)).toFixed(1)}px, ${(320 * (1 - termIn)).toFixed(1)}px)` }}>
          <TerminalPrompt x={TERM.x} y={TERM.y} w={TERM.w} h={TERM.h} f={f} prompt="go back to the last version that worked" typed={typed} fs={38} welcome={false} hint={false} />
          <Pop at={Math.min(q.claude, q.a7b + 6) - 2} ox={CLAUDE_CHIP.cx} oy={CLAUDE_CHIP.cy}>
            <LogoChip cx={CLAUDE_CHIP.cx} cy={CLAUDE_CHIP.cy} r={CLAUDE_CHIP.r} name="Claude" src={LOGOS.claude} label={false} />
          </Pop>
        </div>
      ) : null}
      {void WireNode}
    </>
  );
};
