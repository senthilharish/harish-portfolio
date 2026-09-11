import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { beatLocal } from './timeline.js';

// Scroll-scrubbed character: loads a rigged GLB and drives its animation
// clip's playback time directly from story progress (instead of real-time
// clock playback), matching how every other beat in this scene is driven.
//
// Usage, once you have a model (see README below):
//   <Character url="/models/clerk.glb" clip="Writing" beat="agency"
//              progressRef={progressRef}
//              position={[0.7, 0.7, AGENCY_Z - 0.3]} rotation={[0, 2.4, 0]} />
//
// --------------------------------------------------------------------------
// HOW TO GET A MODEL (free, rigged, animated):
// 1. mixamo.com -> sign in with a free Adobe account -> pick a character
//    (Characters tab) -> pick an animation (Animations tab, e.g. "Writing",
//    "Sitting Typing", "Sitting Idle") -> Download with these settings:
//      Format: FBX for Unity (or glTF if offered)
//      Skin: With Skin
//      Frame rate: 30
// 2. Convert FBX -> GLB (gltf-transform, or Blender: File > Import FBX,
//    then File > Export glTF 2.0 -> .glb, "Include: Animations" checked).
// 3. Compress it: `npx gltf-transform optimize clerk.fbx.glb clerk.glb
//    --compress draco --texture-compress webp` keeps it small (~1-2MB)
//    and cheap to render on low-end devices.
// 4. Drop clerk.glb into /public/models/, then mount <Character .../> below.
// --------------------------------------------------------------------------

export default function Character({
  url,
  clip,
  beat,
  progressRef,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const action = actions?.[clip] || Object.values(actions || {})[0];
    if (!action) return;
    action.play();
    action.paused = true; // we drive .time manually, not the internal clock
    return () => action.stop();
  }, [actions, clip]);

  useFrame(() => {
    const action = actions?.[clip] || Object.values(actions || {})[0];
    if (!action) return;
    const p = beatLocal(beat, progressRef?.current || 0);
    action.time = p * action.getClip().duration;
    action.getMixer().update(0); // apply the manually-set time, no auto-advance
  });

  return (
    <primitive
      ref={group}
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
