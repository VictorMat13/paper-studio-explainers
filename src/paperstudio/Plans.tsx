import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, INTER, mix, mixColor, prog, theme } from "./theme";
import { Enter, Exit, enterState } from "./motion";
import { PaperCard } from "./PaperCard";
import { LogoDisc } from "./LogoChip";
import { keyed } from "./kit05";

// ------------------------------------------------------------- fill logic
export type FillKey = { f: number; v: number };
type FillSpec = {
  from?: number;
  to?: number;
  at?: number;
  dur?: number;
  keys?: FillKey[];
  drain?: { at: number; to?: number; dur?: number };
};
const fillAt = (f: number, s: FillSpec) => {
  const base = (fr: number) => {
    if (s.keys?.length) return keyed(s.keys, fr, (k) => k.v, EASE.travel);
    if (s.at === undefined) return s.to ?? 1;
    return mix(s.from ?? 0.2, s.to ?? 1, prog(fr, s.at, s.at + (s.dur ?? 24), EASE.travel));
  };
  if (s.drain && f >= s.drain.at) return mix(base(s.drain.at), s.drain.to ?? 0.12, prog(f, s.drain.at, s.drain.at + (s.drain.dur ?? 12), EASE.travel));
  return base(f);
};
/** first frame the fill reaches the end (for the "limit reached" pill), or undefined */
const hitFrame = (s: FillSpec, limit: boolean | number | undefined) => {
  if (limit === undefined || limit === false) return undefined;
  if (typeof limit === "number") return limit;
  if (s.keys?.length) return s.keys.find((k) => k.v >= 0.995)?.f;
  if (s.at === undefined) return (s.to ?? 1) >= 0.995 ? -1e9 : undefined;
  return (s.to ?? 1) >= 0.995 ? s.at + (s.dur ?? 24) : undefined;
};

// ------------------------------------------------------------- UsageMeter
export type UsageMeterProps = FillSpec & {
  x: number;
  y: number;
  w: number;
  h?: number;
  /** label top left (default "plan usage") and its size (default max(34, 24% of h)) */
  label?: string;
  labelSize?: number;
  /** "limit reached" pill: true pops it when the bar reaches the end; a number pops it at that frame */
  limit?: boolean | number;
  limitText?: string;
  /** black stop bar across the bar at its current fill, popping at `at` */
  stop?: { at: number };
  /** the bar shivers 2 px for a few frames when it hits the limit (default true) */
  shiver?: boolean;
  /** paper card around it (default true); false draws only label, track and pill (for PlanCard's slot) */
  card?: boolean;
  sheets?: number;
  /** track height (default 22% of h) */
  barH?: number;
  /** bar colour (default ink) */
  barColor?: string;
  enter?: Enter;
  exit?: Exit;
  tf?: string;
  opacity?: number;
};

/**
 * A plan usage card: label, a thin inset track, a black bar filling from/to over frames (or along `keys` for
 * pulses), a "limit reached" pill that pops when it hits 100%, an optional drain back down (pill pops off) and an
 * optional black stop bar.
 */
