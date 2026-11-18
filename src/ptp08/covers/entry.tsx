import React from "react";
import { Still, registerRoot } from "remotion";
import { GithubEp08Cover, type CoverProps } from "./Cover";

// ep08 Reel covers (AGENT COVERS): one 1080 x 1920 still per hook, its own entry so nothing else in src/ can break it.
//   npx remotion still src/ptp08/covers/entry.tsx GithubEp08Cover out.png --props='{"hook":"B"}'
const defaultProps: CoverProps = { hook: "A" };

const CoversRoot: React.FC = () => <Still id="GithubEp08Cover" component={GithubEp08Cover} width={1080} height={1920} defaultProps={defaultProps} />;

registerRoot(CoversRoot);
