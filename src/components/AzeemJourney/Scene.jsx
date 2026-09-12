import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCanvasTexture, roundRect } from './canvasTexture.js';
import { BEATS, beatLocal, sampleCameraPath, smoothstep } from './timeline.js';
import Character from './Character.jsx';

const ORANGE = '#ff5b1f';
const BLUE = '#2f5fff';
const PAPER = '#e9e4d8';
const INK = '#20232b';

/* ---------------------------------------------------------------- screens */

function usePhoneScreen(draw, w = 256, h = 512) {
  return useCanvasTexture(w, h, draw);
}

/* ------------------------------------------------------------ Desk group */

const FILE_TREE = ['azeem_erp/', ' lib/', '  models/', '  screens/', '  services/', '  widgets/', '  main.dart'];
const DESK_CODE_LINES = [
  [{ t: 'kw', v: 'import ' }, { t: 'str', v: "'package:flutter/material.dart'" }, { t: '', v: ';' }],
  [{ t: '', v: '' }],
  [{ t: 'kw', v: 'void ' }, { t: 'fn', v: 'main' }, { t: '', v: '() => ' }, { t: 'fn', v: 'runApp' }, { t: '', v: '(' }, { t: '', v: 'AzeemApp' }, { t: '', v: '());' }],
  [{ t: '', v: '' }],
  [{ t: 'kw', v: 'class ' }, { t: '', v: 'AzeemApp ' }, { t: 'kw', v: 'extends ' }, { t: '', v: 'StatelessWidget {' }],
  [{ t: '', v: '  ' }, { t: 'kw', v: '@override' }],
  [{ t: '', v: '  Widget ' }, { t: 'fn', v: 'build' }, { t: '', v: '(BuildContext ctx) {' }],
  [{ t: '', v: '    return ' }, { t: '', v: 'MaterialApp(' }],
  [{ t: '', v: "      title: 'Azeem ERP'," }],
  [{ t: '', v: '      home: DashboardScreen(),' }],
  [{ t: '', v: '    );' }],
  [{ t: '', v: '  }' }],
  [{ t: '', v: '}' }],
];

function drawLaptopCode(ctx, w, h, cursorOn) {
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);
  // sidebar
  const sidebarW = w * 0.28;
  ctx.fillStyle = '#0a0d13';
  ctx.fillRect(0, 0, sidebarW, h);
  ctx.font = '400 13px "Space Mono", monospace';
  FILE_TREE.forEach((line, i) => {
    ctx.fillStyle = i === FILE_TREE.length - 1 ? BLUE : 'rgba(255,255,255,0.55)';
    ctx.fillText(line, 10, 26 + i * 22);
  });
  // editor
  ctx.font = '400 13px "Space Mono", monospace';
  let y = 26;
  DESK_CODE_LINES.forEach((line) => {
    let x = sidebarW + 16;
    line.forEach((p) => {
      ctx.fillStyle = p.t === 'kw' ? BLUE : p.t === 'fn' ? ORANGE : p.t === 'str' ? '#6bd97f' : 'rgba(255,255,255,0.85)';
      ctx.fillText(p.v, x, y);
      x += ctx.measureText(p.v).width;
    });
    if (cursorOn && line === DESK_CODE_LINES[DESK_CODE_LINES.length - 1]) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 2, y - 12, 7, 15);
    }
    y += 22;
  });
}

// Two-lens camera module: a vertical pill-shaped housing holding two stacked
// lenses, with the flash dot sitting just outside the housing's upper-right
// edge — modeled after the iPhone 16 back-camera layout.
function PhoneCameraBump({ scale = 1, plateColor = '#dedbd2' }) {
  const s = scale;
  const lensPositions = [
    [0, 0.029 * s],
    [0, -0.029 * s],
  ];
  return (
    <group>
      <RoundedBox args={[0.05 * s, 0.116 * s, 0.018 * s]} radius={0.025 * s} smoothness={4} position={[0, 0, 0.008 * s]}>
        <meshStandardMaterial color={plateColor} roughness={0.4} metalness={0.15} />
      </RoundedBox>
      {lensPositions.map(([x, y], i) => (
        <group key={i} position={[x, y, 0.017 * s]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.02 * s, 0.02 * s, 0.007, 32]} />
            <meshStandardMaterial color="#3a3a3d" roughness={0.25} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.0045, 0]}>
            <cylinderGeometry args={[0.014 * s, 0.014 * s, 0.004, 32]} />
            <meshPhysicalMaterial color="#050506" roughness={0.08} metalness={0.2} clearcoat={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.034 * s, 0.045 * s, 0.013 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.007 * s, 0.007 * s, 0.003, 16]} />
        <meshStandardMaterial color="#f0eee6" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Apple-logo silhouette rendered to a canvas texture and mapped onto a
// transparent plane — cheaper and crisper than modeling the logo as geometry.
const APPLE_LOGO_PATH =
  'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.087 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.416-2.079-3.611-2.311-4.39-2.364-2-.16-3.675 1.09-4.61 1.09zm3.24-2.98c.84-1.013 1.404-2.424 1.25-3.83-1.21.052-2.674.805-3.541 1.817-.78.898-1.462 2.335-1.278 3.714 1.35.104 2.735-.685 3.57-1.7z';

function useAppleLogoTexture(color) {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const path = new Path2D(APPLE_LOGO_PATH);
    const scale = size / 24;
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.fill(path);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [color]);
}

// Shared realistic phone shell: matte body, inset bezel, a top notch/island
// cutout and a back camera module — reused for every phone in the scene so
// they read consistently (based on standard smartphone front/back/side
// product photography proportions).
//
// The body's rounding radius must stay under half its depth (here
// 0.048 / 2 = 0.024) or RoundedBox produces a pinched, banana-like mesh
// instead of a flat rounded rectangle — that was the earlier bug. Depth is
// kept close to a real phone's thickness-to-width ratio (~11%) so it reads
// as a slim handset rather than a thick bar.
function PhoneShell({ position, rotation, scale = 1, texture, bodyColor = '#f2f1ec' }) {
  const appleLogoTexture = useAppleLogoTexture('rgba(20,20,22,0.4)');
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[0.44, 0.9, 0.048]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.25} />
      </RoundedBox>
      {/* bezel — sits proud of the body's front face (half-depth 0.024) so
          it isn't hidden behind the opaque shell */}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.4, 0.84]} />
        <meshStandardMaterial color="#020203" roughness={0.55} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[0.37, 0.74]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* dynamic-island notch */}
      <mesh position={[0, 0.365, 0.029]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.011, 0.05, 4, 12]} />
        <meshStandardMaterial color="#000" roughness={0.9} />
      </mesh>
      {/* camera module, back — stands proud of the rear face (-0.024) */}
      <group position={[-0.13, 0.31, -0.028]} rotation={[Math.PI, 0, 0]}>
        <PhoneCameraBump scale={1.75} plateColor={bodyColor} />
      </group>
      {/* Apple logo, back — centered, flush against the rear face */}
      <group position={[0, -0.02, -0.0245]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <planeGeometry args={[0.13, 0.13]} />
          <meshBasicMaterial map={appleLogoTexture} transparent toneMapped={false} />
        </mesh>
      </group>
      {/* side buttons */}
      <mesh position={[0.223, 0.17, 0]}>
        <boxGeometry args={[0.006, 0.09, 0.012]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[-0.223, -0.02, 0]}>
        <boxGeometry args={[0.006, 0.05, 0.012]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[-0.223, 0.08, 0]}>
        <boxGeometry args={[0.006, 0.05, 0.012]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.35} metalness={0.55} />
      </mesh>
    </group>
  );
}

