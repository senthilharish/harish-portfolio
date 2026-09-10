// Single source of truth for the Azeem Agency cinematic sequence.
// Both the 3D scene (camera + object states) and the HTML overlay read from
// the same 0..1 scroll `progress` value so they never fall out of sync.

export const BEATS = {
  call: [0.0, 0.1],
  agency: [0.1, 0.3],
  requirements: [0.3, 0.46],
  blueprint: [0.46, 0.56],
  design: [0.56, 0.63],
  codeApp: [0.63, 0.7],
  buildTest: [0.7, 0.85],
  approval: [0.85, 0.9],
  deploy: [0.9, 0.96],
  final: [0.96, 1.0],
};

export function beatLocal(name, progress) {
  const [start, end] = BEATS[name];
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

export function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// Camera keyframes: position + look-at target, spread along a "travel path"
// where -Z is deeper into the story. Interpolated piecewise between the two
// bracketing keyframes for the current progress, eased with smoothstep.
export const CAMERA_PATH = [
  // Opening: behind/beside the laptop, eye-level, laptop fills the frame.
  { t: 0.0, pos: [0.05, 1.42, 3.3], look: [-0.25, 1.12, -0.4] },
  // Slow dolly in — the code on screen becomes readable.
  { t: 0.03, pos: [-0.05, 1.32, 1.7], look: [-0.32, 1.05, -0.25] },
  // Phone begins vibrating — rack focus starts drifting toward it.
  { t: 0.05, pos: [0.32, 1.28, 0.95], look: [0.55, 1.08, 0.15] },
  // Close on the lit phone screen: INCOMING CALL.
  { t: 0.065, pos: [0.66, 1.16, 0.5], look: [0.84, 1.05, 0.08] },
  // Pull back to a medium shot — the developer is revealed answering.
  { t: 0.08, pos: [0.1, 1.4, 1.5], look: [0, 1.3, 0.2] },
  // He sets the phone down and looks back to the laptop.
  { t: 0.1, pos: [-0.15, 1.5, 2.1], look: [-0.1, 1.15, -0.4] },
  // Push toward the screen — the title card moment.
  { t: 0.125, pos: [-0.3, 1.22, 0.55], look: [-0.4, 1.02, -0.35] },
  // Through the screen, into the travel toward the agency.
  { t: 0.15, pos: [0, 1.75, -3.5], look: [0, 1, -9] },
  { t: 0.16, pos: [0, 1.8, -6], look: [0, 1, -14] },
  { t: 0.2, pos: [-1.2, 1.2, -10], look: [-1.2, 0.9, -14] },
  { t: 0.24, pos: [-1.35, 1.0, -12.8], look: [-1.4, 0.82, -13.6] },
  { t: 0.27, pos: [-1.42, 0.9, -13.3], look: [-1.42, 0.8, -13.55] },
  { t: 0.305, pos: [-0.6, 0.95, -13.1], look: [-0.4, 0.82, -13.6] },
  { t: 0.34, pos: [0.3, 0.95, -13.2], look: [0.55, 0.82, -13.6] },
  { t: 0.38, pos: [-1.2, 2.2, -9], look: [-1.2, 1, -14] },
  { t: 0.42, pos: [-0.7, 1.2, -13.8], look: [-1.1, 1.05, -14.2] },
  { t: 0.46, pos: [-0.9, 1.1, -14.6], look: [-1.15, 1.0, -15.0] },
  { t: 0.5, pos: [-0.6, 1.4, -18], look: [-0.6, 1.2, -19] },
  { t: 0.56, pos: [-0.3, 1.5, -20.5], look: [-0.3, 1.2, -19] },
  { t: 0.6, pos: [0, 1.2, -25.5], look: [0, 1.0, -27] },
  { t: 0.65, pos: [-1.1, 1.15, -31.5], look: [0.1, 1.0, -32] },
  { t: 0.7, pos: [0.2, 1.15, -37.5], look: [0.2, 1.0, -39] },
  { t: 0.75, pos: [1.0, 1.15, -38.2], look: [1.0, 1.0, -39] },
  { t: 0.78, pos: [1.05, 1.05, -38.8], look: [1.05, 0.95, -39] },
  { t: 0.82, pos: [0.2, 1.2, -37.8], look: [0.2, 1.0, -39] },
  { t: 0.86, pos: [-0.5, 1.25, -43.5], look: [0, 1.0, -45] },
  { t: 0.9, pos: [0, 2.2, -51], look: [0, 1.4, -53] },
  { t: 0.94, pos: [0, 3.2, -50], look: [0, 1.4, -53] },
  { t: 1.0, pos: [0, 14, -30], look: [0, 2, -35] },
];

export function sampleCameraPath(progress) {
  const path = CAMERA_PATH;
  let i = 0;
  while (i < path.length - 2 && progress > path[i + 1].t) i++;
  const a = path[i];
  const b = path[i + 1];
  const span = b.t - a.t || 1;
  const localT = smoothstep(Math.max(0, Math.min(1, (progress - a.t) / span)));
  const pos = a.pos.map((v, idx) => v + (b.pos[idx] - v) * localT);
  const look = a.look.map((v, idx) => v + (b.look[idx] - v) * localT);
  return { pos, look };
}
