import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Ground, theme } from "../kit";
import { bodyOf, hookOf, useCurrentShot, useGlobalFrame, useTiming, useWords } from "../timing";

// PLACEHOLDER (INFRA, ep08 Wave 1). Shows which shot is on screen (A07b.2 when split, plus any merged ids), its spoken
// words (grey until the voice reaches them) and the frame, so timing can be checked before the builders replace each
// group's beat. Not a design. `dark` = the slightly darker CTA ground.
export const Placeholder: React.FC<{ title: string; dark?: (shotBase: string) => boolean }> = ({ title, dark }) => {
  const t = useTiming();
  const gf = useGlobalFrame();
  const shot = useCurrentShot();
  const words = useWords(shot ? shot.base : { from: 0, to: 0 });
  const f = useCurrentFrame(); // group-local, same frames as useWords
  const { safe, font, color } = theme;
  const merged = shot?.alias.length ? ` + ${shot.alias.map((a) => a.id).join(", ")}` : "";
  return (
    <AbsoluteFill>
      <Ground dark={shot && dark ? dark(shot.base) : false} />
      <div
        style={{
          position: "absolute",
          left: safe.x0 + 40,
          width: safe.x1 - safe.x0 - 80,
          top: 520,
          fontFamily: font.sans,
          color: color.ink,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2, color: color.mute }}>{title}</div>
        <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1.1, marginTop: 10 }}>
          {shot ? shot.id : "-"}
          <span style={{ fontSize: 60 }}>{merged}</span>
        </div>
        <div style={{ fontSize: 34, fontWeight: 400, color: color.mute, marginTop: 6 }}>
          {shot ? `${shot.kind} · ${shot.group} · f ${shot.start}-${shot.end - 1} (${shot.dur})${shot.parts > 1 ? ` · part ${shot.part + 1} of ${shot.parts}` : ""}` : ""}
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.25, marginTop: 60 }}>
          {shot && shot.kind === "spoken"
            ? words.length
              ? words.map((w, i) => (
                  <span key={i} style={{ color: f >= w.f ? color.ink : color.ghost }}>
                    {w.w}{" "}
                  </span>
                ))
              : "(pause, hand-off)"
            : shot?.kind === "break"
              ? "(blur break)"
              : "(tail hold)"}
        </div>
      </div>
      <div style={{ position: "absolute", left: safe.x0 + 20, top: safe.y1 - 70, fontFamily: font.sans, fontSize: 34, color: color.mute }}>
        {t.variant} (H{hookOf(t.variant)} + Body{bodyOf(t.variant)}) · f {gf} / {t.total}
        {t.provisional ? " · provisional timing" : ""}
      </div>
    </AbsoluteFill>
  );
};
