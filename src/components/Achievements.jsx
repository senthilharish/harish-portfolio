import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoundedBox, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ---------------------------------------------------------------- data */
// Each achievement is a "level" on the road journey. `achieved` and `role`
// back the side-panel breakdown; `date` and `type` are optional labels.
const ACHIEVEMENTS = [
  {
    medal: '🥇',
    type: 'Hackathon',
    title: 'College Hackathon 2025',
    subtitle: 'Biodegradable Film Risk Monitoring System',
    date: '2025',
    teaser: '1st place · Risk monitoring system',
    description: 'Won first place at the College Hackathon 2025 for building a biodegradable film risk monitoring system.',
    achieved: ['Designed a risk-monitoring system for biodegradable film', 'Built and demoed a working prototype under time pressure', 'Placed 1st out of all competing teams'],
    role: 'Team member — system design & development',
    images: [],
  },
  {
    medal: '🥇',
    type: 'Hackathon',
    title: 'SDG 12 Hackathon',
    subtitle: 'Techfest 2025',
    date: '2025',
    teaser: '1st place · Techfest 2025',
    description: 'Won first place at the SDG 12 Hackathon, part of Techfest 2025.',
    achieved: ['Built a solution aligned with UN SDG 12 (Responsible Consumption)', 'Presented the idea and prototype to judges', 'Won 1st place at Techfest 2025'],
    role: 'Team member',
    images: [],
  },
  {
    medal: '🥇',
    type: 'Competition',
    title: 'Coding for Sustainability',
    subtitle: 'Techfest 2025',
    date: '2025',
    teaser: '1st place · Techfest 2025',
    description: 'Won first place in the Coding for Sustainability track at Techfest 2025.',
    achieved: ['Solved a sustainability-focused coding challenge', 'Delivered an efficient, working solution under contest constraints', 'Won 1st place in the track'],
    role: 'Participant',
    images: [],
  },
  {
    medal: '🥈',
    type: 'Hackathon',
    title: 'College Hackathon 2024',
    subtitle: 'Litter Detection Project',
    date: '2024',
    teaser: '2nd place · Litter detection',
    description: 'Placed second at the College Hackathon 2024 for a litter detection project.',
    achieved: ['Built a litter-detection project end to end', 'Collaborated with a team under a tight deadline', 'Placed 2nd overall'],
    role: 'Team member — development',
    images: [],
  },
  {
    medal: '🥉',
    type: 'Hackathon',
    title: '18-Hour Hackathon',
    subtitle: 'Govt. College of Engineering, Thrissur',
    date: '2024',
    teaser: '3rd place · Thrissur',
    description: 'Placed third at the 18-Hour Hackathon hosted by Govt. College of Engineering, Thrissur.',
    achieved: ['Built a project in an 18-hour non-stop hackathon', 'Worked as part of a small team through the night', 'Placed 3rd overall'],
    role: 'Team member',
    images: ['/assets/hack1-trisure.jpeg', '/assets/thirisure_2.jpeg'],
  },
  {
    medal: '📄',
    type: 'Certification',
    title: 'Paper Presentation',
    subtitle: 'IEEE Conference, NIT Delhi',
    date: '2024',
    teaser: 'Agri Bio Trace',
    description: 'Presented a paper on Agri Bio Trace at an IEEE Conference held at NIT Delhi.',
    achieved: ['Authored a research paper on Agri Bio Trace', 'Presented findings at an IEEE conference at NIT Delhi', 'Engaged with reviewers and fellow researchers'],
    role: 'Author & presenter',
    images: ['/assets/nit_delhi_1.jpeg', '/assets/ust_global2.jpeg'],
  },
  {
    medal: '🎤',
    type: 'Activity',
    title: 'Conference Participant',
    subtitle: 'IEEE Reliability Summit, Madras Section',
    date: '2024',
    teaser: 'IEEE Madras Section',
    description: 'Participated in the IEEE Reliability Summit, Madras Section.',
    achieved: ['Attended technical sessions on reliability engineering', 'Networked with the IEEE Madras Section community'],
    role: 'Participant',
    images: [],
  },
  {
    medal: '🎓',
    type: 'Activity',
    title: 'Conference Attendee',
    subtitle: "Int'l Conference on Computational Intelligence & Data Analytics 2024",
    date: '2024',
    teaser: 'Computational intelligence & data analytics',
    description: "Attended the International Conference on Computational Intelligence & Data Analytics 2024.",
    achieved: ['Attended talks on computational intelligence & data analytics', 'Broadened exposure to current research directions'],
    role: 'Attendee',
    images: [],
  },
  {
    medal: '💡',
    type: 'Hackathon',
    title: 'Hackathon Participant',
    subtitle: "Withon's 25, Anna University Guindy",
    date: '2025',
    teaser: 'Anna University Guindy',
    description: "Participated in Withon's 25 at Anna University, Guindy.",
    achieved: ["Competed in Withon's 25 at Anna University, Guindy", 'Built and pitched a project within the event timeframe'],
    role: 'Participant',
    images: ['/assets/comp_image.jpeg'],
  },
  {
    medal: '🌍',
    type: 'Hackathon',
    title: 'Final Hackathon',
    subtitle: 'U.S.T Global',
    date: '2025',
    teaser: 'U.S.T Global',
    description: 'Participated in the U.S.T Global Final Hackathon.',
    achieved: ['Reached the final round of the U.S.T Global Hackathon', 'Built and demoed a project to industry judges'],
    role: 'Team member',
    images: ['/assets/ust_global_1.jpeg', '/assets/ust_global2.jpeg'],
  },
];

