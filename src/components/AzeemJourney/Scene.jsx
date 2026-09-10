import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCanvasTexture, roundRect } from './canvasTexture.js';
import { BEATS, beatLocal, sampleCameraPath } from './timeline.js';

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

function DeskGroup({ progressRef }) {
  const laptopScreen = usePhoneScreen((ctx, w, h) => drawLaptopCode(ctx, w, h, true), 640, 400);
  const phoneScreen = usePhoneScreen((ctx, w, h) => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
  }, 220, 440);

  const stateRef = useRef(0);
  const cursorBlinkRef = useRef(0);

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

    const p = beatLocal('call', progressRef.current || 0);
    const step = p > 0.38 ? 1 : 0;
    if (step !== stateRef.current) {
      stateRef.current = step;
      phoneScreen.redraw((ctx, w, h) => {
        if (step === 0) {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = '#050608';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = ORANGE;
          ctx.font = '700 20px "Space Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('INCOMING CALL', w / 2, h * 0.42);
          ctx.fillStyle = '#fff';
          ctx.font = '400 26px "Space Mono", monospace';
          ctx.fillText('AZEEM AGENCY', w / 2, h * 0.5);
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.68, 26, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
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
          <meshStandardMaterial color="#22232a" roughness={0.4} />
        </RoundedBox>
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
      {/* phone */}
      <group position={[0.55, 0.735, 0.15]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <RoundedBox args={[0.22, 0.44, 0.02]} radius={0.03}>
          <meshStandardMaterial color="#141519" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.19, 0.38]} />
          <meshBasicMaterial map={phoneScreen.texture} toneMapped={false} />
        </mesh>
      </group>
      {/* notebook + pen */}
      <group position={[0.7, 0.735, -0.35]} rotation={[-Math.PI / 2, 0, -0.1]}>
        <mesh>
          <planeGeometry args={[0.26, 0.34]} />
          <meshStandardMaterial color="#c8c2ad" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0.82, 0.745, -0.22]} rotation={[0, 0.5, Math.PI / 2.3]}>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 8]} />
        <meshStandardMaterial color="#e8b23a" roughness={0.4} />
      </mesh>
      {/* coffee cup */}
      <mesh position={[0.95, 0.76, -0.35]}>
        <cylinderGeometry args={[0.06, 0.05, 0.09, 16]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
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

function Shelving() {
  const ref = useRef();
  const count = 36;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    let i = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 12; col++) {
        dummy.position.set(-3.6 + col * 0.34, 0.3 + row * 0.42, AGENCY_Z - 2.4 - (row % 2) * 0.15);
        dummy.rotation.y = (Math.random() - 0.5) * 0.1;
        dummy.updateMatrix();
        ref.current.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <boxGeometry args={[0.3, 0.36, 0.3]} />
      <meshStandardMaterial color="#5a4230" roughness={0.9} />
    </instancedMesh>
  );
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
      <Shelving />
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
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[0.44, 0.9, 0.04]} radius={0.05}>
        <meshStandardMaterial color="#16171d" roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.4, 0.82]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
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
    </>
  );
}
