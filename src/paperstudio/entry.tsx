import React from "react";
import { Composition, registerRoot } from "remotion";
import { DEMO_LEN, PaperStudioDemo } from "./Demo";
import { DEMO05_LEN, PaperStudioDemo05 } from "./Demo05";
import { DEMO06_LEN, PaperStudioDemo06 } from "./Demo06";
import { VOXEL_DEMO_LEN, VoxelDemo, VoxelSpecTest } from "./VoxelDemo";

// Paper Studio kit's own render entry (keeps the kit demo independent of src/Root.tsx).
const PaperStudioRoot: React.FC = () => (
  <>
    <Composition id="PaperStudioDemo" component={PaperStudioDemo} durationInFrames={DEMO_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: true }} />
    <Composition id="PaperStudioDemo05" component={PaperStudioDemo05} durationInFrames={DEMO05_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: true }} />
    <Composition id="PaperStudioDemo06" component={PaperStudioDemo06} durationInFrames={DEMO06_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: true }} />
    {/* ep09 voxel world kit demo (WebGL: render with --gl=angle) */}
    <Composition id="VoxelDemo" component={VoxelDemo} durationInFrames={VOXEL_DEMO_LEN} fps={30} width={1080} height={1920} defaultProps={{ crt: false, resolution: 1 }} />
    <Composition id="VoxelSpecTest" component={VoxelSpecTest} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ spec: { terrain: "island", time: "day", trees: 9, cam: { target: [16, 3, 16], dist: 24, yaw: 18 } }, anim: true, resolution: 1 }} />
  </>
);

registerRoot(PaperStudioRoot);