function tierFromMedal(medal) {
  if (medal === '🥇') return 'gold';
  if (medal === '🥈') return 'silver';
  if (medal === '🥉') return 'bronze';
  return 'none';
}
const TIER_COLOR = { gold: '#ffc84a', silver: '#c9ccd1', bronze: '#d0793f', none: '#ff5b1f' };

/* ------------------------------------------------------- path geometry */
// The route's waypoints: a lazy S starting at Home, one full sine cycle
// across the whole list (center -> right -> center -> left -> center) so it
// always reads as a single clean curve regardless of item count.
const AMPLITUDE = 3.4;
const ROW_DEPTH = 4.1;
const SCALE = 1;
const ROAD_WIDTH = 1.9;
const RIDGE_OFFSET = ROAD_WIDTH / 2 + 0.12;
const RIDGE_RADIUS = 0.045;
const STREET_LIGHT_OFFSET = ROAD_WIDTH / 2 + 0.65;
const STREET_LIGHT_ARM = 0.9;
const STREET_LIGHT_TS = [0.26, 0.66];

function buildWaypoints(count) {
  const home = new THREE.Vector3(0, 0, 0);
  const nodes = Array.from({ length: count }, (_, i) => {
    const row = i + 1;
    return new THREE.Vector3(
      Math.sin((i / count) * Math.PI * 2) * AMPLITUDE * SCALE,
      0,
      row * ROW_DEPTH * SCALE
    );
  });
  return [home, ...nodes];
}

/* -------------------------------------------------------------- start building */
// A low building placed right beside the start of the road, next to the car —
// grounds the "driving away from a building" framing without the road-trip
// clutter of the removed home/tech decorations.
const BUILDING_MODEL_PATH = '/models/low-building-kenney.glb';
const BUILDING_SCALE = 1.4;

function StartBuilding() {
  const { scene } = useGLTF(BUILDING_MODEL_PATH);
  return (
    <group position={[-2.1, 0, -0.4]} rotation={[0, Math.PI / 2, 0]}>
      <primitive object={scene} scale={BUILDING_SCALE} />
    </group>
  );
}
useGLTF.preload(BUILDING_MODEL_PATH);

/* ----------------------------------------------------------------- road */
// A flat ribbon built from the curve's frame (tangent x up) so it reads as
// a real winding road with perspective, plus dashed centre markings and
// pale edge lines drawn slightly above the asphalt to avoid z-fighting.
function Road({ curve, length }) {
  const segments = Math.max(60, Math.round(length * 6));

  const { roadGeometry, centerPoints, edgePoints } = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const lefts = [];
    const rights = [];
    const centers = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      lefts.push(point.clone().addScaledVector(right, -ROAD_WIDTH / 2));
      rights.push(point.clone().addScaledVector(right, ROAD_WIDTH / 2));
      centers.push(point.clone().add(new THREE.Vector3(0, 0.02, 0)));
    }
    const positions = [];
    const uvs = [];
    for (let i = 0; i <= segments; i++) {
      const l = lefts[i];
      const r = rights[i];
      positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
      uvs.push(0, i, 1, i);
    }
    const indices = [];
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = i * 2 + 2;
      const d = i * 2 + 3;
      indices.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const edgeL = lefts.map((p) => p.clone().add(new THREE.Vector3(0, 0.015, 0)));
    const edgeR = rights.map((p) => p.clone().add(new THREE.Vector3(0, 0.015, 0)));
    return { roadGeometry: geo, centerPoints: centers, edgePoints: [edgeL, edgeR] };
  }, [curve, segments]);

  const centerLine = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(centerPoints);
    return g;
  }, [centerPoints]);

  const edgeGeometries = useMemo(
    () => edgePoints.map((pts) => new THREE.BufferGeometry().setFromPoints(pts)),
    [edgePoints]
  );

  const dashedLineRef = useCallback((line) => {
    if (line) line.computeLineDistances();
  }, []);

  return (
    <group>
      <mesh geometry={roadGeometry} receiveShadow={false}>
        <meshStandardMaterial color="#1a1c22" roughness={0.92} metalness={0.05} />
      </mesh>
      {edgeGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial color="#4a4d58" transparent opacity={0.7} />
        </line>
      ))}
      <line ref={dashedLineRef} geometry={centerLine}>
        <lineDashedMaterial color="#ff5b1f" dashSize={0.4} gapSize={0.35} transparent opacity={0.85} />
      </line>
    </group>
  );
}

