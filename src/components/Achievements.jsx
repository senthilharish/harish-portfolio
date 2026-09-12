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

/* --------------------------------------------------------- decoration icons */
// A single, quiet prop type — soft drifting clouds — instead of a cluster of
// literal tech-gadget shapes (laptop/server/terminal), which read as clutter
// next to the road, car and skyline.
function CloudObject({ color }) {
  const group = useRef();
  useFrame((state) => {
    if (group.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.08;
      group.current.scale.set(s, s, s);
    }
  });
  const puffs = [
    [0, 0, 0, 0.42],
    [0.4, 0.12, 0, 0.32],
    [-0.4, 0.1, 0, 0.32],
    [0.15, 0.3, 0, 0.3],
  ];
  return (
    <group ref={group}>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 14, 14]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

const DECO_COLORS = { cyan: '#35d7e0', amber: '#ffbe4d' };
const DECORATIONS = [
  { Object: CloudObject, row: 3.4, side: 'left', color: 'amber' },
  { Object: CloudObject, row: 7.2, side: 'right', color: 'cyan' },
];

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

// Collect-animation timing: fast, satisfying, game-like — shrink-to-vehicle
// plus a brief burst, well inside the 0.8-1.5s the whole sequence should take.
const COLLECT_SHRINK_MS = 360;
const COLLECT_BURST_MS = 320;

function AchievementStar({ position, tier, active, visited, collecting, collectStartTime, onCollectDone, proximity, onSelect }) {
  const group = useRef();
  const starMesh = useRef();
  const glow = useRef();
  const burstRef = useRef();
  const [hovered, setHovered] = useState(false);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);
  const doneFiredRef = useRef(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = 1.15 + Math.sin(t * 1.3 + seed) * 0.12;
    }

    if (collecting) {
      const elapsed = Date.now() - collectStartTime;
      const shrinkT = Math.min(1, elapsed / COLLECT_SHRINK_MS);
      const eased = 1 - Math.pow(1 - shrinkT, 3); // ease-in: fast toward the end, like snapping to the car
      const s = Math.max(0, 1 - eased) * (0.85 + proximity * 0.6);
      if (starMesh.current) {
        starMesh.current.rotation.y += 0.35; // spins quickly while collapsing
        starMesh.current.scale.setScalar(s);
      }
      if (burstRef.current) {
        const burstT = Math.min(1, elapsed / COLLECT_BURST_MS);
        burstRef.current.scale.setScalar(0.5 + burstT * 2.2);
        burstRef.current.material.opacity = 0.55 * (1 - burstT);
      }
      if (glow.current) glow.current.material.emissiveIntensity = 2.2;
      if (shrinkT >= 1 && !doneFiredRef.current) {
        doneFiredRef.current = true;
        onCollectDone && onCollectDone();
      }
      return;
    }
    doneFiredRef.current = false;

    if (starMesh.current) {
      const spinSpeed = 0.008 + proximity * 0.05 + (active ? 0.02 : 0);
      starMesh.current.rotation.y += spinSpeed;
      const focus = active ? 1.4 : hovered ? 1.2 : 1;
      const target = (0.85 + proximity * 0.6) * focus;
      starMesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    }
    if (glow.current) {
      const base = 0.35;
      const approachPulse = proximity > 0.6 ? Math.sin(t * (6 + proximity * 6)) * 0.25 * proximity : 0;
      glow.current.material.emissiveIntensity = active
        ? 1.8 + Math.sin(t * 5) * 0.4
        : base + proximity * 0.6 + approachPulse + (hovered ? 0.3 : 0);
    }
  });

  const color = TIER_COLOR[tier];

  if (visited && !collecting) {
    return <CheckpointMarker position={position} tier={tier} onSelect={onSelect} />;
  }

  return (
    <group position={position}>
      <group ref={group}>
        <mesh
          ref={starMesh}
          rotation={[0, 0, 0]}
          geometry={STAR_GEOMETRY}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
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
          <mesh ref={burstRef}>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} />
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

