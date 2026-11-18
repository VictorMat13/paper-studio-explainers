import React from "react";
import { Composition, Folder } from "remotion";
import { GithubEp08, type Ep08Props } from "./ptp08/GithubEp08";
import { TIMELINE } from "./ptp08/timing";
import { DEMO_LEN, PaperStudioDemo } from "./paperstudio/Demo";
import { DEMO05_LEN, PaperStudioDemo05 } from "./paperstudio/Demo05";
import { DEMO06_LEN, PaperStudioDemo06 } from "./paperstudio/Demo06";

// Everything in one Studio: `npm run dev`. Each folder also has its own entry.tsx for stills and renders
// (src/ptp08/entry.tsx, src/paperstudio/entry.tsx), so a half-built episode can never break another one.
// A new episode: copy src/ptp08 to src/ptp<NN>, give it its own entry.tsx, and add it here.
const ep08Defaults: Ep08Props = { variant: "A", mute: true };

export const Root: React.FC = () => (
  <>
    <Folder name="Episodes">
      <Composition
        id="GithubEp08"
        component={GithubEp08}
        durationInFrames={TIMELINE.A.total}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={ep08Defaults}
        calculateMetadata={({ props }) => ({ durationInFrames: (TIMELINE[props.variant] ?? TIMELINE.A).total })}
      />
    </Folder>
    <Folder name="Kit-demos">
      <Composition id="PaperStudioDemo" component={PaperStudioDemo} durationInFrames={DEMO_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: true }} />
      <Composition id="PaperStudioDemo05" component={PaperStudioDemo05} durationInFrames={DEMO05_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: true }} />
      <Composition id="PaperStudioDemo06" component={PaperStudioDemo06} durationInFrames={DEMO06_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: true }} />
    </Folder>
  </>
);