/* ---------------------------------------------------------- road edge ridge */
// A continuous low, rounded concrete curb tracing both edges of the road —
// a subtle raised lip rather than a wall — built as a thin tube along each
// edge's own Catmull-Rom curve so it follows every bend cleanly.
function RoadEdgeRidges({ curve, length }) {
  const segments = Math.max(60, Math.round(length * 6));

  const ridgeGeometries = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      leftPts.push(point.clone().addScaledVector(right, -RIDGE_OFFSET).add(new THREE.Vector3(0, RIDGE_RADIUS * 0.6, 0)));
      rightPts.push(point.clone().addScaledVector(right, RIDGE_OFFSET).add(new THREE.Vector3(0, RIDGE_RADIUS * 0.6, 0)));
    }
    const leftCurve = new THREE.CatmullRomCurve3(leftPts);
    const rightCurve = new THREE.CatmullRomCurve3(rightPts);
    return [
      new THREE.TubeGeometry(leftCurve, segments, RIDGE_RADIUS, 8, false),
      new THREE.TubeGeometry(rightCurve, segments, RIDGE_RADIUS, 8, false),
    ];
  }, [curve, segments]);

  return (
    <group>
      {ridgeGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow>
          <meshStandardMaterial color="#5f6169" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/* --------------------------------------------------------- street lights */
// Four modern highway lights (two mirrored pairs, evenly spaced along the
// route) with a slim pole, a cantilevered arm reaching over the road edge,
// and a warm point light plus a soft glow decal pooling on the asphalt below.
function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,196,130,0.85)');
  gradient.addColorStop(0.45, 'rgba(255,150,70,0.32)');
  gradient.addColorStop(1, 'rgba(255,150,70,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

let glowTextureCache = null;
function getGlowTexture() {
  if (!glowTextureCache) glowTextureCache = createGlowTexture();
  return glowTextureCache;
}

const POLE_HEIGHT = 3.6;
const ARM_HEIGHT = POLE_HEIGHT - 0.1;

function StreetLight({ position, heading, sign }) {
  const lampRef = useRef();

  useFrame((state) => {
    if (lampRef.current) {
      lampRef.current.material.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 1.6) * 0.15;
    }
  });

  return (
    <group position={position} rotation={[0, heading, 0]}>
      <mesh position={[0, POLE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, POLE_HEIGHT, 10]} />
        <meshStandardMaterial color="#23252c" roughness={0.4} metalness={0.75} />
      </mesh>
      <mesh position={[sign * STREET_LIGHT_ARM * 0.5, ARM_HEIGHT, 0]} rotation={[0, 0, -sign * (Math.PI / 2 - 0.18)]} castShadow>
        <cylinderGeometry args={[0.03, 0.038, STREET_LIGHT_ARM, 8]} />
        <meshStandardMaterial color="#23252c" roughness={0.4} metalness={0.75} />
      </mesh>
      <mesh position={[sign * STREET_LIGHT_ARM, ARM_HEIGHT - 0.14, 0]} castShadow>
        <boxGeometry args={[0.4, 0.09, 0.16]} />
        <meshStandardMaterial color="#121319" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh ref={lampRef} position={[sign * STREET_LIGHT_ARM, ARM_HEIGHT - 0.19, 0]}>
        <boxGeometry args={[0.32, 0.025, 0.11]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffb463" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[sign * STREET_LIGHT_ARM, ARM_HEIGHT - 0.3, 0]} color="#ffb060" intensity={3.2} distance={7.5} decay={2} />
    </group>
  );
}

function StreetLights({ curve, length }) {
  const glowTexture = useMemo(() => getGlowTexture(), []);

  const lights = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const specs = [];
    STREET_LIGHT_TS.forEach((t) => {
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const heading = Math.atan2(tangent.x, tangent.z);
      [1, -1].forEach((sign) => {
        const polePos = point.clone().addScaledVector(right, sign * STREET_LIGHT_OFFSET);
        const poolPos = point.clone().addScaledVector(right, sign * (STREET_LIGHT_OFFSET - STREET_LIGHT_ARM));
        specs.push({
          position: [polePos.x, polePos.y, polePos.z],
          poolPosition: [poolPos.x, poolPos.y + 0.025, poolPos.z],
          heading,
          sign,
        });
      });
    });
    return specs;
  }, [curve, length]);

  return (
    <group>
      {lights.map((l, i) => (
        <StreetLight key={i} position={l.position} heading={l.heading} sign={l.sign} />
      ))}
      {lights.map((l, i) => (
        <mesh key={`pool-${i}`} position={l.poolPosition} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2, 2.2]} />
          <meshBasicMaterial map={glowTexture} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------- achievement star */
// A five-pointed star, extruded for depth, floating above the road with a
// slow bob + spin and a soft additive glow sprite. Brightens on approach
// and on hover/active state, and is click/tap-able to open the info panel.
function makeStarShape() {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outerR = 0.34;
  const innerR = 0.14;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
const STAR_SHAPE = makeStarShape();
const STAR_GEOMETRY = new THREE.ExtrudeGeometry(STAR_SHAPE, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });

// Burst-flash duration (seconds) after collision — the star itself vanishes
// instantly on impact; this only times the quick glow flash that follows.
const COLLECT_DURATION = 0.18;

function AchievementStar({ position, tier, active, visited, proximity, collecting, onSelect, onCollectComplete }) {
  const group = useRef();
  const starMesh = useRef();
  const glow = useRef();
  const burst = useRef();
  const [hovered, setHovered] = useState(false);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);
  const collectStart = useRef(null);
  const collectDone = useRef(false);

  useEffect(() => {
    if (collecting) {
      collectStart.current = null;
      collectDone.current = false;
    }
  }, [collecting]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (collecting) {
      if (collectStart.current === null) {
        collectStart.current = t;
        // The star vanishes the instant it's reached — only the burst flash animates.
        if (starMesh.current) starMesh.current.scale.set(0.0001, 0.0001, 0.0001);
        if (glow.current) glow.current.material.opacity = 0;
      }
      const progress = Math.min(1, (t - collectStart.current) / COLLECT_DURATION);
      const ease = 1 - Math.pow(1 - progress, 3);
      if (burst.current) {
        const bs = 0.4 + ease * 2.8;
        burst.current.scale.set(bs, bs, bs);
        burst.current.material.opacity = (1 - ease) * 0.9;
      }
      if (progress >= 1 && !collectDone.current) {
        collectDone.current = true;
        onCollectComplete();
      }
      return;
    }

    if (group.current) {
      const bobSpeed = 1.3 + proximity * 2.4;
      group.current.position.y = 1.15 + Math.sin(t * bobSpeed + seed) * (0.12 + proximity * 0.05);
    }
    if (starMesh.current) {
      starMesh.current.rotation.y += (active ? 0.02 : 0.008) + proximity * 0.05;
      const focus = active ? 1.4 : hovered ? 1.2 : 1;
      const target = (0.85 + proximity * 0.6) * focus;
      starMesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    }
    if (glow.current) {
      const base = visited ? 0.7 : 0.35;
      const approachPulse = proximity > 0.6 ? Math.sin(t * 11) * 0.35 * ((proximity - 0.6) / 0.4) : 0;
      glow.current.material.opacity = 0.16;
      glow.current.material.emissiveIntensity = active
        ? 1.8 + Math.sin(t * 5) * 0.4
        : base + proximity * 0.6 + approachPulse + (hovered ? 0.3 : 0);
    }
  });

  const color = TIER_COLOR[tier];

  return (
    <group position={position}>
      <group ref={group}>
        <mesh
          ref={starMesh}
          rotation={[0, 0, 0]}
          geometry={STAR_GEOMETRY}
          onClick={(e) => {
            e.stopPropagation();
            if (!collecting) onSelect();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.3} roughness={0.35} />
        </mesh>
        <mesh ref={glow} scale={1.9}>
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
        </mesh>
        {collecting && (
          <mesh ref={burst}>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.65, 24]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.3 : 0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------- completed marker */
// Replaces a collected star: a small, quiet glowing checkpoint instead of
// the full spinning star, so unlocked achievements read as "done" at a
// glance rather than competing with the next active star.
function CompletedMarker({ tier, position }) {
  const ref = useRef();
  const color = TIER_COLOR[tier];

  useFrame((state) => {
    if (ref.current) ref.current.position.y = 0.36 + Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
  });

  return (
    <group position={position}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.42, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------- car + driver */
// The Mahindra Thar 4x4 model (CC-BY, "Mahindra Thar 4x4" by NEYCER on
// Sketchfab), decimated + Draco/WebP-compressed down from ~165MB to ~2.6MB
// for the web. Node names below come straight from that glb's rig — the
// four "DEF-Wheel.*" empties are what DriveController spins/steers each
// frame, same as the old procedural wheel meshes did.
const CAR_MODEL_PATH = '/models/thar-4x4-optimized.glb';
const CAR_SCALE = 0.27;
const WHEEL_NODE_NAMES = {
  fl: 'DEF-Wheel.Ft.L_119',
  fr: 'DEF-Wheel.Ft.R_121',
  rl: 'DEF-Wheel.Bk.L_123',
  rr: 'DEF-Wheel.Bk.R_125',
};

function Car({ groupRef, wheelRefs, steerRef }) {
  const { scene } = useGLTF(CAR_MODEL_PATH);
  const modelRef = useRef();

  useEffect(() => {
    const root = modelRef.current;
    if (!root) return;
    Object.entries(WHEEL_NODE_NAMES).forEach(([key, name]) => {
      const node = root.getObjectByName(name);
      wheelRefs.current[key] = node;
      if (key === 'fl' || key === 'fr') steerRef.current[key] = node;
    });
  }, [scene, wheelRefs, steerRef]);

  return (
    <group ref={groupRef}>
      <primitive ref={modelRef} object={scene} scale={CAR_SCALE} rotation={[0, 0, 0]} />
    </group>
  );
}
useGLTF.preload(CAR_MODEL_PATH);

/* -------------------------------------------------------------- drive controller */
// Owns the car's progress along the route: keyboard input -> speed -> arc
// length -> position/heading. Auto-brakes near the next unvisited
// achievement and stops at a fixed distance so the player can't overshoot.
// An "autopilot" target (set by ENTER / arrow-key level navigation, or a
// star click) smoothly drives the car to any node regardless of direction.
function DriveController({ curve, totalLength, nodeDistances, carRef, wheelRefs, steerRef, cameraTargetRef, onArrive, activeIndex, visitedRef, hudRef, autopilotRef, proximityRef, touchKeysRef }) {
  const distance = useRef(0);
  const speed = useRef(0);
  const heading = useRef(0);
  const keys = useRef({ forward: false, backward: false });
  const stoppedFor = useRef(-1);

  useEffect(() => {
    const onDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'd') keys.current.forward = true;
      if (key === 's' || key === 'a') keys.current.backward = true;
      if ((key === 'w' || key === 'a' || key === 's' || key === 'd') && hudRef.current) {
        hudRef.current.classList.add('lvl-hud-fade');
      }
    };
    const onUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'd') keys.current.forward = false;
      if (key === 's' || key === 'a') keys.current.backward = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const MAX_SPEED = 4.2;
    const ACCEL = 6;
    const BRAKE = 8;
    const FRICTION = 3;

    const autopilotIdx = autopilotRef.current;
    const inputLocked = activeIndex !== null && autopilotIdx === null;

    if (autopilotIdx !== null) {
      const targetDist = nodeDistances[autopilotIdx];
      const gap = targetDist - distance.current;
      const dir = Math.sign(gap);
      const AP_STOP = 0.12;
      if (Math.abs(gap) <= AP_STOP) {
        distance.current = targetDist;
        speed.current = 0;
        autopilotRef.current = null;
        onArrive(autopilotIdx, true);
        stoppedFor.current = autopilotIdx;
      } else {
        const brakeZone = 3.2;
        const wanted = dir * Math.min(MAX_SPEED, MAX_SPEED * Math.min(1, Math.abs(gap) / brakeZone) + 0.3);
        speed.current = THREE.MathUtils.lerp(speed.current, wanted, Math.min(1, delta * 3));
      }
    } else {
      // Auto-brake window: find the next unvisited node ahead and slow for it.
      let targetMax = MAX_SPEED;
      const nextIdx = nodeDistances.findIndex((d, i) => !visitedRef.current[i] && d > distance.current - 0.6);
      if (nextIdx !== -1) {
        const gap = nodeDistances[nextIdx] - distance.current;
        const STOP_DISTANCE = 1.0;
        const BRAKE_ZONE = 5;
        if (gap < BRAKE_ZONE && gap > 0) {
          targetMax = Math.max(0.15, (gap / BRAKE_ZONE) * MAX_SPEED);
        }
        if (gap <= STOP_DISTANCE && gap > -0.2) {
          targetMax = 0;
          if (stoppedFor.current !== nextIdx) {
            stoppedFor.current = nextIdx;
            onArrive(nextIdx, false);
          }
        } else if (stoppedFor.current === nextIdx && gap > STOP_DISTANCE + 0.4) {
          stoppedFor.current = -1;
        }
      }

      if (!inputLocked) {
        const touch = touchKeysRef ? touchKeysRef.current : null;
        const forward = keys.current.forward || (touch && touch.forward);
        const backward = keys.current.backward || (touch && touch.backward);
        if (forward) speed.current += ACCEL * delta;
        else if (backward) speed.current -= BRAKE * delta;
        else speed.current -= Math.sign(speed.current) * FRICTION * delta;
      } else {
        speed.current -= Math.sign(speed.current) * BRAKE * delta;
      }
      speed.current = THREE.MathUtils.clamp(speed.current, -1.2, targetMax);
      if (Math.abs(speed.current) < 0.02) speed.current = 0;
    }

    distance.current = THREE.MathUtils.clamp(distance.current + speed.current * delta, 0, totalLength - 0.05);

    // Track proximity (0..1) to the nearest node for each star's approach glow.
    if (proximityRef) {
      nodeDistances.forEach((d, i) => {
        const gap = Math.abs(d - distance.current);
        proximityRef.current[i] = Math.max(0, 1 - gap / 4.5);
      });
    }

    const u = totalLength > 0 ? distance.current / totalLength : 0;
    const point = curve.getPointAt(THREE.MathUtils.clamp(u, 0, 1));
    const tangent = curve.getTangentAt(THREE.MathUtils.clamp(u, 0, 1));
    const targetHeading = Math.atan2(tangent.x, tangent.z);

    let diff = targetHeading - heading.current;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    heading.current += diff * Math.min(1, delta * 4);

    if (carRef.current) {
      carRef.current.position.set(point.x, point.y, point.z);
      carRef.current.rotation.y = heading.current;
      const bob = Math.sin(state.clock.elapsedTime * 8) * 0.01 * Math.min(1, Math.abs(speed.current));
      carRef.current.position.y = bob;
      carRef.current.rotation.z = THREE.MathUtils.clamp(-diff * 2.2, -0.12, 0.12);
    }

    const spin = (speed.current * delta) / 0.3;
    ['fl', 'fr', 'rl', 'rr'].forEach((k) => {
      if (wheelRefs.current[k]) wheelRefs.current[k].rotation.x += spin;
    });
    const steerAngle = THREE.MathUtils.clamp(diff * 6, -0.5, 0.5);
    ['fl', 'fr'].forEach((k) => {
      if (steerRef.current[k]) steerRef.current[k].rotation.y = steerAngle;
    });

    cameraTargetRef.current.position.set(point.x, point.y, point.z);
    cameraTargetRef.current.heading = heading.current;
    cameraTargetRef.current.speed = speed.current;
  });

  return null;
}

/* -------------------------------------------------------------- chase camera */
function ChaseCamera({ cameraTargetRef }) {
  const { camera } = useThree();
  const current = useRef({
    pos: new THREE.Vector3(0, 3.2, -6),
    look: new THREE.Vector3(0, 0.6, 0),
  });

  useFrame(() => {
    const t = cameraTargetRef.current;
    const h = t.heading;
    const behind = new THREE.Vector3(Math.sin(h), 0, Math.cos(h)).multiplyScalar(-5.2);
    const desiredPos = t.position.clone().add(behind).add(new THREE.Vector3(0, 2.6, 0));
    const desiredLook = t.position.clone().add(new THREE.Vector3(Math.sin(h), 0, Math.cos(h)).multiplyScalar(3)).add(new THREE.Vector3(0, 0.7, 0));

    current.current.pos.lerp(desiredPos, 0.06);
    current.current.look.lerp(desiredLook, 0.1);
    camera.position.copy(current.current.pos);
    camera.lookAt(current.current.look);
  });
  return null;
}

/* ------------------------------------------------------ proximity relay */
// Bridges the per-frame proximity ref (read inside useFrame) to React state
// for each star's material, without re-rendering the whole scene every frame.
function ProximityDriver({ setTick }) {
  const last = useRef(0);
  useFrame((state) => {
    if (state.clock.elapsedTime - last.current > 0.15) {
      last.current = state.clock.elapsedTime;
      setTick((n) => (n + 1) % 100000);
    }
  });
  return null;
}

/* -------------------------------------------------------------- city skyline */
// A static, deterministically-seeded skyline of low-poly building silhouettes
// flanking the road, well outside the drivable area. Pure background dressing
// — no collision, no animation beyond a couple of sparse window lights — so
// the journey reads as "driving through a tech campus" instead of a void.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
// Real low-poly Kenney building models, reused via cloned scenes, instead of
// procedural boxes — same seeded layout, actual geometry.
const BUILDING_MODEL_PATHS = [
  '/models/low-building-kenney.glb',
  '/models/low-wide-kenney.glb',
  '/models/skyscraper-kenney.glb',
];
BUILDING_MODEL_PATHS.forEach((p) => useGLTF.preload(p));

const SKYLINE_BUILDINGS = (() => {
  const rand = seededRandom(1337);
  const specs = [];
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const z = row * 5.6 + rand() * 3;
    const x = side * (19 + rand() * 14);
    const modelIndex = Math.floor(rand() * BUILDING_MODEL_PATHS.length);
    const scale = (modelIndex === 2 ? 2.2 : 1.4) + rand() * 1.2;
    const rotationY = Math.floor(rand() * 4) * (Math.PI / 2);
    specs.push({ x, z, modelIndex, scale, rotationY });
  }
  return specs;
})();

function SkylineBuilding({ path, position, rotationY, scale }) {
  const { scene } = useGLTF(path);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} position={position} rotation={[0, rotationY, 0]} scale={scale} />;
}

function CitySkyline() {
  return (
    <group>
      <Suspense fallback={null}>
        {SKYLINE_BUILDINGS.map((b, i) => (
          <SkylineBuilding
            key={i}
            path={BUILDING_MODEL_PATHS[b.modelIndex]}
            position={[b.x, 0, b.z]}
            rotationY={b.rotationY}
            scale={b.scale}
          />
        ))}
      </Suspense>
    </group>
  );
}

/* -------------------------------------------------------------- finish gate */
// A glowing arch just past the final achievement, marking the end of the
// journey — the payoff beat at the far end of the drivable road.
function FinishGate({ waypoints }) {
  const beamRef = useRef();
  const { gatePosition, heading } = useMemo(() => {
    const last = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2];
    const dir = new THREE.Vector3().subVectors(last, prev).normalize();
    const gp = last.clone().addScaledVector(dir, 3.6);
    return {
      gatePosition: gp,
      heading: Math.atan2(dir.x, dir.z),
    };
  }, [waypoints]);

  useFrame((state) => {
    if (beamRef.current) {
      beamRef.current.material.emissiveIntensity = 1.3 + Math.sin(state.clock.elapsedTime * 2.4) * 0.5;
    }
  });

  return (
    <group position={gatePosition} rotation={[0, heading, 0]}>
      {[-1.7, 1.7].map((x) => (
        <RoundedBox key={x} args={[0.28, 3.2, 0.28]} radius={0.06} position={[x, 1.6, 0]}>
          <meshStandardMaterial color="#15171f" roughness={0.5} metalness={0.4} />
        </RoundedBox>
      ))}
      <RoundedBox ref={beamRef} args={[3.75, 0.26, 0.26]} radius={0.08} position={[0, 3.15, 0]}>
        <meshStandardMaterial color="#2f5fff" emissive="#2f5fff" emissiveIntensity={1.4} />
      </RoundedBox>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 2, 32]} />
        <meshBasicMaterial color="#ff5b1f" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------- ground */
function Ground({ waypoints }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, waypoints[waypoints.length - 1].z / 2]}>
      <planeGeometry args={[40, waypoints[waypoints.length - 1].z + 12]} />
      <meshStandardMaterial color="#101116" roughness={0.95} />
    </mesh>
  );
}

