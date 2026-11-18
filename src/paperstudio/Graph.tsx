import React from "react";
import { Img, useCurrentFrame } from "remotion";
import { EASE, mix, mixColor, prog, theme } from "./theme";
import { Enter, Exit, drift as driftAt, enterState } from "./motion";
import { PaperCard } from "./PaperCard";
import { hash01, rng } from "./kit06";

export type GraphNode = { id: string; /** 0..1 across the drawing box */ x: number; y: number; /** node radius override (hubs) */ r?: number };
export type GraphEdge = [string, string];
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

/** the storyboard's graph (14 nodes, 22 edges, drawn outward from n0) */
export const GRAPH_DEFAULT: GraphData = {
  nodes: [
    [0.12, 0.32],
    [0.25, 0.64],
    [0.35, 0.2],
    [0.44, 0.46],
    [0.5, 0.78],
    [0.58, 0.3],
    [0.66, 0.6],
    [0.74, 0.18],
    [0.8, 0.82],
    [0.88, 0.44],
    [0.3, 0.88],
    [0.9, 0.14],
    [0.16, 0.8],
    [0.62, 0.92],
  ].map(([x, y], i) => ({ id: `n${i}`, x, y })),
  edges: (
    [
      [0, 2],
      [0, 1],
      [1, 3],
      [2, 3],
      [3, 5],
      [3, 4],
      [4, 6],
      [5, 6],
      [5, 7],
      [6, 9],
      [7, 9],
      [7, 11],
      [8, 9],
      [6, 8],
      [1, 12],
      [12, 10],
      [10, 4],
      [4, 13],
      [13, 8],
      [2, 5],
      [9, 11],
      [0, 12],
    ] as [number, number][]
  ).map(([a, b]) => [`n${a}`, `n${b}`] as GraphEdge),
};

/**
 * A seeded graph: `count` nodes on a jittered grid inside 0.07..0.93, each linked to its nearest neighbours, edges
 * ordered breadth-first from the node nearest `start` so the drawing grows outward. Same seed, same graph.
 */
export const graphFromSeed = (seed: number, count = 16, opts: { links?: number; aspect?: number; start?: [number, number] } = {}): GraphData => {
  const r = rng(seed);
  const aspect = opts.aspect ?? 2;
  const cols = Math.max(2, Math.round(Math.sqrt(count * aspect)));
  const rows = Math.max(2, Math.ceil(count / cols));
  const cells: [number, number][] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cells.push([i, j]);
  for (let i = cells.length - 1; i > 0; i--) {
    const k = Math.floor(r() * (i + 1));
    [cells[i], cells[k]] = [cells[k], cells[i]];
  }
  const nodes: GraphNode[] = cells.slice(0, count).map(([i, j], n) => ({
    id: `s${n}`,
    x: 0.07 + ((i + 0.2 + r() * 0.6) / cols) * 0.86,
    y: 0.08 + ((j + 0.2 + r() * 0.6) / rows) * 0.84,
  }));
  const dist = (a: GraphNode, b: GraphNode) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const set = new Map<string, [number, number]>();
  const links = opts.links ?? 2;
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: dist(a, b) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, links)
      .forEach(({ j }) => set.set(key(i, j), [i, j]));
  });
  const adj = new Map<number, number[]>();
  set.forEach(([a, b]) => {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  });
  const st = opts.start ?? [0, 0.5];
  const startN = nodes.map((n, i) => ({ i, d: Math.hypot(n.x - st[0], n.y - st[1]) })).sort((p, q) => p.d - q.d)[0].i;
  const seen = new Set([startN]);
  const queue = [startN];
  const edges: GraphEdge[] = [];
  const used = new Set<string>();
  while (queue.length) {
    const a = queue.shift()!;
    for (const b of (adj.get(a) ?? []).sort((p, q) => dist(nodes[a], nodes[p]) - dist(nodes[a], nodes[q]))) {
      const k = key(a, b);
      if (used.has(k)) continue;
      used.add(k);
      edges.push([nodes[a].id, nodes[b].id]);
      if (!seen.has(b)) {
        seen.add(b);
        queue.push(b);
      }
    }
  }
  // islands the BFS never reached keep their own edges at the end
  set.forEach(([a, b]) => {
    if (!used.has(key(a, b))) edges.push([nodes[a].id, nodes[b].id]);
  });
  return { nodes, edges };
};

