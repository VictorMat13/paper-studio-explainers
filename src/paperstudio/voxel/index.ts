// The ep09 voxel world kit (Minecraft-look world for Paper Studio reels). Import from here:
//   import { VoxelWorld, dayWorld, nightWorld, SPAWN, SHELTERS, interior, camWide, camKeys, lerpCam } from "../../paperstudio/voxel";
export { VoxelWorld, WorldScene, type VoxelWorldProps } from "./VoxelWorld";
export type {
  WorldSpec,
  VoxelCam,
  CamSpec,
  AgentSpec,
  AgentLook,
  TimeSpec,
  TimeName,
  ShelterSpec,
  FrameSpec,
  FarmSpec,
  BlockSpec,
  CrowdSpec,
  LyingSpec,
  ItemSpec,
  PuffSpec,
  FallingSpec,
  FallingTreeSpec,
} from "./types";
export { C, camWide, SPAWN, spec, dayWorld, nightWorld, SHELTERS, interior } from "./defaultSpecs";
export {
  CAM_DEFAULTS,
  fullCam,
  camPosition,
  applyCam,
  makeCamera,
  projectToReel,
  projectToScreen,
  skyPointAt,
  lerpCam,
  camKeys,
  orbitCam,
  pushCam,
  tiltCam,
  followCam,
  driftCam,
  VoxelCameraRig,
  type CamKey,
} from "./VoxelCamera";
export { Sky, SKY, col, resolveTime, nightness, skyState, sunArcPos, discWorldPos, type SkyState, type SkyProps } from "./Sky";
export { Blocks, AnimatedBlocks, FallingTree, blockData, fallPose } from "./Blocks";
export { Agent, limbAngles, type AgentProps } from "./Agent";
export { Entities, Door, doorPos, hutTorchPos, crowdAgents, mobAgents, lyingAgents, groundOf, torchFlicker } from "./Entities";
export { Puff, Puffs, puffParticle } from "./Particles";
export { N, RAD, heightAt, groundAt, surfaceKind, treeSpots, treeCells, treeNear, fallingOf, staticBlocks, buildBlocks, blockKeyOf, type Block } from "./island";
export { mat, BOX, SKINS, GREY, ZOMBIE, skinMats, skinKey, skinSetOf, lamb, itemMat, type BlockKind, type SkinSet, type SkinMats } from "./materials";
export { T, ptex, type ItemKind, type RGB } from "./textures";
export { rng, vnoise, hash01 } from "./util";
