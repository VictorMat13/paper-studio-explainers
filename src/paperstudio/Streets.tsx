import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { EASE, INTER, mix, prog, theme } from "./theme";
import { Enter, Exit, enterState } from "./motion";
import { PaperCard } from "./PaperCard";
import { PHOTO05, ROBOT_ASPECT, keyed } from "./kit05";
import { P2, hash01, polyAt, polyD, polyLen, polyUpTo } from "./kit06";

// ------------------------------------------------------------- street geometry
/** grid point (column, row) on the street grid; streets run at c = 1..cols and r = 1..rows */
export type GridPt = [number, number];
export const streetGeom = (w: number, h: number, cols = 5, rows = 7) => {
  const gx = w / (cols + 1);
  const gy = h / (rows + 1);
  return { gx, gy, P: (c: number, r: number): P2 => [c * gx, r * gy] };
};
/** the storyboard's A to B route (bottom left to top right) */
export const ROUTE_DEFAULT: GridPt[] = [
  [1, 7],
  [1, 5],
  [3, 5],
  [3, 2],
  [5, 2],
  [5, 1],
];
/** boustrophedon over every row from the bottom: left to right, up one street, right to left, ... */
export const snakePath = (cols = 5, rows = 7): GridPt[] => {
  const pts: GridPt[] = [];
  for (let r = rows; r >= 1; r--) {
    const lr = (rows - r) % 2 === 0;
    pts.push([lr ? 1 : cols, r], [lr ? cols : 1, r]);
  }
  return pts;
};

// ------------------------------------------------------------- StreetMap
export type StreetMapProps = {
  w: number;
  h: number;
  cols?: number;
  rows?: number;
  /** building footprints seed */
  seed?: number;
  /** street lane width px (default 2.4% of the width, min 14) */
  lane?: number;
  /** thick black route (grid points) drawn up to `routeP` (0..1), corner nodes popping as the tip passes */
  route?: GridPt[];
  routeP?: number;
  routeW?: number;
  /** route swell 0..1 (a pulse) */
  routeBump?: number;
  /** small "A" / "B" tags at the route ends */
  ends?: boolean;
  /** "paper" (default): greys only; "atlas": the muted colours of the map-folded.png cut-out (blue river, green
   * parks, soft orange avenues) so an unfold from that photo stays continuous */
  palette?: "paper" | "atlas";
  /** a river band across the map (default: on for "atlas") */
  river?: boolean;
  /** overlays drawn in map px above the route (trails, sprites) */
  children?: React.ReactNode;
};

const PAL = {
  paper: { bg: "#FBFBFA", block: "#ECEBE8", bldg: "#DEDCD8", park: "#E2E4DE", tree: "#CFD2CA", kerb: "#BDBBB7", ave: "#FFFFFF", aveKerb: "#A9A7A3", river: "#DCDCDA", riverEdge: "#C4C4C1" },
  atlas: { bg: "#FAF9F6", block: "#E9E6E0", bldg: "#DCD7CF", park: "#D3E4C3", tree: "#BBD3A6", kerb: "#C9C4BC", ave: "#F5D29E", aveKerb: "#E2B26C", river: "#B5D6EA", riverEdge: "#93BFDB" },
} as const;

/**
 * A drawn paper street map (w x h, no card): white lanes with thin grey kerbs, light grey blocks with building
 * footprints and one park, and an optional thick black route with hollow end nodes and small corner nodes.
 */