export const UsageMeter: React.FC<UsageMeterProps> = (props) => {
  const { x, y, w, h = 150, label = "plan usage", limit, limitText = "limit reached", stop, shiver = true, card = true, sheets = 0, barColor = theme.color.ink, enter, exit, tf = "", opacity = 1 } = props;
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o * opacity <= 0.001) return null;
  const v = Math.max(0, Math.min(1, fillAt(f, props)));
  const hit = hitFrame(props, limit);
  let pill = hit === undefined ? 0 : prog(f, hit, hit + 8, EASE.pop);
  if (props.drain) pill *= 1 - prog(f, props.drain.at, props.drain.at + 6, EASE.exit);
  const shake = shiver && hit !== undefined && f >= hit ? 2 * Math.sin((f - hit) * 2.3) * (1 - prog(f, hit, hit + 10, EASE.soft)) : 0;
  const pad = Math.round(w * 0.06);
  const barH = props.barH ?? Math.round(h * 0.22);
  const trackY = Math.round(h * 0.56);
  const trackW = w - 2 * pad;
  const fs = props.labelSize ?? Math.max(34, Math.round(h * 0.24));
  const pillFs = Math.max(28, Math.round(h * 0.19));
  const stopP = stop ? prog(f, stop.at, stop.at + 8, EASE.pop) : 0;
  const stopX = stop ? pad + trackW * Math.max(0, Math.min(1, fillAt(stop.at, props))) : 0;

  const body = (
    <>
      <div style={{ position: "absolute", left: pad, top: Math.round(h * 0.1), fontFamily: INTER, fontSize: fs, fontWeight: 700, color: theme.color.ink, whiteSpace: "nowrap", letterSpacing: -0.5 }}>{label}</div>
      <div
        style={{
          position: "absolute",
          left: pad,
          top: trackY,
          width: trackW,
          height: barH,
          borderRadius: barH / 2,
          background: "#ECECEC",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,.10), inset 0 -1px 0 rgba(255,255,255,.8)",
          overflow: "hidden",
          transform: `translateX(${shake.toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${(v * 100).toFixed(3)}%`,
            minWidth: v > 0.001 ? barH : 0,
            borderRadius: barH / 2,
            background: `linear-gradient(180deg, ${mixColor(barColor.length === 7 ? barColor : "#111111", "#FFFFFF", 0.14)} 0%, ${barColor} 55%)`,
          }}
        />
      </div>
      {stopP > 0 ? (
        <div
          style={{
            position: "absolute",
            left: stopX - 13,
            top: trackY - barH * 0.45,
            width: 26,
            height: barH * 1.9,
            borderRadius: 7,
            background: theme.color.ink,
            boxShadow: "4px 6px 10px rgba(0,0,0,.22)",
            transform: `scaleY(${stopP.toFixed(4)})`,
            opacity: Math.min(1, stopP * 2),
          }}
        />
      ) : null}
      {pill > 0.001 ? (
        <div
          style={{
            position: "absolute",
            right: pad,
            top: Math.round(h * 0.09),
            transform: `scale(${mix(0.6, 1, pill).toFixed(4)})`,
            transformOrigin: "100% 50%",
            opacity: Math.min(1, pill * 2),
            background: theme.color.ink,
            color: "#fff",
            borderRadius: 40,
            padding: `${Math.round(pillFs * 0.22)}px ${Math.round(pillFs * 0.75)}px`,
            fontFamily: INTER,
            fontSize: pillFs,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: theme.shadow.pill,
          }}
        >
          {limitText}
        </div>
      ) : null}
    </>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `${e.transform} ${tf}`, transformOrigin: "center", opacity: e.o * opacity }}>
      {card ? (
        <PaperCard x={0} y={0} w={w} h={h} sheets={sheets}>
          {body}
        </PaperCard>
      ) : (
        body
      )}
    </div>
  );
};

// ------------------------------------------------------------- PlanCard
export type PlanCardProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** plan name (grey, top left) */
  name?: string;
  /** the big price */
  price?: string;
  /** small text beside the price (default "/ month"; false hides it) */
  per?: string | false;
  /** small subline under the price */
  sub?: string;
  /** logo chip slot: inline at the top right of the face (default) or on the card's top-left corner */
  chip?: { name: string; src?: string; r?: number; at?: number; pos?: "inline" | "corner" };
  /** usage meter slot in the lower part of the face (same props as UsageMeter's fill logic) */
  usage?: Omit<UsageMeterProps, "x" | "y" | "w" | "h" | "card" | "enter" | "exit" | "tf" | "opacity" | "sheets">;
  /** a thick black strike draws across the price (left to right) and the price greys out */
  strike?: { at: number; dur?: number };
  /** the price swells (e.g. 1.1) and the name darkens at `at` */
  emph?: { at: number; dur?: number; scale?: number };
  sheets?: number;
  tilt?: boolean | number;
  tf?: string;
  enter?: Enter;
  exit?: Exit;
  opacity?: number;
  children?: React.ReactNode;
};