// Incoming-call lock screen shown on the desk phone: pulsing rings behind
// an avatar while ringing, a decline/accept pair, then a "connected" state
// with a running timer once the developer answers.
function drawCallScreen(ctx, w, h, phoneState, pulse) {
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '400 11px "Space Mono", monospace';
  ctx.fillText('9:41', w / 2, 22);

  const cx = w / 2;
  const cy = h * 0.34;
  const r = 42;

  if (phoneState === 'idle') {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '400 13px "Space Mono", monospace';
    ctx.fillText('Locked', cx, cy);
    return;
  }

  const ringing = phoneState === 'ringing';
  ctx.fillStyle = ringing ? ORANGE : '#5be07b';
  ctx.font = '700 12px "Space Mono", monospace';
  ctx.fillText(ringing ? 'INCOMING CALL' : 'CONNECTED', cx, h * 0.16);

  if (ringing) {
    for (let i = 0; i < 2; i++) {
      const rp = (pulse + i * 0.5) % 1;
      ctx.strokeStyle = `rgba(255,91,31,${0.4 * (1 - rp)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + rp * 28, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, '#ff9a3d');
  grad.addColorStop(1, ORANGE);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 30px "Space Mono", monospace';
  ctx.fillText('AA', cx, cy + 11);

  ctx.fillStyle = '#fff';
  ctx.font = '700 19px "Inter", sans-serif';
  ctx.fillText('Azeem Agency', cx, cy + r + 32);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '400 12px "Space Mono", monospace';
  ctx.fillText(ringing ? 'mobile' : 'Call connecting…', cx, cy + r + 52);

  const by = h * 0.86;
  const drawBtn = (x, color, rotate) => {
    ctx.beginPath();
    ctx.arc(x, by, 24, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.save();
    ctx.translate(x, by);
    ctx.rotate(rotate);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, 5);
    ctx.lineTo(0, -7);
    ctx.lineTo(7, 5);
    ctx.stroke();
    ctx.restore();
  };
  if (ringing) {
    drawBtn(cx - 38, '#ff3b30', Math.PI * 0.75);
    drawBtn(cx + 38, '#34c759', 0);
  } else {
    drawBtn(cx, '#ff3b30', Math.PI * 0.75);
  }
}

// Realistic ceramic mug: white body, dark coffee surface, a handle, and
// thin translucent steam ribbons that drift and curl upward (not smoke/fog —
// kept as narrow, sparse strands with low, fading opacity).
function CoffeeCup({ position }) {
  const steamRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    steamRefs.current.forEach((m, i) => {
      if (!m) return;
      const speed = 0.35 + i * 0.05;
      const cycle = (t * speed + i * 0.6) % 1.4;
      m.position.y = cycle * 0.16;
      m.position.x = Math.sin(t * 1.4 + i * 2) * 0.012 * cycle;
      m.rotation.z = Math.sin(t * 1.1 + i) * 0.3;
      const fade = cycle < 1.2 ? 1 - cycle / 1.2 : 0;
      m.material.opacity = 0.22 * fade * (1 - i * 0.15);
      const s = 1 + cycle * 0.6;
      m.scale.set(s, 1, s);
    });
  });

  return (
    <group position={position}>
      {/* mug body — open-ended so the interior rim/tea disc aren't hidden
          (or z-fought) behind a solid opaque cap at the same height */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.06, 0.052, 0.09, 24, 1, true]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.25} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* mug base — closes the bottom so the cup doesn't look hollow from below */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.052, 24]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.25} metalness={0.05} />
      </mesh>
      {/* interior rim — flat annulus at the cup's lip, kept clear of the tea
          surface below so the two flat discs never z-fight (that overlap
          was the cause of the earlier pinwheel/spinning artifact) */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.054, 24]} />
        <meshStandardMaterial color="#efece4" roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* tea surface — plain, still, natural brown, subtle reflection only */}
      <mesh position={[0, 0.083, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.05, 24]} />
        <meshStandardMaterial color="#8a5a2e" roughness={0.35} metalness={0} />
      </mesh>
      {/* handle */}
      <mesh position={[0.062, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.026, 0.007, 10, 20, Math.PI * 1.3]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.25} metalness={0.05} />
      </mesh>
      {/* steam ribbons */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (steamRefs.current[i] = el)}
          position={[(i - 1) * 0.015, 0.09, 0]}
        >
          <planeGeometry args={[0.014, 0.05]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function DeskGroup({ progressRef }) {
  const laptopScreen = usePhoneScreen((ctx, w, h) => drawLaptopCode(ctx, w, h, true), 640, 400);
  const phoneScreen = usePhoneScreen((ctx, w, h) => drawCallScreen(ctx, w, h, 'idle', 0), 220, 440);

  const cursorBlinkRef = useRef(0);
  const glowRef = useRef();
  const phoneStateRef = useRef('idle');

  useEffect(() => {
    document.fonts.ready.then(() => laptopScreen.redraw((ctx, w, h) => drawLaptopCode(ctx, w, h, true)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    // Blinking editor cursor for subtle "still typing" life.
    const blink = Math.floor(state.clock.elapsedTime * 1.6) % 2;
    if (blink !== cursorBlinkRef.current) {
      cursorBlinkRef.current = blink;
      laptopScreen.redraw((ctx, w, h) => drawLaptopCode(ctx, w, h, blink === 0));
    }

    // Phone lights up and rings, then shows the call connecting once the
    // developer answers — screen faces up so it reads clearly on camera.
    const p = beatLocal('call', progressRef.current || 0);
    const ringing = p > 0.34 && p < 0.8;
    const answered = p >= 0.8;
    if (glowRef.current) {
      glowRef.current.intensity = ringing ? 1.4 + Math.sin(state.clock.elapsedTime * 14) * 0.6 : 0;
    }
    const phoneState = answered ? 'answered' : ringing ? 'ringing' : 'idle';
    const pulse = (state.clock.elapsedTime * 0.6) % 1;
    if (phoneState !== phoneStateRef.current || phoneState === 'ringing') {
      phoneStateRef.current = phoneState;
      phoneScreen.redraw((ctx, w, h) => drawCallScreen(ctx, w, h, phoneState, pulse));
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <RoundedBox args={[2.4, 0.08, 1.2]} radius={0.03} position={[0, 0.7, 0]}>
        <meshStandardMaterial color="#2a1d14" roughness={0.55} />
      </RoundedBox>
      {/* legs */}
      {[[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#16171d" />
        </mesh>
      ))}
      {/* laptop */}
      <group position={[-0.4, 0.75, -0.1]}>
        <RoundedBox args={[0.9, 0.04, 0.6]} radius={0.02}>
          <meshStandardMaterial color="#22232a" roughness={0.4} metalness={0.3} />
        </RoundedBox>
        {/* built-in keyboard deck — individual keycaps, no separate external keyboard */}
        <group position={[0, 0.021, 0.06]}>
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 12 }).map((__, col) => (
              <RoundedBox
                key={`${row}-${col}`}
                args={[0.055, 0.006, 0.05]}
                radius={0.006}
                position={[-0.36 + col * 0.062, 0, -0.18 + row * 0.06]}
              >
                <meshStandardMaterial color="#16171b" roughness={0.55} metalness={0.15} />
              </RoundedBox>
            ))
          )}
          {/* trackpad */}
          <RoundedBox args={[0.32, 0.003, 0.2]} radius={0.01} position={[0, -0.002, 0.24]}>
            <meshStandardMaterial color="#2c2d33" roughness={0.3} metalness={0.35} />
          </RoundedBox>
        </group>
        <group position={[0, 0.28, -0.29]} rotation={[-0.35, 0, 0]}>
          <RoundedBox args={[0.9, 0.56, 0.03]} radius={0.02}>
            <meshStandardMaterial color="#1a1b20" roughness={0.5} />
          </RoundedBox>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.82, 0.48]} />
            <meshBasicMaterial map={laptopScreen.texture} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* phone — lying screen-up on the desk so the call UI reads on camera */}
      <group position={[0.55, 0.735, 0.15]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <PhoneShell scale={0.5} texture={phoneScreen.texture} />
        <pointLight ref={glowRef} position={[0, 0, 0.08]} color={ORANGE} intensity={0} distance={0.6} />
      </group>
      {/* notebook + pen */}
      <group position={[0.7, 0.735, -0.35]} rotation={[-Math.PI / 2, 0, -0.1]}>
        <mesh>
          <planeGeometry args={[0.26, 0.34]} />
          <meshStandardMaterial color="#c8c2ad" roughness={0.9} />
        </mesh>
      </group>
      {/* pencil — wooden body, sharpened graphite tip, eraser, fully visible end to end */}
      <group position={[0.82, 0.752, -0.22]} rotation={[0, 0.5, Math.PI / 2.3]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.19, 6]} />
          <meshStandardMaterial color="#e8b23a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <coneGeometry args={[0.007, 0.03, 6]} />
          <meshStandardMaterial color="#d8b06a" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.122, 0]}>
          <coneGeometry args={[0.0022, 0.012, 6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.098, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.012, 12]} />
          <meshStandardMaterial color="#c9c9c9" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.108, 0]}>
          <cylinderGeometry args={[0.0075, 0.0075, 0.014, 12]} />
          <meshStandardMaterial color="#e6a3b0" roughness={0.6} />
        </mesh>
      </group>
      {/* coffee cup — ceramic mug with coffee, handle, and rising steam */}
      <CoffeeCup position={[0.95, 0.735, -0.35]} />
      {/* desk lamp */}
      <group position={[-1.15, 0.7, -0.62]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.09, 0.1, 0.02, 16]} />
          <meshStandardMaterial color="#141519" />
        </mesh>
        <mesh position={[0.02, 0.42, 0.02]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.012, 0.012, 0.75, 8]} />
          <meshStandardMaterial color="#1c1d24" />
        </mesh>
        <mesh position={[0.16, 0.74, 0.02]} rotation={[0, 0, -0.9]}>
          <coneGeometry args={[0.09, 0.16, 16, 1, true]} />
          <meshStandardMaterial color="#1a1b20" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.24, 0.68, 0.02]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={ORANGE} toneMapped={false} />
        </mesh>
      </group>
      {/* backpack near the chair */}
      <RoundedBox args={[0.26, 0.34, 0.16]} radius={0.05} position={[-1.5, 0.87, 0.85]} rotation={[0, 0.3, 0]}>
        <meshStandardMaterial color="#3a3630" roughness={0.85} />
      </RoundedBox>
      {/* desk lamp glow */}
      <pointLight position={[-1.15, 1.15, -0.6]} color={ORANGE} intensity={2.6} distance={3.2} />
    </group>
  );
}

/* ---------------------------------------------------------- Agency group */

const AGENCY_Z = -13.6;

const SHELF_ROWS = 3;
const SHELF_COLS = 12;
const SHELF_COUNT = SHELF_ROWS * SHELF_COLS;

// The old, uneven shelf stock: rows staggered in z and each box's rotation
// jittered at random, reading as clutter rather than inventory.
function Shelving({ progressRef }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Per-box randomness fixed at mount so the messy pose and the staggered
  // arrival order are each stable across frames instead of reshuffling.
  const messyJitter = useMemo(
    () => Array.from({ length: SHELF_COUNT }, () => (Math.random() - 0.5) * 0.35),
    []
  );
  const arrivalOrder = useMemo(
    () => Array.from({ length: SHELF_COUNT }, () => Math.random()),
    []
  );

  useFrame(() => {
    if (!ref.current) return;
    const p = beatLocal('agencyStock', progressRef.current || 0);
    // First fifth of the stock beat: the old clutter is cleared away.
    // Remaining span: crates arrive one by one into a clean grid.
    const CLEAR_END = 0.2;
    let i = 0;
    for (let row = 0; row < SHELF_ROWS; row++) {
      for (let col = 0; col < SHELF_COLS; col++) {
        const idx = i;
        const gridX = -3.6 + col * 0.34;
        const gridY = 0.3 + row * 0.42;
        const gridZ = AGENCY_Z - 2.4;

        if (p < CLEAR_END) {
          // Clearing: the old, unevenly-stacked box shrinks and lifts away.
          const clearP = smoothstep(p / CLEAR_END);
          dummy.position.set(gridX, gridY + clearP * 0.7, gridZ - (row % 2) * 0.15);
          dummy.rotation.set(0, messyJitter[idx], 0);
          dummy.scale.setScalar(Math.max(1 - clearP, 0.0001));
        } else {
          // Organizing: each crate is carried in and set down squarely on
          // the grid, staggered by its own arrival time so they visibly
          // arrive one after another rather than all popping in at once.
          const organizeP = (p - CLEAR_END) / (1 - CLEAR_END);
          const arriveAt = arrivalOrder[idx] * 0.65;
          const local = smoothstep(THREE.MathUtils.clamp((organizeP - arriveAt) / 0.22, 0, 1));
          dummy.position.set(gridX, gridY + (1 - local) * 0.6, gridZ);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(Math.max(local, 0.0001));
        }
        dummy.updateMatrix();
        ref.current.setMatrixAt(idx, dummy.matrix);
        i++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, SHELF_COUNT]}>
      <boxGeometry args={[0.3, 0.36, 0.3]} />
      <meshStandardMaterial color="#5a4230" roughness={0.9} />
    </instancedMesh>
  );
}

// Hides its children outside a given [start, end) window of overall scroll
// progress — used to swap between the clerk's three seated animations
// (write / calculate / check stock) without all three overlapping at once.
function BeatVisible({ progressRef, range, children }) {
  const ref = useRef();
  useFrame(() => {
    const p = progressRef.current || 0;
    if (ref.current) ref.current.visible = p >= range[0] && p < range[1];
  });
  return <group ref={ref}>{children}</group>;
}

function ScreenPlane({ position, rotation, size, texture, frameColor = '#26272e' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[size[0] + 0.06, size[1] + 0.06]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

// The same three surfaces, redrawn as their digital equivalents — swapped
// in during the `final` beat's reprise so the user recognizes this as the
// SAME table from the opening, now running the finished product.
function drawNotebookAfter(ctx, w, h) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '700 30px "Inter", sans-serif';
  ctx.fillText('Azeem Agency', 30, 56);
  ctx.fillStyle = '#5be07b';
  ctx.font = '700 16px "Space Mono", monospace';
  ctx.fillText('ORDER #AZ-0912 · SYNCED', 30, 86);
  const rows = [['Coke', '5'], ['Biscuits', '10'], ['Soap', '8']];
  rows.forEach(([a, b], i) => {
    const y = 140 + i * 52;
    roundRect(ctx, 24, y - 30, w - 48, 44, 10);
    ctx.fillStyle = '#131a29';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillText(a, 40, y - 2);
    ctx.textAlign = 'right';
    ctx.fillText(b, w - 40, y - 2);
    ctx.textAlign = 'left';
  });
  ctx.fillStyle = '#5be07b';
  ctx.font = '700 26px "Inter", sans-serif';
  ctx.fillText('Total: ₹12,450', 30, 140 + 3 * 52 + 10);
}

function drawCalcAfter(ctx, w, h) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#5be07b';
  ctx.font = '700 46px "Space Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('₹12,450', w - 16, h / 2 + 4);
  ctx.font = '700 13px "Space Mono", monospace';
  ctx.fillText('✓ AUTO-CALCULATED', w - 16, h / 2 + 32);
  ctx.textAlign = 'left';
}

function drawRegisterAfter(ctx, w, h) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '700 26px "Inter", sans-serif';
  ctx.fillText('Live Inventory', 24, 42);
  ctx.fillStyle = '#5be07b';
  ctx.font = '700 13px "Space Mono", monospace';
  ctx.fillText('● REAL-TIME', 24, 64);
  const rows = [['Coke', 120], ['Biscuits', 85], ['Soap', 64]];
  rows.forEach(([label, qty], i) => {
    const y = 96 + i * 46;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '400 20px "Inter", sans-serif';
    ctx.fillText(label, 24, y);
    const barX = 200, barW = w - 240;
    roundRect(ctx, barX, y - 16, barW, 10, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    roundRect(ctx, barX, y - 16, barW * Math.min(1, qty / 150), 10, 5);
    ctx.fillStyle = '#34d399';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 16px "Space Mono", monospace';
    ctx.fillText(String(qty), w - 34, y - 2);
  });
}

// Positions/rotations/sizes mirror the three "before" ScreenPlanes above
// exactly — the swap must land in the same spot for the before/after rhyme
// to read.
const REPRISE_SURFACES = [
  { position: [-1.4, 0.82, AGENCY_Z - 0.04], rotation: [-Math.PI / 2.3, 0, 0.05], size: [0.5, 0.62], draw: drawNotebookAfter, w: 512, h: 640 },
  { position: [-0.4, 0.78, AGENCY_Z - 0.04], rotation: [-Math.PI / 2.3, 0, 0], size: [0.34, 0.15], draw: drawCalcAfter, w: 320, h: 140 },
  { position: [0.55, 0.8, AGENCY_Z - 0.04], rotation: [-Math.PI / 2.3, 0, -0.06], size: [0.46, 0.32], draw: drawRegisterAfter, w: 460, h: 320 },
];

function AgencyReprise({ progressRef }) {
  const surfaces = REPRISE_SURFACES.map((s) => ({
    ...s,
    tex: usePhoneScreen((ctx, w, h) => s.draw(ctx, w, h), s.w, s.h),
  }));
  const matRefs = useRef([]);
  const glowRef = useRef();

  useEffect(() => {
    document.fonts.ready.then(() => surfaces.forEach((s) => s.tex.redraw()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const p = beatLocal('final', progressRef.current || 0);
    // Reveal only in the back half of the beat, once the camera has already
    // arrived at the table — otherwise the swap happens mid-flight and the
    // "same place" recognition never lands.
    const reveal = smoothstep(THREE.MathUtils.clamp((p - 0.55) / 0.4, 0, 1));
    matRefs.current.forEach((m) => { if (m) m.opacity = reveal; });
    if (glowRef.current) glowRef.current.intensity = reveal * 2.4;
  });

  return (
    <group>
      {surfaces.map((s, i) => (
        <mesh key={i} position={s.position} rotation={s.rotation}>
          <planeGeometry args={s.size} />
          <meshBasicMaterial
            ref={(el) => (matRefs.current[i] = el)}
            map={s.tex.texture}
            toneMapped={false}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
      <pointLight ref={glowRef} position={[-1, 1.3, AGENCY_Z + 1]} color="#5be07b" intensity={0} distance={5} />
    </group>
  );
}

// Simple wooden stool for the clerk to sit on while writing — matches the
// shelving's warm wood tone. Seat height (0.45) matches a real stool, which
// is also where the "Writing" clip's hips naturally rest with feet at y=0.
function Stool({ position }) {
  const legPositions = [
    [0.13, 0.13],
    [-0.13, 0.13],
    [0.13, -0.13],
    [-0.13, -0.13],
  ];
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 20]} />
        <meshStandardMaterial color="#5a4230" roughness={0.8} />
      </mesh>
      {legPositions.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.215, z]}>
          <cylinderGeometry args={[0.014, 0.018, 0.43, 8]} />
          <meshStandardMaterial color="#2a1d14" roughness={0.6} />
        </mesh>
      ))}
      {/* low cross braces for stability, purely visual */}
      <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.34]} />
        <meshStandardMaterial color="#2a1d14" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.34]} />
        <meshStandardMaterial color="#2a1d14" roughness={0.6} />
      </mesh>
    </group>
  );
}

function AgencyGroup({ progressRef }) {
  const notebook = usePhoneScreen((ctx, w, h) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(30,40,80,0.18)';
    ctx.lineWidth = 2;
    for (let y = 70; y < h; y += 46) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }
    ctx.fillStyle = INK;
    ctx.font = '700 40px "Caveat", cursive';
    ctx.fillText('AZEEM AGENCY', 30, 55);
    ctx.font = '400 30px "Caveat", cursive';
    ctx.fillText('Retailer: ABC Stores', 30, 108);
    const rows = [['Coke', '5'], ['Biscuits', '10'], ['Soap', '8']];
    rows.forEach(([a, b], i) => {
      ctx.font = '400 30px "Caveat", cursive';
      ctx.fillText(a, 30, 155 + i * 46);
      ctx.fillText(b, w - 90, 155 + i * 46);
    });
    ctx.font = '700 34px "Caveat", cursive';
    ctx.fillStyle = '#7a2b12';
    ctx.fillText('Total: ₹12,450', 30, 155 + 3 * 46 + 20);
  }, 512, 640);

  const calculator = usePhoneScreen((ctx, w, h) => {
    ctx.fillStyle = '#0d1a0d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8fffb0';
    ctx.font = '700 60px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('12,450', w - 16, h / 2 + 18);
  }, 320, 140);

  const register = usePhoneScreen((ctx, w, h) => {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = INK;
    ctx.font = '700 32px "Space Mono", monospace';
    ctx.fillText('STOCK REGISTER', 24, 46);
    const rows = ['COKE — 120', 'BISCUITS — 85', 'SOAP — 64'];
    ctx.font = '400 26px "Space Mono", monospace';
    rows.forEach((r, i) => ctx.fillText(r, 24, 100 + i * 42));
  }, 460, 320);

  useEffect(() => {
    // Wait for the handwriting font so the notebook doesn't lock in a
    // fallback typeface on its one-time draw.
    document.fonts.ready.then(() => {
      notebook.redraw();
      calculator.redraw();
      register.redraw();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      <Shelving progressRef={progressRef} />
      {/* table */}
      <RoundedBox args={[1.6, 0.06, 0.9]} radius={0.02} position={[-0.4, 0.68, AGENCY_Z]}>
        <meshStandardMaterial color="#202127" roughness={0.6} />
      </RoundedBox>
      <ScreenPlane
        position={[-1.4, 0.82, AGENCY_Z - 0.05]}
        rotation={[-Math.PI / 2.3, 0, 0.05]}
        size={[0.5, 0.62]}
        texture={notebook.texture}
      />
      <ScreenPlane
        position={[-0.4, 0.78, AGENCY_Z - 0.05]}
        rotation={[-Math.PI / 2.3, 0, 0]}
        size={[0.34, 0.15]}
        texture={calculator.texture}
      />
      <ScreenPlane
        position={[0.55, 0.8, AGENCY_Z - 0.05]}
        rotation={[-Math.PI / 2.3, 0, -0.06]}
        size={[0.46, 0.32]}
        texture={register.texture}
      />
      <pointLight position={[-1, 1.8, AGENCY_Z + 1]} color={ORANGE} intensity={1.6} distance={6} />
      <pointLight position={[1.5, 1.6, AGENCY_Z - 3]} color="#8a6a3a" intensity={0.8} distance={8} />
      {/* Mixamo exports are in centimeters (~177 units tall); scale 0.01 to
          match this scene's meter-based units. Feet stay grounded (y: 0).
          Each stool/character pair is shifted along x by the same delta as
          its prop's x-offset from the notebook (the position the first
          pair was tuned against), so the seated alignment carries over
          without re-tuning by eye for every station.
          Seated on the near (camera-facing) side of the table — z mirrored
          to AGENCY_Z + offset instead of - offset, rotation flipped by PI
          so he faces back into the table instead of away from camera. */}
      {/* Notebook stool stays empty — no character during agencyWrite. */}
      <Stool position={[-1.18, 0, AGENCY_Z + 0.22]} />

      <Stool position={[-0.18, 0, AGENCY_Z + 0.22]} />
      <BeatVisible progressRef={progressRef} range={BEATS.agencyCalc}>
        <Character
          url="/models/lewis-typing.glb"
          clip="mixamo.com"
          beat="agencyCalc"
          progressRef={progressRef}
          position={[-0.55, 0, AGENCY_Z + 0.5]}
          rotation={[0, 2.4, 0]}
          scale={0.01}
        />
      </BeatVisible>

      <Stool position={[0.77, 0, AGENCY_Z + 0.22]} />
      <BeatVisible progressRef={progressRef} range={BEATS.agencyStock}>
        <Character
          url="/models/lewis-stockcheck.glb"
          clip="mixamo.com"
          beat="agencyStock"
          progressRef={progressRef}
          position={[0.4, 0, AGENCY_Z + 0.5]}
          rotation={[0, 2.4, 0]}
          scale={0.01}
        />
      </BeatVisible>
    </group>
  );
}

/* ---------------------------------------------------- Requirements group */

const REQ_Z = -15.0;
const REQUIREMENTS = [
  'Product Management', 'Stock Management', 'Supplier Management', 'Salesman Orders',
  'Retailer Management', 'Delivery Management', 'Payment Tracking', 'Reports',
];

function drawTabletScreen(ctx, w, h, checked) {
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '700 26px "Anton", sans-serif';
  ctx.fillText('AZEEM AGENCY', 24, 48);
  ctx.fillStyle = ORANGE;
  ctx.font = '700 16px "Space Mono", monospace';
  ctx.fillText('PROJECT REQUIREMENTS', 24, 74);
  REQUIREMENTS.forEach((label, i) => {
    const y = 110 + i * 44;
    const on = i < checked;
    ctx.strokeStyle = on ? BLUE : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    roundRect(ctx, 24, y - 20, 24, 24, 5);
    ctx.stroke();
    if (on) {
      ctx.fillStyle = BLUE;
      ctx.fillText('✓', 28, y - 2);
    }
    ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.45)';
    ctx.font = '400 18px "Space Mono", monospace';
    ctx.fillText(label, 60, y - 1);
  });
}

function RequirementsGroup({ progressRef }) {
  const tablet = usePhoneScreen((ctx, w, h) => drawTabletScreen(ctx, w, h, 0), 460, 560);
  const lastChecked = useRef(-1);

  useEffect(() => {
    tablet.redraw((ctx, w, h) => drawTabletScreen(ctx, w, h, 0));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const p = beatLocal('requirements', progressRef.current || 0);
    const checked = Math.min(REQUIREMENTS.length, Math.floor(p * (REQUIREMENTS.length + 1)));
    if (checked !== lastChecked.current) {
      lastChecked.current = checked;
      tablet.redraw((ctx, w, h) => drawTabletScreen(ctx, w, h, checked));
    }
  });

  return (
    <group position={[-1.1, 0, 0]}>
      <ScreenPlane
        position={[0, 1.05, REQ_Z]}
        rotation={[0, 0.25, 0]}
        size={[0.5, 0.62]}
        texture={tablet.texture}
      />
      <pointLight position={[0, 1.8, REQ_Z + 1.5]} color={BLUE} intensity={1.4} distance={5} />
    </group>
  );
}

/* -------------------------------------------------------- Blueprint group */

const BP_Z = -19;
const BP_TREE = {
  ADMIN: ['Products', 'Stock', 'Orders', 'Payments', 'Reports'],
  SALESMAN: ['Routes', 'Retailers', 'Orders'],
  SUPPLIER: ['Purchase', 'Delivery'],
};

function BlueprintGroup({ progressRef }) {
  const groupRef = useRef();
  const columns = Object.entries(BP_TREE);

  useFrame(() => {
    const p = beatLocal('blueprint', progressRef.current || 0);
    if (groupRef.current) {
      const s = 0.3 + 0.7 * p;
      groupRef.current.scale.setScalar(s);
      groupRef.current.children.forEach((child) => {
        child.traverse((o) => {
          if (o.material) o.material.opacity = p;
        });
      });
    }
  });

  return (
    <group position={[0, 1.5, BP_Z]} ref={groupRef}>
      {columns.map(([root, children], ci) => {
        const x = (ci - 1) * 1.3;
        return (
          <group key={root} position={[x, 0, 0]}>
            <Text position={[0, 0.5, 0]} fontSize={0.11} color={ORANGE} font={undefined} anchorX="center">
              {root}
            </Text>
            <Line points={[[0, 0.42, 0], [0, 0.25, 0]]} color={ORANGE} transparent opacity={0.6} lineWidth={1} />
            {children.map((c, i) => {
              const cy = 0.1 - i * 0.24;
              return (
                <group key={c}>
                  <Line points={[[0, 0.25, 0], [0, cy + 0.06, 0]]} color="#555" transparent opacity={0.4} lineWidth={1} />
                  <mesh position={[0, cy, 0]}>
                    <planeGeometry args={[0.9, 0.16]} />
                    <meshBasicMaterial color="#1c1d24" transparent opacity={0.9} />
                  </mesh>
                  <Text position={[0, cy, 0.01]} fontSize={0.075} color="#fff" anchorX="center">
                    {c}
                  </Text>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/* ----------------------------------------------------------- Design phone */

const DESIGN_Z = -27;
const DESIGN_STAGES = ['LOGIN', 'DASHBOARD', 'PRODUCTS', 'INVENTORY', 'ORDERS', 'RETAILERS'];

// Matches the real Azeem Agency admin dashboard: dark navy surface,
// colorful gradient stat tiles, rounded rows — not a generic mockup.
const NAVY = '#0b0e17';
const TILE_COLORS = [
  ['#7c6bff', '#5b4bd6'],
  ['#ff9a3d', '#e67a1a'],
  ['#34d399', '#0f9b6e'],
  ['#38bdf8', '#0e8fd6'],
];

function drawAppScreen(ctx, w, h, stageIdx) {
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, h);
  if (stageIdx < 0) return;
  const stage = DESIGN_STAGES[Math.min(stageIdx, DESIGN_STAGES.length - 1)];
  ctx.fillStyle = '#fff';
  ctx.font = '700 16px "Inter", sans-serif';
  ctx.fillText(stage.charAt(0) + stage.slice(1).toLowerCase(), 20, 38);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 50);
  ctx.lineTo(w - 20, 50);
  ctx.stroke();

  if (stage === 'LOGIN') {
    ctx.fillStyle = '#fff';
    ctx.font = '700 20px "Inter", sans-serif';
    ctx.fillText('Azeem Agency', 24, 110);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '400 12px "Inter", sans-serif';
    ctx.fillText('Distribution OS', 24, 130);
    [170, 224].forEach((y) => {
      roundRect(ctx, 24, y, w - 48, 40, 10);
      ctx.fillStyle = '#131a29';
      ctx.fill();
    });
    roundRect(ctx, 24, 288, w - 48, 44, 22);
    ctx.fillStyle = '#7c6bff';
    ctx.fill();
  } else if (stage === 'DASHBOARD') {
    const stats = [['14', 'Total orders'], ['3', 'Products'], ['2', 'Retailers'], ['5', 'Open orders']];
    stats.forEach(([num, label], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 20 + col * ((w - 52) / 2 + 12);
      const y = 66 + row * 96;
      const tw = (w - 52) / 2;
      const grad = ctx.createLinearGradient(x, y, x + tw, y + 84);
      grad.addColorStop(0, TILE_COLORS[i][0]);
      grad.addColorStop(1, TILE_COLORS[i][1]);
      roundRect(ctx, x, y, tw, 84, 14);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 24px "Inter", sans-serif';
      ctx.fillText(num, x + 14, y + 44);
      ctx.font = '400 11px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(label, x + 14, y + 66);
    });
  } else {
    const rows = {
      PRODUCTS: ['D Milk — 8987', 'Five Star — 156', 'Kitkat — 326'],
      INVENTORY: ['Coke — 120', 'Biscuits — 85', 'Soap — 64'],
      ORDERS: ['AZ-07092026 · Pending', 'Harish Stores · Pending', 'steffi Stores · Pending'],
      RETAILERS: ['ABC Stores', 'steffi Stores', 'Harish Stores'],
    }[stage] || [];
    rows.forEach((label, i) => {
      const y = 64 + i * 58;
      roundRect(ctx, 20, y, w - 40, 46, 10);
      ctx.fillStyle = '#131a29';
      ctx.fill();
      ctx.fillStyle = TILE_COLORS[i % TILE_COLORS.length][0];
      ctx.beginPath();
      ctx.arc(38, y + 23, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '400 12px "Inter", sans-serif';
      ctx.fillText(label, 54, y + 27);
    });
    // bottom nav
    ctx.fillStyle = '#0e1220';
    ctx.fillRect(0, h - 48, w, 48);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i === DESIGN_STAGES.indexOf(stage) % 5 ? '#7c6bff' : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(30 + i * (w - 60) / 4, h - 24, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function PhoneMesh({ position, rotation, texture, scale = 1 }) {
  return <PhoneShell position={position} rotation={rotation} texture={texture} scale={scale} />;
}

function DesignGroup({ progressRef }) {
  const screen = usePhoneScreen((ctx, w, h) => drawAppScreen(ctx, w, h, -1), 240, 480);
  const last = useRef(-1);

  useEffect(() => {
    screen.redraw((ctx, w, h) => drawAppScreen(ctx, w, h, -1));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const p = beatLocal('design', progressRef.current || 0);
    const stageIdx = Math.min(DESIGN_STAGES.length - 1, Math.floor(p * DESIGN_STAGES.length));
    const key = p <= 0 ? -1 : stageIdx;
    if (key !== last.current) {
      last.current = key;
      screen.redraw((ctx, w, h) => drawAppScreen(ctx, w, h, key));
    }
  });

  return (
    <group position={[0, 1.1, DESIGN_Z]}>
      <PhoneMesh position={[0, 0, 0]} rotation={[0, 0, 0]} texture={screen.texture} scale={1.3} />
      <pointLight position={[0.8, 1, 1.5]} color={BLUE} intensity={1.6} distance={5} />
      <pointLight position={[-0.8, 0.4, 1]} color={ORANGE} intensity={0.8} distance={4} />
    </group>
  );
}

/* --------------------------------------------------------- Code/App group */

const CODEAPP_Z = -32;
const CODEAPP_STAGES = ['PRODUCTS', 'STOCK', 'ORDERS', 'PAYMENTS'];

function CodeAppGroup({ progressRef }) {
  const screen = usePhoneScreen((ctx, w, h) => drawAppScreen(ctx, w, h, -1), 240, 480);
  const last = useRef(-1);

  useEffect(() => {
    screen.redraw((ctx, w, h) => drawAppScreen(ctx, w, h, 1));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const p = beatLocal('codeApp', progressRef.current || 0);
    const idx = Math.min(CODEAPP_STAGES.length - 1, Math.floor(p * CODEAPP_STAGES.length));
    if (idx !== last.current) {
      last.current = idx;
      screen.redraw((ctx, w, h) => drawAppScreen(ctx, w, h, 2 + idx));
    }
  });

  return (
    <group position={[0.9, 1.1, CODEAPP_Z]}>
      <PhoneMesh position={[0, 0, 0]} rotation={[0, -0.3, 0]} texture={screen.texture} scale={1.2} />
      <pointLight position={[0.5, 1, 1.2]} color={BLUE} intensity={1.5} distance={4} />
    </group>
  );
}

/* ------------------------------------------------------- Build/Test group */

const BT_Z = -39;
const CHECKS = ['LOGIN', 'CREATE ORDER', 'STOCK UPDATE', 'DELIVERY', 'PAYMENT', 'REPORTS'];
const BUG_INDEX = 2;

function drawMonitor(ctx, w, h, revealed, bugState) {
  ctx.fillStyle = '#0a0e0a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.fillText('AZEEM ERP — TEST ENVIRONMENT', 20, 36);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(20, 50); ctx.lineTo(w - 20, 50); ctx.stroke();

  CHECKS.forEach((label, i) => {
    const y = 90 + i * 46;
    const isBug = i === BUG_INDEX;
    let status = 'pending';
    if (i < revealed) status = 'pass';
    if (isBug && bugState === 'failed') status = 'fail';
    if (isBug && bugState === 'fixed' && i < revealed) status = 'pass';

    ctx.font = '400 20px "Space Mono", monospace';
    ctx.fillStyle = status === 'pending' ? 'rgba(255,255,255,0.35)' : '#fff';
    ctx.fillText(label, 24, y);

    ctx.font = '700 20px "Space Mono", monospace';
    if (status === 'pass') { ctx.fillStyle = '#5be07b'; ctx.fillText('✓ PASS', w - 130, y); }
    else if (status === 'fail') { ctx.fillStyle = '#ff5b5b'; ctx.fillText('✕ FAILED', w - 150, y); }
  });
}

function BuildTestGroup({ progressRef }) {
  const screen = usePhoneScreen((ctx, w, h) => drawMonitor(ctx, w, h, 0, 'idle'), 560, 420);
  const last = useRef('');

  useEffect(() => {
    screen.redraw((ctx, w, h) => drawMonitor(ctx, w, h, 0, 'idle'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const p = beatLocal('buildTest', progressRef.current || 0);
    let revealed = 0;
    let bugState = 'idle';
    if (p < 0.5) {
      revealed = Math.min(CHECKS.length, Math.floor((p / 0.5) * CHECKS.length) + 1);
      if (revealed > BUG_INDEX) bugState = 'failed';
    } else {
      revealed = CHECKS.length;
      bugState = 'fixed';
    }
    const key = `${revealed}-${bugState}`;
    if (key !== last.current) {
      last.current = key;
      screen.redraw((ctx, w, h) => drawMonitor(ctx, w, h, revealed, bugState));
    }
  });

  return (
    <group position={[1.0, 1.0, BT_Z]}>
      <ScreenPlane position={[0, 0, 0]} rotation={[0, -0.25, 0]} size={[1.0, 0.75]} texture={screen.texture} />
      <mesh position={[0, -0.5, 0.3]} rotation={[-Math.PI / 2.4, -0.25, 0]}>
        <boxGeometry args={[0.5, 0.02, 0.2]} />
        <meshStandardMaterial color="#151517" />
      </mesh>
      <pointLight position={[0, 1, 1.2]} color={BLUE} intensity={1.6} distance={5} />
      <pointLight position={[0.6, 0.6, 0.8]} color={ORANGE} intensity={0.6} distance={3} />
    </group>
  );
}

/* --------------------------------------------------------- Approval group */

const AP_Z = -45;

function drawApproval(ctx, w, h, stage) {
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ORANGE;
  ctx.font = '700 16px "Space Mono", monospace';
  ctx.fillText('CLIENT FEEDBACK', 20, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '400 16px "Space Mono", monospace';
  wrapText(ctx, '"Can the dashboard show today\'s total sales up top?"', 20, 74, w - 40, 22);

  if (stage >= 1) {
    ctx.fillStyle = BLUE;
    ctx.font = '700 16px "Space Mono", monospace';
    ctx.fillText('UPDATE → BUILD → TEST', 20, h * 0.52);
  }
  if (stage >= 2) {
    ctx.fillStyle = '#5be07b';
    ctx.font = '700 30px "Anton", sans-serif';
    ctx.fillText('FINAL APPROVAL ✓', 20, h * 0.78);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  words.forEach((word) => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word + ' ';
      yy += lineHeight;
    } else {
      line = test;
    }
  });
  ctx.fillText(line, x, yy);
}

function ApprovalGroup({ progressRef }) {
  const screen = usePhoneScreen((ctx, w, h) => drawApproval(ctx, w, h, 0), 460, 300);
  const last = useRef(-1);

  useEffect(() => {
    screen.redraw((ctx, w, h) => drawApproval(ctx, w, h, 0));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    const p = beatLocal('approval', progressRef.current || 0);
    const stage = p < 0.4 ? 0 : p < 0.8 ? 1 : 2;
    if (stage !== last.current) {
      last.current = stage;
      screen.redraw((ctx, w, h) => drawApproval(ctx, w, h, stage));
    }
  });

  return (
    <group position={[0, 1.1, AP_Z]}>
      <ScreenPlane position={[0, 0, 0]} rotation={[0, 0.15, 0]} size={[0.7, 0.46]} texture={screen.texture} />
      <pointLight position={[0, 1, 1]} color="#5be07b" intensity={1.2} distance={4} />
    </group>
  );
}

/* ----------------------------------------------------------- Deploy group */

const DEPLOY_Z = -53;

function drawDeploy(ctx, w, h, pct) {
  ctx.fillStyle = '#06070c';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = '700 20px "Space Mono", monospace';
  ctx.fillText(pct >= 100 ? 'DEPLOYED' : 'UPLOADING…', 24, 46);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, 24, 70, w - 48, 18, 9);
  ctx.stroke();
  ctx.fillStyle = pct >= 100 ? '#5be07b' : BLUE;
  roundRect(ctx, 24, 70, (w - 48) * (pct / 100), 18, 9);
  ctx.fill();
  ctx.font = '700 16px "Space Mono", monospace';
  ctx.fillText(`${pct}%`, 24, 116);
  if (pct >= 100) {
    ctx.fillStyle = '#5be07b';
    ctx.font = '700 22px "Anton", sans-serif';
    ctx.fillText('DEPLOYED ✓', 24, 150);
  }
}

function DeployGroup({ progressRef }) {
  const screen = usePhoneScreen((ctx, w, h) => drawDeploy(ctx, w, h, 0), 420, 200);
  const cloudRef = useRef();
  const last = useRef(-1);

  useEffect(() => {
    screen.redraw((ctx, w, h) => drawDeploy(ctx, w, h, 0));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    const p = beatLocal('deploy', progressRef.current || 0);
    const pct = Math.round(Math.min(1, p / 0.85) * 100);
    if (pct !== last.current) {
      last.current = pct;
      screen.redraw((ctx, w, h) => drawDeploy(ctx, w, h, pct));
    }
    if (cloudRef.current) cloudRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group position={[0, 1.6, DEPLOY_Z]}>
      <mesh ref={cloudRef}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial color={BLUE} wireframe transparent opacity={0.7} />
      </mesh>
      <ScreenPlane position={[0.9, -0.3, 0]} rotation={[0, -0.3, 0]} size={[0.7, 0.33]} texture={screen.texture} />
      <pointLight position={[0, 0.5, 1.5]} color={BLUE} intensity={2} distance={6} />
    </group>
  );
}

/* -------------------------------------------------------------- Final HUD */

function FinalLabels({ progressRef }) {
  const groupRef = useRef();
  const labels = [
    { text: 'UNDERSTAND', pos: [-1.4, 1.1, AGENCY_Z] },
    { text: 'PLAN', pos: [-1.1, 1.6, REQ_Z] },
    { text: 'DESIGN', pos: [0, 1.6, DESIGN_Z] },
    { text: 'BUILD', pos: [1.0, 1.5, BT_Z] },
    { text: 'TEST', pos: [1.0, 1.6, BT_Z - 1] },
    { text: 'DEPLOY', pos: [0, 2.1, DEPLOY_Z] },
    { text: 'DELIVER', pos: [0, 2.4, DEPLOY_Z - 4] },
  ];

  useFrame(() => {
    const p = beatLocal('final', progressRef.current || 0);
    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        child.traverse((o) => {
          if (o.fillOpacity !== undefined) o.fillOpacity = p;
        });
      });
    }
  });

  return (
    <group ref={groupRef}>
      {labels.map((l) => (
        <Text key={l.text} position={l.pos} fontSize={0.16} color="#fff" anchorX="center" fillOpacity={0}>
          {l.text}
        </Text>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------- Camera rig */

function CameraRig({ progressRef }) {
  const { camera } = useThree();
  const current = useRef({ pos: new THREE.Vector3(0, 1.6, 4), look: new THREE.Vector3(0, 1.1, 0) });

  useFrame(() => {
    const p = progressRef.current || 0;
    const { pos, look } = sampleCameraPath(p);
    current.current.pos.lerp(new THREE.Vector3(...pos), 0.12);
    current.current.look.lerp(new THREE.Vector3(...look), 0.12);
    camera.position.copy(current.current.pos);
    camera.lookAt(current.current.look);
  });

  return null;
}

/* ------------------------------------------------------------ Follow light */

// A light that travels with the camera so whatever it's currently framing
// stays readable, instead of relying only on each beat's fixed point lights.
function FollowLight() {
  const lightRef = useRef();
  const { camera } = useThree();
  const dir = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!lightRef.current) return;
    camera.getWorldDirection(dir);
    target.copy(camera.position).addScaledVector(dir, 1.3);
    lightRef.current.position.copy(target);
  });

  return <pointLight ref={lightRef} intensity={2.2} distance={9} decay={2} color="#fff3e8" />;
}

/* ----------------------------------------------------------- Fog / lights */

function AtmosphereRig({ progressRef }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog('#0a0b10', 8, 26);
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame(() => {
    const p = progressRef.current || 0;
    if (scene.fog) {
      const warm = new THREE.Color('#2a1408');
      const cool = new THREE.Color('#0a0b14');
      scene.fog.color.copy(warm).lerp(cool, p);
      // Widen the fog range during the final pull-back so the whole
      // journey becomes visible instead of vanishing into haze.
      const finalP = beatLocal('final', p);
      scene.fog.far = THREE.MathUtils.lerp(24, 90, finalP);
    }
  });
  return null;
}

/* --------------------------------------------------------------- Exports */

export default function Scene({ progressRef }) {
  return (
    <>
      <color attach="background" args={['#0a0b10']} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#3a3a52', '#0a0a0f', 0.55]} />
      <CameraRig progressRef={progressRef} />
      <AtmosphereRig progressRef={progressRef} />
      <FollowLight />
      <DeskGroup progressRef={progressRef} />
      <AgencyGroup progressRef={progressRef} />
      <RequirementsGroup progressRef={progressRef} />
      <BlueprintGroup progressRef={progressRef} />
      <DesignGroup progressRef={progressRef} />
      <CodeAppGroup progressRef={progressRef} />
      <BuildTestGroup progressRef={progressRef} />
      <ApprovalGroup progressRef={progressRef} />
      <DeployGroup progressRef={progressRef} />
      <FinalLabels progressRef={progressRef} />
      <AgencyReprise progressRef={progressRef} />
    </>
  );
}