/* -------------------------------------------------------------- scene root */
function JourneyScene({ waypoints, curve, totalLength, nodeDistances, activeIndex, onSelectIndex, visitedRef, hudRef, autopilotRef, collectingIndex, onStarCollect, onCollectComplete, touchKeysRef }) {
  const carRef = useRef();
  const wheelRefs = useRef({});
  const steerRef = useRef({});
  const cameraTargetRef = useRef({ position: new THREE.Vector3(), heading: 0, speed: 0 });
  const proximityRef = useRef(new Array(ACHIEVEMENTS.length).fill(0));
  const [, setProxTick] = useState(0);
  const { camera, gl } = useThree();

  const handleArrive = (idx) => {
    if (visitedRef.current[idx]) {
      onSelectIndex(idx);
      return;
    }
    const worldPos = waypoints[idx + 1].clone().add(new THREE.Vector3(0, 1.15, 0));
    const ndc = worldPos.project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    const screenPos = {
      x: (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-ndc.y * 0.5 + 0.5) * rect.height + rect.top,
    };
    onStarCollect(idx, screenPos);
  };

  return (
    <>
      <color attach="background" args={['#0c0d11']} />
      <fog attach="fog" args={['#0c0d11', 16, 52]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} />
      <pointLight position={[0, 4, 0]} intensity={0.4} color="#ff5b1f" />
      <Environment preset="city" environmentIntensity={0.6} />

      <CitySkyline />
      <Ground waypoints={waypoints} />
      <Road curve={curve} length={totalLength} />
      <RoadEdgeRidges curve={curve} length={totalLength} />
      <StreetLights curve={curve} length={totalLength} />
      <Suspense fallback={null}>
        <StartBuilding />
      </Suspense>
      <FinishGate waypoints={waypoints} />

      {ACHIEVEMENTS.map((item, i) => {
        const isVisited = visitedRef.current[i];
        const isCollecting = collectingIndex === i;
        if (isVisited && !isCollecting) {
          return <CompletedMarker key={item.title} tier={tierFromMedal(item.medal)} position={waypoints[i + 1]} />;
        }
        return (
          <AchievementStar
            key={item.title}
            position={waypoints[i + 1]}
            tier={tierFromMedal(item.medal)}
            active={activeIndex === i}
            visited={isVisited}
            proximity={proximityRef.current[i]}
            collecting={isCollecting}
            onSelect={() => onSelectIndex(i)}
            onCollectComplete={() => onCollectComplete(i)}
          />
        );
      })}
      <ProximityDriver setTick={setProxTick} />

      <Suspense fallback={null}>
        <Car groupRef={carRef} wheelRefs={wheelRefs} steerRef={steerRef} />
      </Suspense>

      <DriveController
        curve={curve}
        totalLength={totalLength}
        nodeDistances={nodeDistances}
        carRef={carRef}
        wheelRefs={wheelRefs}
        steerRef={steerRef}
        cameraTargetRef={cameraTargetRef}
        onArrive={handleArrive}
        activeIndex={activeIndex}
        visitedRef={visitedRef}
        hudRef={hudRef}
        touchKeysRef={touchKeysRef}
        autopilotRef={autopilotRef}
        proximityRef={proximityRef}
      />
      <ChaseCamera cameraTargetRef={cameraTargetRef} />
    </>
  );
}