/**
 * A pricing card on paper (thickness edge, stacked sheets): plan name, big price with "/ month", a subline,
 * an optional logo chip and an optional usage meter slot. `strike` and `emph` animate the price.
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  x,
  y,
  w,
  h,
  name = "Claude Pro",
  price = "$20",
  per = "/ month",
  sub,
  chip,
  usage,
  strike,
  emph,
  sheets = 1,
  tilt = false,
  tf = "",
  enter,
  exit,
  opacity = 1,
  children,
}) => {
  const f = useCurrentFrame();
  const e = enterState(f, enter, exit);
  if (e.o * opacity <= 0.001) return null;
  const pad = Math.round(w * 0.07);
  const hasUsage = !!usage;
  const big = Math.round(h * (hasUsage ? 0.3 : 0.36));
  const small = Math.round(h * 0.085);
  const nameFs = Math.round(h * 0.095);
  const sp = strike ? prog(f, strike.at, strike.at + (strike.dur ?? 10), EASE.travel) : 0;
  const ep = emph ? prog(f, emph.at, emph.at + (emph.dur ?? 12), EASE.enter) : 0;
  const priceColor = mixColor(theme.color.ink, "#9A9A9A", sp);
  const nameColor = mixColor("#777777", theme.color.ink, ep);
  const deg = tilt === true ? -6 : tilt === false ? 0 : tilt;
  const lean = deg ? `perspective(2200px) rotateY(${deg}deg) ` : "";
  const chipR = chip?.r ?? Math.round(h * 0.11);
  const chipP = chip ? (chip.at === undefined ? 1 : prog(f, chip.at, chip.at + 9, EASE.pop)) : 0;
  const corner = chip?.pos === "corner";
  const priceTop = Math.round(h * (hasUsage ? 0.2 : 0.24));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `${e.transform} ${lean}${tf}`, transformOrigin: "center", opacity: e.o * opacity }}>
      <PaperCard x={0} y={0} w={w} h={h} sheets={sheets}>
        <div style={{ position: "absolute", left: pad, top: Math.round(h * 0.085), fontFamily: INTER, fontSize: nameFs, fontWeight: 600, color: nameColor, whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ position: "absolute", left: pad, top: priceTop, display: "flex", alignItems: "baseline", gap: Math.round(h * 0.035), fontFamily: INTER }}>
          <span
            style={{
              position: "relative",
              display: "inline-block",
              fontSize: big,
              fontWeight: 800,
              letterSpacing: -big * 0.045,
              lineHeight: 1.05,
              color: priceColor,
              transform: `scale(${mix(1, emph?.scale ?? 1.1, ep).toFixed(4)})`,
              transformOrigin: "0% 70%",
            }}
          >
            {price}
            {sp > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: -big * 0.08,
                  top: "52%",
                  width: `calc(${(sp * 100).toFixed(2)}% + ${(big * 0.16 * sp).toFixed(1)}px)`,
                  height: Math.max(7, Math.round(big * 0.075)),
                  marginTop: -Math.max(7, Math.round(big * 0.075)) / 2,
                  background: theme.color.ink,
                  borderRadius: 6,
                  transform: "rotate(-6deg)",
                  transformOrigin: "0% 50%",
                  boxShadow: "2px 3px 4px rgba(0,0,0,.18)",
                }}
              />
            ) : null}
          </span>
          {per !== false ? <span style={{ fontSize: small * 1.15, fontWeight: 500, color: "#777", whiteSpace: "nowrap" }}>{per}</span> : null}
        </div>
        {sub ? (
          <div style={{ position: "absolute", left: pad, top: priceTop + big * 1.1, fontFamily: INTER, fontSize: small, fontWeight: 500, color: "#777", whiteSpace: "nowrap" }}>{sub}</div>
        ) : null}
        {usage ? <UsageMeter {...usage} card={false} x={0} y={Math.round(h * 0.6)} w={w} h={Math.round(h * 0.34)} label={usage.label ?? "usage"} /> : null}
        {chip && !corner && chipP > 0 ? (
          <div style={{ position: "absolute", right: pad, top: Math.round(h * 0.075), width: chipR * 2, height: chipR * 2, transform: `scale(${mix(0.6, 1, chipP).toFixed(4)})`, opacity: Math.min(1, chipP * 2) }}>
            <LogoDisc name={chip.name} src={chip.src} r={chipR} />
          </div>
        ) : null}
        {children}
      </PaperCard>
      {chip && corner && chipP > 0 ? (
        <div
          style={{
            position: "absolute",
            left: -chipR * 0.55,
            top: -chipR * 0.55,
            width: chipR * 2,
            height: chipR * 2,
            transform: `scale(${mix(0.6, 1, chipP).toFixed(4)})`,
            opacity: Math.min(1, chipP * 2),
          }}
        >
          <LogoDisc name={chip.name} src={chip.src} r={chipR} />
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------- ReportedStat
export type ReportedStatProps = {
  /** centre x and the top of the block */
  x: number;
  y: number;
  value: number;
  from?: number;
  /** decimals shown (default: as many as `value` has, max 2) */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** frame the count (or the pop) starts; undefined = landed */
  at?: number;
  /** count frames (default 28; eases out so it slows into the value) */
  dur?: number;
  /** "count" runs through in-between values; "pop" lands the final value with no in-between values */
  land?: "count" | "pop";
  /** number size px (default 150); the suffix is drawn at `suffixScale` of it */
  size?: number;
  suffixScale?: number;
  /** small black pill (default "reported"; false = none) and when it pops (default with the count) */
  pill?: string | false;
  pillAt?: number;
  pillSide?: "above" | "below";
  pillSize?: number;
  /** 1.06 pulse when the value lands (default true) */
  pulse?: boolean;
  /** show the start value in grey before `at` (default true for "count") */
  ghost?: boolean;
  exit?: Exit;
  opacity?: number;
};