export type GraphCard = {
  /** a real capture behind the wire (the README graph); cover-fit */
  src?: string;
  objectPosition?: string;
  /** zoom of the capture inside the face (default 1) */
  zoom?: number;
  /** darken the capture so the wire reads (0..1, default 0.38) */
  dim?: number;
  /** capture saturation (default 0.7; nothing neon) */
  saturate?: number;
  /** face colour (default the README dark #15171E) */
  face?: string;
  sheets?: number;
};

export type KnowledgeGraphProps = {
  /** drawing box in reel px (the card, when on, fills it) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** graph data (default GRAPH_DEFAULT); or a seeded one via `seed` + `count` */
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  seed?: number;
  count?: number;
  /** inset of the node area inside the box, px (default 6% of the smaller side) */
  pad?: number;
  /** frame the first edge starts drawing (undefined = drawn) */
  at?: number;
  /** frames between edge starts (default 3) and frames one edge takes (default 6) */
  rate?: number;
  edgeDur?: number;
  /** how many edges (in order) are drawn at all (default all) */
  draw?: number;
  /** wire style (paper-studio defaults: 7 px black, hollow nodes r 15 with a 6 px ring) */
  lineW?: number;
  nodeR?: number;
  ring?: number;
  color?: string;
  nodeFill?: string;
  /** node ids lit in order: a thicker line draws along them and the nodes fill black */
  highlightPath?: string[];
  highlightAt?: number;
  /** frames per lit segment (default 7) */
  highlightRate?: number;
  /** lit line width (default 11) and lit node radius (default 18) */
  highlightW?: number;
  highlightR?: number;
  /** opacity the unlit wire dims to while a path is lit (default 0.4) */
  dimOthers?: number;
  /** re-pop pulse frame(s) ("rebuilds on commit"): a ripple from `pulseFrom` swells every node and edge */
  pulseAt?: number | number[];
  pulseDur?: number;
  /** frames the ripple takes to cross the graph (default 12) */
  pulseSpread?: number;
  pulseFrom?: string;
  /** dark-faced paper card behind the graph (true = plain dark face) */
  card?: boolean | GraphCard;
  /** white casing under the black wire so it reads on a dark face (default: on when the card is) */
  casing?: boolean;
  /** ambient node drift in px (default 0) */
  breathe?: number;
  enter?: Enter;
  exit?: Exit;
  tf?: string;
  opacity?: number;
};

/**
 * A knowledge graph drawn node to node in the paper-studio wire style: black 7 px edges drawing on one after another,
 * hollow nodes popping as the wire reaches them, the raised-wire shadow; a lit path that draws thicker with filled
 * nodes; a re-pop ripple for "rebuilds on commit"; optionally on a dark-faced paper card over the real README graph.
 */
