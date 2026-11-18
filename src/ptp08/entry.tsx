import React from "react";
import { Composition, registerRoot } from "remotion";
import { GithubEp08, type Ep08Props } from "./GithubEp08";
import { TIMELINE } from "./timing";

// ep08's own render entry (a half-built comp elsewhere in src/Root.tsx can't break its stills and renders).
// One composition; the variant prop picks the video and sets the duration from that variant's timeline. 18 variants:
// the Instagram videos A, B, C, AB, AC, BA, BC, CA, CB (hook letter first: AB = HA + BodyB), and the YouTube Shorts
// cut of each: AYT, BYT, CYT, ABYT, ACYT, BAYT, BCYT, CAYT, CBYT.
//   npx remotion render src/ptp08/entry.tsx GithubEp08 out.mp4 --props='{"variant":"B","mute":false}'
//   npx remotion render src/ptp08/entry.tsx GithubEp08 out.mp4 --props='{"variant":"AB","mute":false}'
// mute defaults to true in this package: the voiceover files are not shipped. Generate your own (SETUP.md, step 5) and pass "mute":false.
const defaultProps: Ep08Props = { variant: "A", mute: true };

const Ep08Root: React.FC = () => (
  <Composition
    id="GithubEp08"
    component={GithubEp08}
    durationInFrames={TIMELINE.A.total}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={defaultProps}
    calculateMetadata={({ props }) => ({ durationInFrames: (TIMELINE[props.variant] ?? TIMELINE.A).total })}
  />
);

registerRoot(Ep08Root);