const decimalsOf = (v: number) => {
  const s = `${v}`;
  const i = s.indexOf(".");
  return i < 0 ? 0 : Math.min(2, s.length - i - 1);
};

/**
 * A big stat ("49x", "71.5x") that counts up and holds (or lands at once with `land="pop"`), with a small black
 * "reported" pill. The block keeps the final value's width from the first frame, so the "x" never shifts.
 */
export const ReportedStat: React.FC<ReportedStatProps> = ({
  x,
  y,
  value,
  from = 0,
  decimals,
  prefix = "",
  suffix = "x",
  at,
  dur = 28,
  land = "count",
  size = 150,
  suffixScale = 0.62,
  pill = "reported",
  pillAt,
  pillSide = "above",
  pillSize = 36,
  pulse = true,
  ghost,
  exit,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const ex = enterState(f, undefined, exit);
  const dec = decimals ?? decimalsOf(value);
  const fmt = (v: number) => v.toFixed(dec);
  const pop = land === "pop";
  const showGhost = ghost ?? !pop;
  let p: number;
  let numO = 1;
  let blur = 0;
  let popS = 1;
  if (at === undefined) p = 1;
  else if (pop) {
    p = 1;
    const q = prog(f, at, at + 10, EASE.soft);
    numO = Math.min(1, prog(f, at, at + 6, EASE.soft));
    blur = 8 * (1 - q);
    popS = mix(0.84, 1, q);
  } else p = prog(f, at, at + dur, EASE.enter);
  const before = at !== undefined && f < at;
  if (before && !showGhost) numO = 0;
  const v = before ? from : mix(from, value, p);
  const landF = at === undefined ? -1e9 : pop ? at + 4 : at + dur;
  const bump = pulse ? Math.sin(Math.PI * prog(f, landF - 2, landF + 12, EASE.linear)) : 0;
  const ink = before ? theme.color.ghost : mixColor("#8A8A8A", theme.color.ink, pop ? 1 : prog(f, at ?? 0, (at ?? 0) + dur * 0.85, EASE.soft));
  const pAt = pillAt ?? at;
  const pp = pill === false ? 0 : pAt === undefined ? 1 : prog(f, pAt, pAt + 9, EASE.pop);
  const pillEl =
    pill !== false ? (
      <div
        style={{
          alignSelf: "center",
          transform: `scale(${mix(0.55, 1, pp).toFixed(4)})`,
          transformOrigin: pillSide === "above" ? "50% 100%" : "50% 0%",
          opacity: Math.min(1, pp * 2),
          background: theme.color.ink,
          color: "#fff",
          borderRadius: 40,
          padding: `${Math.round(pillSize * 0.2)}px ${Math.round(pillSize * 0.7)}px`,
          fontFamily: INTER,
          fontSize: pillSize,
          fontWeight: 700,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          boxShadow: theme.shadow.pill,
          letterSpacing: 0.2,
        }}
      >
        {pill}
      </div>
    ) : null;
  const text = (s: string) => (
    <>
      {prefix}
      {s}
      <span style={{ fontSize: size * suffixScale, letterSpacing: 0, marginLeft: size * 0.03 }}>{suffix}</span>
    </>
  );
  if (ex.o * opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateX(-50%) ${ex.transform}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: Math.round(size * 0.12),
        opacity: ex.o * opacity,
      }}
    >
      {pillSide === "above" ? pillEl : null}
      <div style={{ display: "grid", fontFamily: INTER, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.04, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ gridArea: "1 / 1", visibility: "hidden", whiteSpace: "nowrap" }}>{text(fmt(value))}</span>
        <span
          style={{
            gridArea: "1 / 1",
            justifySelf: "end",
            whiteSpace: "nowrap",
            color: ink,
            opacity: numO,
            filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
            transform: `scale(${(popS * (1 + 0.06 * bump)).toFixed(4)})`,
            transformOrigin: "50% 60%",
            textShadow: "3px 5px 0 rgba(0,0,0,.06)",
          }}
        >
          {text(fmt(v))}
        </span>
      </div>
      {pillSide === "below" ? pillEl : null}
    </div>
  );
};