// Left behind once a star is collected — a small dim checkpoint instead of
// vanishing outright, so the road still reads as "10 stops" after the fact.
function CheckpointMarker({ position, tier, onSelect }) {
  const color = TIER_COLOR[tier];
  return (
    <group position={position}>
      <mesh
        position={[0, 0.07, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.32, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
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
function DriveController({ curve, totalLength, nodeDistances, carRef, wheelRefs, steerRef, cameraTargetRef, onArrive, activeIndex, collecting, visitedRef, hudRef, autopilotRef, proximityRef }) {
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
    const inputLocked = (activeIndex !== null || collecting) && autopilotIdx === null;

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
        const STOP_DISTANCE = 1.7;
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
        if (keys.current.forward) speed.current += ACCEL * delta;
        else if (keys.current.backward) speed.current -= BRAKE * delta;
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

/* ------------------------------------------------------- camera exposer */
// Hands the live THREE.Camera out to JourneyMap (outside the Canvas) so it
// can project a star's world position to screen space for the coin overlay.
function CameraExposer({ cameraRef }) {
  const { camera } = useThree();
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
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
// A static, deterministically-seeded skyline flanking the road, well outside
// the drivable area. Built from three real low-poly building models (CC0,
// "City Kit" by Kenney via poly.pizza) instead of flat boxes, so it reads as
// an actual skyline rather than abstract silhouettes.
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const SKYLINE_MODEL_PATHS = [
  '/models/skyscraper-kenney.glb',
  '/models/low-building-kenney.glb',
  '/models/low-wide-kenney.glb',
];
// Base scale that makes each model's real-world footprint (~1 unit) read as
// a building next to the ~2-unit-long car; height scale layered on top for
// varied skyline silhouette.
const SKYLINE_VARIANT_SCALE = [2.6, 3.2, 3.4];
const SKYLINE_BUILDINGS = (() => {
  const rand = seededRandom(1337);
  const specs = [];
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const z = row * 7.5 + rand() * 4;
    const x = side * (9 + rand() * 7);
    const variant = Math.floor(rand() * SKYLINE_MODEL_PATHS.length);
    const scale = SKYLINE_VARIANT_SCALE[variant] * (0.75 + rand() * 0.9);
    const rotY = rand() * Math.PI * 2;
    specs.push({ x, z, variant, scale, rotY });
  }
  return specs;
})();

function CitySkyline() {
  const { scene: skyscraperScene } = useGLTF(SKYLINE_MODEL_PATHS[0]);
  const { scene: lowBuildingScene } = useGLTF(SKYLINE_MODEL_PATHS[1]);
  const { scene: lowWideScene } = useGLTF(SKYLINE_MODEL_PATHS[2]);

  const instances = useMemo(() => {
    const models = [skyscraperScene, lowBuildingScene, lowWideScene];
    return SKYLINE_BUILDINGS.map((b) => ({ ...b, object: models[b.variant].clone(true) }));
  }, [skyscraperScene, lowBuildingScene, lowWideScene]);

  return (
    <group>
      {instances.map((b, i) => (
        <primitive key={i} object={b.object} position={[b.x, 0, b.z]} rotation={[0, b.rotY, 0]} scale={b.scale} />
      ))}
    </group>
  );
}
SKYLINE_MODEL_PATHS.forEach((p) => useGLTF.preload(p));

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
function JourneyScene({ waypoints, curve, totalLength, nodeDistances, activeIndex, onSelectIndex, onArrive, collectState, onCollectDone, visitedRef, hudRef, autopilotRef, cameraRef }) {
  const carRef = useRef();
  const wheelRefs = useRef({});
  const steerRef = useRef({});
  const cameraTargetRef = useRef({ position: new THREE.Vector3(), heading: 0, speed: 0 });
  const proximityRef = useRef(new Array(ACHIEVEMENTS.length).fill(0));
  const [, setProxTick] = useState(0);

  return (
    <>
      <CameraExposer cameraRef={cameraRef} />
      <color attach="background" args={['#0c0d11']} />
      <fog attach="fog" args={['#0c0d11', 16, 52]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} />
      <pointLight position={[0, 4, 0]} intensity={0.4} color="#ff5b1f" />
      <Environment preset="city" environmentIntensity={0.6} />

      <Suspense fallback={null}>
        <CitySkyline />
      </Suspense>
      <Ground waypoints={waypoints} />
      <Road curve={curve} length={totalLength} />
      <FinishGate waypoints={waypoints} />

      {ACHIEVEMENTS.map((item, i) => (
        <AchievementStar
          key={item.title}
          position={waypoints[i + 1]}
          tier={tierFromMedal(item.medal)}
          active={activeIndex === i}
          visited={visitedRef.current[i]}
          collecting={collectState?.index === i}
          collectStartTime={collectState?.index === i ? collectState.startTime : 0}
          onCollectDone={() => onCollectDone(i)}
          proximity={proximityRef.current[i]}
          onSelect={() => onSelectIndex(i)}
        />
      ))}
      <ProximityDriver setTick={setProxTick} />

      {DECORATIONS.map((deco, i) => {
        const t = deco.row / (ACHIEVEMENTS.length + 1);
        const p = curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1));
        const side = deco.side === 'left' ? -1 : 1;
        return (
          <group key={i} position={[p.x + side * 2.4, 1, p.z]}>
            <deco.Object color={DECO_COLORS[deco.color]} />
          </group>
        );
      })}

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
        onArrive={onArrive}
        activeIndex={activeIndex}
        collecting={collectState !== null}
        visitedRef={visitedRef}
        hudRef={hudRef}
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

/* --------------------------------------------------------- coin reward */
// A DOM-space (not WebGL) overlay: bounces up off the collected star's last
// screen position, flies to the milestones counter, shrinks away, and pulses
// the counter on arrival. Lives outside the Canvas since its destination —
// the progress label — is a normal DOM element.
const COIN_BOUNCE_MS = 220;
const COIN_FLY_MS = 620;
function CoinReward({ event, targetRef, onDone }) {
  const [pos, setPos] = useState(event.from);
  const [sparkle, setSparkle] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    let raf;
    const from = event.from;
    const targetEl = targetRef.current;
    const rect = targetEl ? targetEl.getBoundingClientRect() : null;
    const to = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : from;
    const bounceApex = { x: from.x, y: from.y - 42 };
    const total = COIN_BOUNCE_MS + COIN_FLY_MS;
    const t0 = performance.now();

    const frame = (now) => {
      const elapsed = now - t0;
      if (elapsed < COIN_BOUNCE_MS) {
        const t = elapsed / COIN_BOUNCE_MS;
        const eased = 1 - Math.pow(1 - t, 2);
        setPos({ x: from.x, y: from.y - 42 * eased });
      } else if (elapsed < total) {
        const t = (elapsed - COIN_BOUNCE_MS) / COIN_FLY_MS;
        const eased = t * t * (3 - 2 * t);
        setPos({ x: bounceApex.x + (to.x - bounceApex.x) * eased, y: bounceApex.y + (to.y - bounceApex.y) * eased });
        if (t > 0.7) setSparkle(false);
      } else if (!doneRef.current) {
        doneRef.current = true;
        if (targetEl) {
          targetEl.classList.add('lvl-pulse');
          setTimeout(() => targetEl.classList.remove('lvl-pulse'), 550);
        }
        onDone(event.index);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return (
    <div className={`lvl-coin${sparkle ? ' lvl-coin-sparkle' : ' lvl-coin-shrink'}`} style={{ left: pos.x, top: pos.y }} aria-hidden="true">
      🪙
    </div>
  );
}

/* ------------------------------------------------------------- journey map */
function JourneyMap() {
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [activeIndex, setActiveIndex] = useState(null);
  const [, setVisitedTick] = useState(0);
  const [collectState, setCollectState] = useState(null); // { index, startTime } while a star is mid-collect
  const [coinEvent, setCoinEvent] = useState(null); // { id, from: {x,y} } driving the DOM coin overlay
  const visitedRef = useRef(new Array(ACHIEVEMENTS.length).fill(false));
  const hudRef = useRef(null);
  const autopilotRef = useRef(null);
  const levelRef = useRef(-1);
  const cameraRef = useRef(null);
  const stageRef = useRef(null);
  const progressRef = useRef(null);

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

  // Arrival at a star: already-collected ones just re-open the panel; a
  // fresh one kicks off the collect animation (shrink + burst) instead of
  // opening the panel immediately — the panel opens once the coin lands.
  const handleArrive = useCallback((idx) => {
    if (visitedRef.current[idx]) {
      selectIndex(idx);
      return;
    }
    setCollectState({ index: idx, startTime: Date.now() });
  }, [selectIndex]);

  // Star finished shrinking: mark it collected, launch the reward coin from
  // its last screen position toward the milestones counter.
  const handleCollectDone = useCallback((idx) => {
    visitedRef.current[idx] = true;
    setVisitedTick((n) => n + 1);
    setCollectState(null);

    const camera = cameraRef.current;
    const stageEl = stageRef.current;
    let from = { x: stageEl ? stageEl.clientWidth / 2 : 0, y: stageEl ? stageEl.clientHeight / 2 : 0 };
    if (camera && stageEl) {
      const p = waypoints[idx + 1].clone();
      p.y += 1.15;
      p.project(camera);
      const rect = stageEl.getBoundingClientRect();
      from = {
        x: rect.left + (p.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-p.y * 0.5 + 0.5) * rect.height,
      };
    }
    setCoinEvent({ id: Date.now(), from, index: idx });
  }, [waypoints]);

  // Coin reached the counter: reveal the achievement panel.
  const handleCoinDone = useCallback((idx) => {
    setCoinEvent(null);
    selectIndex(idx);
  }, [selectIndex]);

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
        <div className="lvl-initials" aria-hidden="true">H<span>S</span></div>
        <div className="lvl-progress-wrap">
          <p className="lvl-progress-label" ref={progressRef}>{unlockedCount} / {ACHIEVEMENTS.length} Milestones Unlocked</p>
          <div className="lvl-progress-track">
            <div className="lvl-progress-fill" style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className={`lvl-journey ${activeIndex !== null ? 'lvl-panel-open' : ''}`}>
        <div className="lvl-3d-stage" ref={stageRef}>
          <div className="lvl-hud-hint" ref={hudRef}>WASD to drive · Enter / ↓ next · ↑ prev · click a star</div>
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
              onArrive={handleArrive}
              collectState={collectState}
              onCollectDone={handleCollectDone}
              visitedRef={visitedRef}
              hudRef={hudRef}
              autopilotRef={autopilotRef}
              cameraRef={cameraRef}
            />
          </Canvas>
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

      {coinEvent && <CoinReward event={coinEvent} targetRef={progressRef} onDone={handleCoinDone} />}
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
