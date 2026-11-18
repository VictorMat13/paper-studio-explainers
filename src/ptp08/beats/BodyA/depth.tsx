// STYLE UPLIFT depth helpers: a parallax layer (moves at `rate` of the camera: 1 = world, 0.75 = background sheets,
// 1.12 = a foreground object catching the push) and the paper sheets that peek at the edges behind a scene's subject,
// fluttering 1 px and turning 0.3 deg so a still frame is never frozen.
import React from "react";
import { useCamera } from "../../../paperstudio";

export const Parallax: React.FC<{ rate: number; children: React.ReactNode }> = ({ rate, children }) => {
  const { pose, anchor } = useCamera();
  const k = 1 - rate;
  // the layer keeps part of its place on screen while the world moves under the camera
  const dx = (pose.x - anchor.x) * k;
  const dy = (pose.y - anchor.y) * k;
  return <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)` }}>{children}</div>;
};

export type Sheet = { x: number; y: number; w: number; h: number; rot: number; tone?: number };

/** soft paper sheets (a stage behind the subject), drawn in a 0.75 parallax layer */
export const Sheets: React.FC<{ f: number; sheets: Sheet[]; dx?: number; dy?: number; opacity?: number; rate?: number }> = ({ f, sheets, dx = 0, dy = 0, opacity = 1, rate = 0.75 }) => (
  <Parallax rate={rate}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`, opacity }}>
      {sheets.map((s, i) => {
        const fl = Math.sin((f + i * 37) / (47 + i * 9));
        const top = s.tone ?? 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y + 1.2 * fl,
              width: s.w,
              height: s.h,
              transform: `rotate(${(s.rot + 0.3 * fl).toFixed(3)}deg)`,
              borderRadius: 10,
              background: top ? "linear-gradient(160deg,#F7F5F1 0%,#EFECE7 100%)" : "linear-gradient(160deg,#FCFBF9 0%,#F4F2EE 100%)",
              boxShadow: "2px 2px 0 #E2E0DC,10px 16px 28px rgba(0,0,0,.09),30px 46px 80px rgba(0,0,0,.05),inset 0 0 0 1px rgba(0,0,0,.025)",
            }}
          />
        );
      })}
    </div>
  </Parallax>
);