export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  x,
  y,
  w,
  h,
  nodes: nodesIn,
  edges: edgesIn,
  seed,
  count = 16,
  pad: padIn,
  at,
  rate = 3,
  edgeDur = 6,
  draw,
  lineW = theme.wire.main,
  nodeR = theme.wire.nodeR,
  ring = theme.wire.nodeRing,
  color = theme.color.ink,
  nodeFill = theme.color.node,
  highlightPath,
  highlightAt,
  highlightRate = 7,
  highlightW = 11,
  highlightR = 18,
  dimOthers = 0.4,
  pulseAt,
  pulseDur = 16,
  pulseSpread = 12,
  pulseFrom,
  card,
  casing,
  breathe = 0,
  enter,
  exit,
  tf = "",
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  const data = React.useMemo<GraphData>(() => {
    if (nodesIn && edgesIn) return { nodes: nodesIn, edges: edgesIn };
    if (seed !== undefined) return graphFromSeed(seed, count, { aspect: w / h });
    return GRAPH_DEFAULT;
  }, [nodesIn, edgesIn, seed, count, w, h]);
  if (e.o * opacity <= 0.001) return null;

  const pad = padIn ?? Math.round(Math.min(w, h) * 0.06);
  const byId = new Map(data.nodes.map((n, i) => [n.id, { n, i }]));
  const P = (id: string) => {
    const k = byId.get(id);
    if (!k) return [0, 0] as [number, number];
    const d = breathe ? driftAt(f, breathe, 100 + (k.i % 5) * 9, k.i) : { x: 0, y: 0 };
    return [pad + k.n.x * (w - 2 * pad) + d.x, pad + k.n.y * (h - 2 * pad) + d.y] as [number, number];
  };
  const nEdges = Math.min(data.edges.length, draw ?? data.edges.length);
  const edges = data.edges.slice(0, nEdges);
  const edgeStart = (i: number) => (at === undefined ? -1e9 : at + i * rate);

  // when each node pops: when the first wire touching it starts (its source) or arrives (its target)
  const nodeAt = new Map<string, number>();
  edges.forEach(([a, b], i) => {
    const s = edgeStart(i);
    nodeAt.set(a, Math.min(nodeAt.get(a) ?? 1e9, s));
    nodeAt.set(b, Math.min(nodeAt.get(b) ?? 1e9, s + edgeDur * 0.8));
  });

  // pulse ripple: per node bump 0..1
  const pulses = pulseAt === undefined ? [] : Array.isArray(pulseAt) ? pulseAt : [pulseAt];
  const origin = P(pulseFrom ?? highlightPath?.[0] ?? data.nodes[0]?.id ?? "");
  const maxD = Math.max(1, ...data.nodes.map((n) => Math.hypot(P(n.id)[0] - origin[0], P(n.id)[1] - origin[1])));
  const bumpOf = (id: string) => {
    if (!pulses.length) return 0;
    const p = P(id);
    const delay = (Math.hypot(p[0] - origin[0], p[1] - origin[1]) / maxD) * pulseSpread;
    let b = 0;
    for (const t of pulses) b = Math.max(b, Math.sin(Math.PI * prog(f, t + delay, t + delay + pulseDur, EASE.linear)));
    return b;
  };

  // lit path
  const lit = highlightPath && highlightPath.length > 1 && highlightAt !== undefined ? highlightPath : null;
  const litOn = lit ? prog(f, highlightAt!, highlightAt! + 10, EASE.soft) : 0;
  const dimK = mix(1, dimOthers, litOn);
  const litSeg = (k: number) => (lit ? prog(f, highlightAt! + k * highlightRate, highlightAt! + (k + 1) * highlightRate, EASE.travel) : 0);

  const cardOn = !!card;
  const cs: GraphCard = typeof card === "object" ? card : {};
  const useCasing = casing ?? cardOn;
  const caseW = 6;

  const edgeEls: React.ReactNode[] = [];
  const caseEls: React.ReactNode[] = [];
  edges.forEach(([a, b], i) => {
    const p = at === undefined ? 1 : prog(f, edgeStart(i), edgeStart(i) + edgeDur, EASE.travel);
    if (p <= 0) return;
    const [ax, ay] = P(a);
    const [bx, by] = P(b);
    const bump = (bumpOf(a) + bumpOf(b)) / 2;
    const sw = lineW + 3 * bump;
    const common = { x1: ax, y1: ay, x2: bx, y2: by, pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p, strokeLinecap: "round" as const };
    if (useCasing) caseEls.push(<line key={`c${i}`} {...common} stroke="#FFFFFF" strokeOpacity={0.92} strokeWidth={sw + caseW} />);
    edgeEls.push(<line key={`e${i}`} {...common} stroke={color} strokeWidth={sw} />);
  });

  const nodeEls = data.nodes.map((n) => {
    const t = nodeAt.get(n.id);
    if (t === undefined) return null;
    const q = at === undefined ? 1 : prog(f, t, t + 8, EASE.pop);
    if (q <= 0) return null;
    const bump = bumpOf(n.id);
    const r = (n.r ?? nodeR) * mix(0.4, 1, q) * (1 + 0.45 * bump);
    const [cx, cy] = P(n.id);
    return (
      <g key={n.id} opacity={Math.min(1, q * 2)}>
        {useCasing ? <circle cx={cx} cy={cy} r={r + ring / 2 + caseW / 2} fill="#FFFFFF" fillOpacity={0.92} /> : null}
        <circle cx={cx} cy={cy} r={r} fill={mixColor(nodeFill, color, 0.85 * bump)} stroke={color} strokeWidth={ring} />
      </g>
    );
  });

  let litEls: React.ReactNode = null;
  if (lit) {
    const pts = lit.map(P);
    const segs: React.ReactNode[] = [];
    const caseSegs: React.ReactNode[] = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const p = litSeg(k);
      if (p <= 0) continue;
      const common = { x1: pts[k][0], y1: pts[k][1], x2: pts[k + 1][0], y2: pts[k + 1][1], pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - p, strokeLinecap: "round" as const };
      if (useCasing) caseSegs.push(<line key={`lc${k}`} {...common} stroke="#FFFFFF" strokeWidth={highlightW + caseW + 2} />);
      segs.push(<line key={`l${k}`} {...common} stroke={color} strokeWidth={highlightW} />);
    }
    const litNodes = pts.map(([cx, cy], k) => {
      const tArr = highlightAt! + Math.max(0, k * highlightRate - 2);
      const q = prog(f, tArr, tArr + 8, EASE.pop);
      if (q <= 0) return null;
      const r = highlightR * mix(0.5, 1, q) * (1 + 0.3 * bumpOf(lit[k]));
      return (
        <g key={`ln${k}`} opacity={Math.min(1, q * 2)}>
          {useCasing ? <circle cx={cx} cy={cy} r={r + 6} fill="#FFFFFF" /> : null}
          <circle cx={cx} cy={cy} r={r} fill={color} stroke={color} strokeWidth={ring} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.22} fill="#FFFFFF" fillOpacity={0.35} />
        </g>
      );
    });
    litEls = (
      <g>
        {caseSegs}
        {segs}
        {litNodes}
      </g>
    );
  }

  const face = cs.face ?? "#15171E";
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `${e.transform} ${tf}`, transformOrigin: "center", opacity: e.o * opacity }}>
      {cardOn ? (
        <PaperCard x={0} y={0} w={w} h={h} sheets={cs.sheets ?? 1} bg={face}>
          {cs.src ? (
            <Img
              src={cs.src}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: cs.objectPosition ?? "left center",
                transform: `scale(${cs.zoom ?? 1})`,
                transformOrigin: cs.objectPosition?.startsWith("right") ? "right center" : "left center",
                filter: `saturate(${cs.saturate ?? 0.7})`,
              }}
            />
          ) : null}
          <div style={{ position: "absolute", inset: 0, background: face, opacity: cs.src ? (cs.dim ?? 0.38) : 0 }} />
          {/* soft top-left light on the face */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 40%)" }} />
        </PaperCard>
      ) : null}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: theme.shadow.wire }}
        fill="none"
      >
        <g opacity={dimK}>
          {caseEls}
          {edgeEls}
          {nodeEls}
        </g>
        {litEls}
      </svg>
    </div>
  );
};

/** stable pick of `n` node ids along a graph walk from `from` (for a quick `highlightPath`) */
export const graphWalk = (g: GraphData, from: string, n = 4, seed = 1): string[] => {
  const adj = new Map<string, string[]>();
  g.edges.forEach(([a, b]) => {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  });
  const out = [from];
  for (let k = 1; k < n; k++) {
    const opts = (adj.get(out[k - 1]) ?? []).filter((id) => !out.includes(id));
    if (!opts.length) break;
    out.push(opts[Math.floor(hash01(seed, k) * opts.length)]);
  }
  return out;
};