export const StreetMap: React.FC<StreetMapProps> = ({ w, h, cols = 5, rows = 7, seed = 3, lane, route, routeP = 1, routeW = 11, routeBump = 0, ends = false, palette = "paper", river, children }) => {
  const { gx, gy, P } = streetGeom(w, h, cols, rows);
  const pal = PAL[palette];
  const showRiver = river ?? palette === "atlas";
  // one avenue each way (wider lanes), picked by the seed
  const aveC = 1 + Math.floor(hash01(seed, 7) * cols);
  const aveR = 1 + Math.floor(hash01(seed, 8) * rows);
  const ln = lane ?? Math.max(14, Math.round(w * 0.024));
  const park = [Math.floor(hash01(seed, 1) * (cols - 1)) + 1, Math.floor(hash01(seed, 2) * (rows - 2)) + 1];
  const blocks: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r <= rows; r++) {
      const x0 = c === 0 ? -20 : c * gx + ln / 2;
      const x1 = c === cols ? w + 20 : (c + 1) * gx - ln / 2;
      const y0 = r === 0 ? -20 : r * gy + ln / 2;
      const y1 = r === rows ? h + 20 : (r + 1) * gy - ln / 2;
      const isPark = c === park[0] && r === park[1];
      blocks.push(<rect key={`b${c}-${r}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={5} fill={isPark ? pal.park : pal.block} />);
      if (isPark) {
        for (let k = 0; k < 7; k++) {
          const tx = x0 + 14 + hash01(seed, c * 31 + r, k) * Math.max(1, x1 - x0 - 28);
          const ty = y0 + 14 + hash01(seed, c * 31 + r, k + 9) * Math.max(1, y1 - y0 - 28);
          blocks.push(<circle key={`t${c}-${r}-${k}`} cx={tx} cy={ty} r={Math.min(gx, gy) * 0.09} fill={pal.tree} />);
        }
        continue;
      }
      const n = 2 + Math.floor(hash01(seed, c * 31 + r, 3) * 3);
      const bw = x1 - x0;
      const bh = y1 - y0;
      for (let k = 0; k < n; k++) {
        const fw = bw * (0.22 + hash01(seed, c * 31 + r, 10 + k) * 0.3);
        const fh = bh * (0.22 + hash01(seed, c * 31 + r, 20 + k) * 0.3);
        const fx = x0 + 8 + hash01(seed, c * 31 + r, 30 + k) * Math.max(1, bw - fw - 16);
        const fy = y0 + 8 + hash01(seed, c * 31 + r, 40 + k) * Math.max(1, bh - fh - 16);
        blocks.push(<rect key={`f${c}-${r}-${k}`} x={fx} y={fy} width={fw} height={fh} rx={3} fill={pal.bldg} />);
      }
    }
  }
  // river: a smooth band from the left third to the right two thirds, drawn over the blocks (streets cross it as bridges)
  const riverEl = showRiver ? (
    <g>
      <path
        d={`M${-40} ${h * 0.3} C ${w * 0.3} ${h * 0.22}, ${w * 0.42} ${h * 0.62}, ${w * 0.7} ${h * 0.56} S ${w * 1.02} ${h * 0.7}, ${w + 40} ${h * 0.76}`}
        stroke={pal.riverEdge}
        strokeWidth={Math.max(30, w * 0.075) + 6}
        fill="none"
      />
      <path
        d={`M${-40} ${h * 0.3} C ${w * 0.3} ${h * 0.22}, ${w * 0.42} ${h * 0.62}, ${w * 0.7} ${h * 0.56} S ${w * 1.02} ${h * 0.7}, ${w + 40} ${h * 0.76}`}
        stroke={pal.river}
        strokeWidth={Math.max(30, w * 0.075)}
        fill="none"
      />
    </g>
  ) : null;
  const aves = (
    <g>
      <rect x={aveC * gx - ln * 0.75} y={0} width={ln * 1.5} height={h} fill={pal.ave} stroke={pal.aveKerb} strokeWidth={1.5} />
      <rect x={0} y={aveR * gy - ln * 0.75} width={w} height={ln * 1.5} fill={pal.ave} stroke={pal.aveKerb} strokeWidth={1.5} />
    </g>
  );
  const kerbs: React.ReactNode[] = [];
  for (let c = 1; c <= cols; c++) {
    if (c === aveC) continue;
    kerbs.push(<line key={`kv${c}a`} x1={c * gx - ln / 2} y1={0} x2={c * gx - ln / 2} y2={h} stroke={pal.kerb} strokeWidth={1.5} />);
    kerbs.push(<line key={`kv${c}b`} x1={c * gx + ln / 2} y1={0} x2={c * gx + ln / 2} y2={h} stroke={pal.kerb} strokeWidth={1.5} />);
  }
  for (let r = 1; r <= rows; r++) {
    if (r === aveR) continue;
    kerbs.push(<line key={`kh${r}a`} x1={0} y1={r * gy - ln / 2} x2={w} y2={r * gy - ln / 2} stroke={pal.kerb} strokeWidth={1.5} />);
    kerbs.push(<line key={`kh${r}b`} x1={0} y1={r * gy + ln / 2} x2={w} y2={r * gy + ln / 2} stroke={pal.kerb} strokeWidth={1.5} />);
  }
  let routeEl: React.ReactNode = null;
  if (route && route.length > 1 && routeP > 0) {
    const pts = route.map(([c, r]) => P(c, r));
    const L = polyLen(pts);
    const upto = polyUpTo(pts, L * routeP);
    const fr: number[] = [0];
    for (let i = 1; i < pts.length; i++) fr.push(fr[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / L);
    const pop = (i: number) => prog(routeP, fr[i] - 0.001, fr[i] + 0.06, EASE.pop);
    const sw = routeW * (1 + 0.35 * routeBump);
    routeEl = (
      <g style={{ filter: theme.shadow.wire }}>
        <path d={polyD(upto)} stroke={theme.color.ink} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {pts.map((p, i) => {
          const end = i === 0 || i === pts.length - 1;
          const q = i === 0 ? Math.min(1, routeP * 30) : pop(i);
          if (q <= 0) return null;
          const r = (end ? 18 : 11) * mix(0.4, 1, q) * (1 + 0.2 * routeBump);
          return <circle key={i} cx={p[0]} cy={p[1]} r={r} fill={end ? theme.color.node : theme.color.ink} stroke={theme.color.ink} strokeWidth={end ? 7 : 4} />;
        })}
      </g>
    );
    if (ends) {
      const tag = (p: P2, t: string, q: number) =>
        q > 0 ? (
          <g key={t} transform={`translate(${p[0] + 28} ${p[1] - 30}) scale(${mix(0.5, 1, q).toFixed(3)})`} opacity={Math.min(1, q * 2)}>
            <rect x={-4} y={-38} width={54} height={54} rx={12} fill={theme.color.ink} />
            <text x={23} y={2} fontFamily={INTER} fontWeight={800} fontSize={36} fill="#fff" textAnchor="middle">
              {t}
            </text>
          </g>
        ) : null;
      routeEl = (
        <>
          {routeEl}
          {tag(pts[0], "A", Math.min(1, routeP * 30))}
          {tag(pts[pts.length - 1], "B", prog(routeP, 0.97, 1, EASE.pop))}
        </>
      );
    }
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, background: pal.bg, overflow: "hidden" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {blocks}
        {riverEl}
        {aves}
        {kerbs}
      </svg>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {routeEl}
      </svg>
      {children}
    </div>
  );
};

// ------------------------------------------------------------- StreetWalker
export type StreetWalkerProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  cols?: number;
  rows?: number;
  seed?: number;
  /** "walk": a sprite walks every street leaving a dotted trail; "route": one thick black route A to B draws on */
  mode?: "walk" | "route";
  /** walk: progress 0..1 of the full boustrophedon from `from` to `to` over `dur` frames from `at` (linear pace) */
  at?: number;
  dur?: number;
  from?: number;
  to?: number;
  /** walk progress keys instead ({f, p}), e.g. 0.2 by S08d, 1 by S08e */
  keys?: { f: number; p: number }[];
  /** walker sprite (default the Paper Studio robot) and its height px */
  sprite?: string;
  spriteH?: number;
  spriteAspect?: number;
  /** route mode: the route (grid points), its draw at/dur (uses `at`/`dur`), a pulse frame, A/B tags */
  route?: GridPt[];
  routePulseAt?: number;
  ends?: boolean;
  /** map colours (see StreetMap) */
  palette?: "paper" | "atlas";
  river?: boolean;
  /** paper card around the map (default true) */
  card?: boolean;
  sheets?: number;
  tilt?: boolean | number;
  enter?: Enter;
  exit?: Exit;
  tf?: string;
  opacity?: number;
};

/**
 * A street-grid card. "walk": a small robot sprite walks every street (boustrophedon) with a step bob, facing its
 * direction, leaving a grey dotted trail. "route": one thick black route draws from A to B with nodes at the corners.
 */
export const StreetWalker: React.FC<StreetWalkerProps> = ({
  x,
  y,
  w,
  h,
  cols = 5,
  rows = 7,
  seed = 3,
  mode = "walk",
  at,
  dur = 60,
  from = 0,
  to = 1,
  keys,
  sprite,
  spriteH = 130,
  spriteAspect = ROBOT_ASPECT,
  route = ROUTE_DEFAULT,
  routePulseAt,
  ends = false,
  palette = "paper",
  river,
  card = true,
  sheets = 1,
  tilt = false,
  enter,
  exit,
  tf = "",
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o * opacity <= 0.001) return null;
  const { P } = streetGeom(w, h, cols, rows);
  const deg = tilt === true ? -6 : tilt === false ? 0 : tilt;
  const lean = deg ? `perspective(2200px) rotateY(${deg}deg) ` : "";

  let inner: React.ReactNode;
  let over: React.ReactNode = null;
  if (mode === "route") {
    const rp = at === undefined ? 1 : prog(f, at, at + dur, EASE.travel);
    const bump = routePulseAt === undefined ? 0 : Math.sin(Math.PI * prog(f, routePulseAt, routePulseAt + 14, EASE.linear));
    inner = <StreetMap w={w} h={h} cols={cols} rows={rows} seed={seed} route={route} routeP={rp} routeBump={bump} ends={ends} palette={palette} river={river} />;
  } else {
    const pts = snakePath(cols, rows).map(([c, r]) => P(c, r));
    const L = polyLen(pts);
    const p = keys?.length ? keyed(keys, f, (k) => k.p, EASE.linear) : at === undefined ? to : mix(from, to, prog(f, at, at + dur, EASE.linear));
    const d = L * Math.max(0, Math.min(1, p));
    const here = polyAt(pts, d);
    // face the last horizontal direction
    let face = 1;
    for (let s = here.seg; s >= 0; s--) {
      const dx = pts[s + 1][0] - pts[s][0];
      if (Math.abs(dx) > 1) {
        face = dx >= 0 ? 1 : -1;
        break;
      }
    }
    const stepLen = 16;
    const phase = d / stepLen;
    const bob = Math.abs(Math.sin(Math.PI * phase)) * 6;
    const sway = Math.sin(Math.PI * phase) * 4;
    const trail = polyUpTo(pts, d);
    const sw = spriteH * spriteAspect;
    inner = (
      <StreetMap w={w} h={h} cols={cols} rows={rows} seed={seed} palette={palette} river={river}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {trail.length > 1 ? <path d={polyD(trail)} stroke="#8C8C8C" strokeWidth={9} strokeDasharray="0.01 22" strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null}
          <circle cx={pts[0][0]} cy={pts[0][1]} r={10} fill="#8C8C8C" />
        </svg>
      </StreetMap>
    );
    over = (
      <div
        style={{
          position: "absolute",
          left: here.x - sw / 2,
          top: here.y - spriteH * 0.9 - bob,
          width: sw,
          height: spriteH,
          transform: `rotate(${sway.toFixed(2)}deg) scaleX(${face})`,
          transformOrigin: "50% 92%",
          filter: theme.shadow.object,
        }}
      >
        <Img src={sprite ?? PHOTO05.robot} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `${e.transform} ${lean}${tf}`, transformOrigin: "center", opacity: e.o * opacity }}>
      {card ? (
        <PaperCard x={0} y={0} w={w} h={h} sheets={sheets}>
          {inner}
        </PaperCard>
      ) : (
        <div style={{ position: "absolute", inset: 0, borderRadius: theme.radius.card, overflow: "hidden" }}>{inner}</div>
      )}
      {over}
    </div>
  );
};

// ------------------------------------------------------------- MapUnfold
export type MapUnfoldProps = {
  /** the fully open map in reel px */
  x: number;
  y: number;
  w: number;
  h: number;
  /** concertina panels (default 4) */
  panels?: number;
  /** frame the first hinge starts opening; frames per hinge (default 14) and between hinges (default 6) */
  at: number;
  dur?: number;
  stagger?: number;
  /** start fold angle, degrees (default 172; 180 lies perfectly flat, a bit less shows the folded edges) */
  startAngle?: number;
  /** a folded-map cut-out shown first that cross-fades into the panels as the first hinge opens */
  folded?: { src?: string; x?: number; y?: number; w?: number; h?: number; aspect?: number };
  xfade?: number;
  /** back of the paper */
  back?: string;
  /** perspective px (default 2600) */
  perspective?: number;
  /** a slight lean (deg around X) that settles to flat as the map opens (default 8) */
  lean?: number;
  /** concertina held part open: panels alternate +/- half the fold angle around the centre (match it to the
   * map-folded.png cut-out with startAngle 62, panels 6); false keeps panel 0 facing the camera (a closed map) */
  zigzag?: boolean;
  /** cast shadow under the map (default true) */
  shadow?: boolean;
  enter?: Enter;
  exit?: Exit;
  opacity?: number;
  /** the open map's face, drawn at w x h (e.g. <StreetMap w h route .../>) */
  children: React.ReactNode;
};

/**
 * A folded paper map (concertina panels) that opens panel by panel in 3D around its hinges, with shading on the
 * folds and faint creases left in the paper, revealing `children` at full size; it re-centres as it opens. Can start
 * from a folded-map cut-out that cross-fades into the panels.
 */
export const MapUnfold: React.FC<MapUnfoldProps> = ({
  x,
  y,
  w,
  h,
  panels = 4,
  at,
  dur = 14,
  stagger = 6,
  startAngle = 172,
  folded,
  xfade = 8,
  back = "#ECEAE6",
  perspective = 2600,
  lean = 8,
  zigzag = false,
  shadow = true,
  enter,
  exit,
  opacity = 1,
  children,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o * opacity <= 0.001) return null;
  const n = Math.max(2, Math.round(panels));
  const pw = w / n;
  const hinge = (i: number) => prog(f, at + (i - 1) * stagger, at + (i - 1) * stagger + dur, EASE.cam);
  const qs = Array.from({ length: n }, (_, i) => (i === 0 ? 1 : hinge(i)));
  const angles = qs.map((q, i) => (i === 0 ? 0 : startAngle * (1 - q) * (i % 2 === 1 ? 1 : -1)));
  const all = qs.slice(1).reduce((s, q) => s + q, 0) / (n - 1);
  // keep the visible part centred: folded it sits on panel 0's footprint, so shift it by (w - pw) / 2 * (1 - open)
  const open = mix(0, 1, all);
  // zigzag: panel 0 turns back by half of the first fold so the folds alternate around the viewing axis
  const rootY = zigzag ? -angles[1] / 2 : 0;
  // the open part's projected width, so the map stays centred as it opens
  const cumZ: number[] = [];
  angles.forEach((a, i) => cumZ.push((cumZ[i - 1] ?? rootY) + a));
  const projW = cumZ.reduce((s2, a) => s2 + pw * Math.cos((a * Math.PI) / 180), 0);
  const shiftX = zigzag ? (w - Math.max(pw * 0.2, projW)) / 2 : ((w - pw) / 2) * (1 - open);
  const leanNow = lean * (1 - open);
  // the panels fade up under the photo first, then the photo fades off them (no see-through midpoint)
  const panelsO = folded?.src ? prog(f, at - xfade / 2, at, EASE.soft) : 1;
  const imgO = folded?.src ? 1 - prog(f, at - xfade / 4, at + xfade / 2, EASE.soft) : 0;

  // cumulative angle per panel for its shading
  const cum = cumZ;

  const panel = (i: number): React.ReactNode => {
    if (i >= n) return null;
    const a = angles[i];
    const fold = Math.abs(Math.sin(((startAngle * (1 - qs[i])) / 2) * (Math.PI / 180)));
    // light from the top left: a panel turned to the right (positive angle) faces away from it and darkens,
    // one turned to the left catches it
    const sn = Math.sin((cum[i] * Math.PI) / 180);
    const shade = 0.3 * Math.max(0, sn) + 0.06 * Math.abs(sn);
    const lit = 0.16 * Math.max(0, -sn);
    const creaseL = i > 0 ? 0.05 + 0.22 * fold : 0;
    const nextFold = i < n - 1 ? Math.abs(Math.sin(((startAngle * (1 - qs[i + 1])) / 2) * (Math.PI / 180))) : 0;
    const creaseR = i < n - 1 ? 0.05 + 0.22 * nextFold : 0;
    return (
      <div
        style={{
          position: "absolute",
          left: i === 0 ? 0 : pw,
          top: 0,
          width: pw,
          height: h,
          transformOrigin: "0% 50%",
          transform: i === 0 ? undefined : `rotateY(${a.toFixed(3)}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* front: this panel's slice of the map */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", backfaceVisibility: "hidden", background: "#FBFBFA" }}>
          <div style={{ position: "absolute", left: -i * pw, top: 0, width: w, height: h }}>{children}</div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, rgba(0,0,0,${creaseL.toFixed(3)}) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 86%, rgba(0,0,0,${creaseR.toFixed(3)}) 100%)`,
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: `rgba(30,28,26,${shade.toFixed(3)})` }} />
          {lit > 0.002 ? <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${lit.toFixed(3)})` }} /> : null}
          {i === 0 ? <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 50%)" }} /> : null}
        </div>
        {/* back of the paper */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: back }}>
          <div style={{ position: "absolute", inset: 0, background: `rgba(30,28,26,${(0.1 + shade * 0.6).toFixed(3)})` }} />
        </div>
        {panel(i + 1)}
      </div>
    );
  };

  const fr = folded ?? {};
  const fAsp = fr.aspect ?? 1.25;
  const fW = fr.w ?? pw * 1.5;
  const fH = fr.h ?? fW / fAsp;
  const fX = fr.x ?? x + (w - fW) / 2;
  const fY = fr.y ?? y + (h - fH) / 2;
  return (
    <AbsoluteFill style={{ opacity: e.o * opacity, transform: e.transform }}>
      {panelsO > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: w,
            height: h,
            opacity: panelsO,
            filter: shadow ? `drop-shadow(14px 22px 16px rgba(0,0,0,.16)) drop-shadow(36px 56px 44px rgba(0,0,0,.12))` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, perspective, perspectiveOrigin: "50% 40%" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: pw,
                height: h,
                transformStyle: "preserve-3d",
                transform: `translateX(${shiftX.toFixed(2)}px) rotateX(${leanNow.toFixed(3)}deg) rotateY(${rootY.toFixed(3)}deg)`,
                transformOrigin: "0% 50%",
              }}
            >
              {panel(0)}
            </div>
          </div>
        </div>
      ) : null}
      {imgO > 0.001 && fr.src ? (
        <div style={{ position: "absolute", left: fX, top: fY, width: fW, height: fH, opacity: imgO, filter: theme.shadow.cutout }}>
          <Img src={fr.src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