/* -------------------------------------------------------------- side panel */
function AchievementPanel({ item, index, total, onClose, onPrev, onNext }) {
  const [activeImg, setActiveImg] = useState(0);
  const images = item.images || [];
  const tier = tierFromMedal(item.medal);

  useEffect(() => {
    setActiveImg(0);
    if (images.length < 2) return undefined;
    const id = setInterval(() => setActiveImg((i) => (i + 1) % images.length), 2200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, images.length]);

  return (
    <div className={`lvl-panel tier-${tier}`} role="dialog" aria-modal="false" aria-label={item.title}>
      <button type="button" className="lvl-panel-close" onClick={onClose} aria-label="Close">×</button>
      <div className="lvl-panel-scroll">
        {images.length > 0 && (
          <div className="lvl-panel-media">
            <div className="lvl-panel-scroller" style={{ transform: `translateX(-${activeImg * 100}%)` }}>
              {images.map((src) => (
                <img key={src} src={src} alt={item.title} />
              ))}
            </div>
            {images.length > 1 && (
              <div className="lvl-panel-dots" aria-hidden="true">
                {images.map((src, i) => (
                  <span key={src} className={i === activeImg ? 'active' : ''} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="lvl-panel-head">
          <span className={`lvl-panel-medal tier-${tier}`} aria-hidden="true">{item.medal}</span>
          <div>
            <h3 className="lvl-panel-title">{item.title}</h3>
            {item.subtitle && <p className="lvl-panel-sub">{item.subtitle}</p>}
          </div>
        </div>

        {item.date && <p className="lvl-panel-date">{item.date}</p>}
        <p className="lvl-panel-desc">{item.description}</p>

        {item.achieved && item.achieved.length > 0 && (
          <div className="lvl-panel-section">
            <p className="lvl-panel-label">What I achieved</p>
            <ul className="lvl-panel-list">
              {item.achieved.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {item.role && (
          <div className="lvl-panel-section">
            <p className="lvl-panel-label">Role / contribution</p>
            <p className="lvl-panel-role">{item.role}</p>
          </div>
        )}
      </div>

      <div className="lvl-panel-nav">
        <button type="button" onClick={onPrev} disabled={index === 0}>‹ Prev</button>
        <span className="lvl-panel-count">{index + 1} / {total}</span>
        <button type="button" onClick={onNext} disabled={index === total - 1}>Next ›</button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- reward coin */
// A DOM-level (non-R3F) coin that flies from the collected star's screen
// position to the milestones counter: pop up -> fly -> shrink into the UI.
const COIN_POP_MS = 160;
const COIN_FLY_MS = 420;
const COIN_SHRINK_MS = 300;

function CollectibleCoin({ from, to, onDone }) {
  const [phase, setPhase] = useState('spawn');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase('pop'));
    const t1 = setTimeout(() => setPhase('fly'), COIN_POP_MS);
    const t2 = setTimeout(() => setPhase('shrink'), COIN_POP_MS + COIN_FLY_MS);
    const t3 = setTimeout(() => onDoneRef.current(), COIN_POP_MS + COIN_FLY_MS + COIN_SHRINK_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  let pos = from;
  let transition = 'none';
  if (phase === 'pop') {
    pos = { x: from.x, y: from.y - 16 };
    transition = 'top 0.16s cubic-bezier(.34,1.56,.64,1)';
  } else if (phase === 'fly' || phase === 'shrink') {
    pos = to;
    transition = phase === 'fly' ? 'left 0.42s cubic-bezier(.3,.6,.25,1), top 0.42s cubic-bezier(.3,.6,.25,1)' : 'none';
  }

  return (
    <div
      className={`lvl-coin lvl-coin-sparkle${phase === 'shrink' ? ' lvl-coin-shrink' : ''}`}
      style={{ left: pos.x, top: pos.y, transition }}
      aria-hidden="true"
    >
      🪙
    </div>
  );
}

/* ------------------------------------------------------------- journey map */
function JourneyMap() {
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [activeIndex, setActiveIndex] = useState(null);
  const [, setVisitedTick] = useState(0);
  const [collectingIndex, setCollectingIndex] = useState(null);
  const [coin, setCoin] = useState(null);
  const [progressPulse, setProgressPulse] = useState(false);
  const visitedRef = useRef(new Array(ACHIEVEMENTS.length).fill(false));
  const collectFromRef = useRef(null);
  const rewardRef = useRef(null);
  const hudRef = useRef(null);
  const autopilotRef = useRef(null);
  const levelRef = useRef(-1);
  const touchKeysRef = useRef({ forward: false, backward: false });

  const setTouchKey = useCallback((key, value) => (e) => {
    e.preventDefault();
    touchKeysRef.current[key] = value;
    if (value && hudRef.current) hudRef.current.classList.add('lvl-hud-fade');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsNarrow(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const waypoints = useMemo(() => buildWaypoints(ACHIEVEMENTS.length), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.4), [waypoints]);
  const totalLength = useMemo(() => curve.getLength(), [curve]);
  const nodeDistances = useMemo(() => {
    const divisions = waypoints.length - 1;
    const lengths = curve.getLengths(divisions);
    return waypoints.slice(1).map((_, i) => lengths[i + 1]);
  }, [curve, waypoints]);

  const goToLevel = useCallback((idx) => {
    const clamped = THREE.MathUtils.clamp(idx, 0, ACHIEVEMENTS.length - 1);
    levelRef.current = clamped;
    autopilotRef.current = clamped;
    if (hudRef.current) hudRef.current.classList.add('lvl-hud-fade');
  }, []);

  const selectIndex = useCallback((idx) => {
    levelRef.current = idx;
    setActiveIndex(idx);
  }, []);

  const closePanel = useCallback(() => setActiveIndex(null), []);

  // Vehicle reached an uncollected star: it vanishes immediately, counts
  // toward the collection right away, and the reward coin pops up on the
  // spot at the same instant — the burst flash is just a visual overlay
  // that plays alongside it, not something the coin waits on.
  const handleStarCollect = useCallback((idx, screenPos) => {
    collectFromRef.current = screenPos;
    setCollectingIndex(idx);
    if (!visitedRef.current[idx]) {
      visitedRef.current[idx] = true;
      setVisitedTick((n) => n + 1);
    }
    const rect = rewardRef.current ? rewardRef.current.getBoundingClientRect() : null;
    const to = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : screenPos;
    setCoin({ idx, key: `${idx}-${Date.now()}`, from: screenPos, to });
  }, []);

  // Burst flash finished: just clear the collecting flag so the star's spot
  // settles into its completed-marker state.
  const handleCollectComplete = useCallback((idx) => {
    setCollectingIndex((current) => (current === idx ? null : current));
  }, []);

  // Coin landed: pulse the counter and open the achievement panel.
  const handleCoinDone = useCallback(
    (idx) => {
      setCoin(null);
      setProgressPulse(true);
      selectIndex(idx);
      window.setTimeout(() => setProgressPulse(false), 600);
    },
    [selectIndex]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closePanel();
        return;
      }
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToLevel(levelRef.current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToLevel(levelRef.current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePanel, goToLevel]);

  const unlockedCount = visitedRef.current.filter(Boolean).length;

  return (
    <div className="lvl-map-outer reveal">
      <div className="lvl-header">
        <div className="lvl-initials"><span>HS</span></div>
        <div className="lvl-progress-wrap">
          <div ref={rewardRef} className={`lvl-progress-label${progressPulse ? ' lvl-pulse' : ''}`}>
            {unlockedCount} / {ACHIEVEMENTS.length} MILESTONES UNLOCKED
          </div>
          <div className="lvl-progress-track">
            <div className="lvl-progress-fill" style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className={`lvl-journey ${activeIndex !== null ? 'lvl-panel-open' : ''}`}>
        <div className="lvl-3d-stage">
          <div className="lvl-hud-hint" ref={hudRef}>
            {isNarrow ? 'Tap ▲ / ▼ to drive · click a star' : 'WASD to drive · Enter / ↓ next · ↑ prev · click a star'}
          </div>
          <Canvas
            className="lvl-3d-canvas"
            shadows={false}
            dpr={isNarrow ? 1 : [1, 1.6]}
            gl={{ antialias: !isNarrow, alpha: false }}
            camera={{ fov: 46, near: 0.1, far: 100, position: [0, 3.2, -6] }}
          >
            <JourneyScene
              waypoints={waypoints}
              curve={curve}
              totalLength={totalLength}
              nodeDistances={nodeDistances}
              activeIndex={activeIndex}
              onSelectIndex={selectIndex}
              visitedRef={visitedRef}
              hudRef={hudRef}
              autopilotRef={autopilotRef}
              collectingIndex={collectingIndex}
              onStarCollect={handleStarCollect}
              onCollectComplete={handleCollectComplete}
              touchKeysRef={touchKeysRef}
            />
          </Canvas>
          <div className="lvl-touch-controls">
            <button
              type="button"
              aria-label="Reverse / brake"
              className="lvl-touch-btn lvl-touch-btn--brake"
              onPointerDown={setTouchKey('backward', true)}
              onPointerUp={setTouchKey('backward', false)}
              onPointerLeave={setTouchKey('backward', false)}
              onPointerCancel={setTouchKey('backward', false)}
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Drive forward"
              className="lvl-touch-btn lvl-touch-btn--gas"
              onPointerDown={setTouchKey('forward', true)}
              onPointerUp={setTouchKey('forward', false)}
              onPointerLeave={setTouchKey('forward', false)}
              onPointerCancel={setTouchKey('forward', false)}
            >
              ▲
            </button>
          </div>
        </div>

        {activeIndex !== null && (
          <>
            <div className="lvl-panel-scrim" onClick={closePanel} />
            <AchievementPanel
              item={ACHIEVEMENTS[activeIndex]}
              index={activeIndex}
              total={ACHIEVEMENTS.length}
              onClose={closePanel}
              onPrev={() => goToLevel(activeIndex - 1)}
              onNext={() => goToLevel(activeIndex + 1)}
            />
          </>
        )}
      </div>

      {coin && <CollectibleCoin key={coin.key} from={coin.from} to={coin.to} onDone={() => handleCoinDone(coin.idx)} />}
    </div>
  );
}

/* ---------------------------------------------------------------- export */
export default function Achievements() {
  return (
    <section id="achievements" className="section">
      <div className="container">
        <p className="section-tag reveal">Recognition</p>
        <h2 className="section-title reveal">Achievements &amp; Participation</h2>

        <JourneyMap />

        <div className="extra-curricular reveal">
          <h3>Extra-Curricular Activities</h3>
          <div className="tag-row">
            <span className="tag outline">🚩 Treasurer — Youth Red Cross</span>
            <span className="tag outline">⚡ Member — IEEE Student Branch</span>
          </div>
        </div>
      </div>
    </section>
  );
}
