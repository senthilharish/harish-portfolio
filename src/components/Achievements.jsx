import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';

/* ---------------------------------------------------------------- data */
// Same source facts as before, just split into title/subtitle/description
// so the level-map nodes and hover popup each show the right amount.
// `images` takes any number of paths (0, 1, or several) — drop real file
// paths in here, e.g. images: ['/achievements/hackathon-2025-1.jpg', ...].
const ACHIEVEMENTS = [
  {
    medal: '🥇',
    label: 'Hackathon 2025',
    title: 'College Hackathon 2025',
    subtitle: 'Biodegradable Film Risk Monitoring System',
    teaser: '1st place · Risk monitoring system',
    description: 'Won first place at the College Hackathon 2025 for building a biodegradable film risk monitoring system.',
    images: [],
  },
  {
    medal: '🥇',
    label: 'SDG 12 Hackathon',
    title: 'SDG 12 Hackathon',
    subtitle: 'Techfest 2025',
    teaser: '1st place · Techfest 2025',
    description: 'Won first place at the SDG 12 Hackathon, part of Techfest 2025.',
    images: [],
  },
  {
    medal: '🥇',
    label: 'Coding for Sustainability',
    title: 'Coding for Sustainability',
    subtitle: 'Techfest 2025',
    teaser: '1st place · Techfest 2025',
    description: 'Won first place in the Coding for Sustainability track at Techfest 2025.',
    images: [],
  },
  {
    medal: '🥈',
    label: 'Hackathon 2024',
    title: 'College Hackathon 2024',
    subtitle: 'Litter Detection Project',
    teaser: '2nd place · Litter detection',
    description: 'Placed second at the College Hackathon 2024 for a litter detection project.',
    images: [],
  },
  {
    medal: '🥉',
    label: '18-Hour Hackathon',
    title: '18-Hour Hackathon',
    subtitle: 'Govt. College of Engineering, Thrissur',
    teaser: '3rd place · Thrissur',
    description: 'Placed third at the 18-Hour Hackathon hosted by Govt. College of Engineering, Thrissur.',
    images: ['/assets/hack1-trisure.jpeg', '/assets/thirisure_2.jpeg'],
  },
  {
    medal: '📄',
    label: 'IEEE Paper — NIT Delhi',
    title: 'Paper Presentation',
    subtitle: 'IEEE Conference, NIT Delhi',
    teaser: 'Agri Bio Trace',
    description: 'Presented a paper on Agri Bio Trace at an IEEE Conference held at NIT Delhi.',
    images: ['/assets/nit_delhi_1.jpeg','/assets/ust_global2.jpeg'],
  },
  {
    medal: '🎤',
    label: 'IEEE Reliability Summit',
    title: 'Conference Participant',
    subtitle: 'IEEE Reliability Summit, Madras Section',
    teaser: 'IEEE Madras Section',
    description: 'Participated in the IEEE Reliability Summit, Madras Section.',
    images: [],
  },
  {
    medal: '🎓',
    label: "ICCIDA '24",
    title: 'Conference Attendee',
    subtitle: "Int'l Conference on Computational Intelligence & Data Analytics 2024",
    teaser: 'Computational intelligence & data analytics',
    description: "Attended the International Conference on Computational Intelligence & Data Analytics 2024.",
    images: [],
  },
  {
    medal: '💡',
    label: "Withon's 25",
    title: 'Hackathon Participant',
    subtitle: "Withon's 25, Anna University Guindy",
    teaser: 'Anna University Guindy',
    description: "Participated in Withon's 25 at Anna University, Guindy.",
    images: ['/assets/comp_image.jpeg'],
  },
  {
    medal: '🌍',
    label: 'UST Global Hackathon',
    title: 'Final Hackathon',
    subtitle: 'U.S.T Global',
    teaser: 'U.S.T Global',
    description: 'Participated in the U.S.T Global Final Hackathon.',
    images: ['/assets/ust_global_1.jpeg', '/assets/ust_global2.jpeg'],
  },
];

function tierFromMedal(medal) {
  if (medal === '🥇') return 'gold';
  if (medal === '🥈') return 'silver';
  if (medal === '🥉') return 'bronze';
  return 'none';
}

/* ------------------------------------------------------- path geometry */
// Converts a small ordered list of {x,y} waypoints into a smooth SVG path
// via uniform Catmull-Rom -> cubic Bezier conversion, so the winding route
// is generated from the node coordinates rather than hand-placed curves.
function catmullRomToBezierPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const VIEW_W = 600;
const ROW_HEIGHT = { desktop: 138, mobile: 118 };
const AMPLITUDE = { desktop: 225, mobile: 28 };
// A small set of waypoints tracing a wide, lazy S — a couple of broad loops
// spanning nearly the full width, rather than a tight frequent zigzag.
// Fed through Catmull-Rom smoothing below, not hand-placed bezier curves.
const LANE_PATTERN = [0.1, 0.7, 0.95, 0.0, -0.95, -0.6, 0.2, 0.7, 0.95, 0.3];

function buildLayout(count, isNarrow) {
  const rowHeight = isNarrow ? ROW_HEIGHT.mobile : ROW_HEIGHT.desktop;
  const amplitude = isNarrow ? AMPLITUDE.mobile : AMPLITUDE.desktop;
  const points = Array.from({ length: count }, (_, i) => ({
    x: VIEW_W / 2 + LANE_PATTERN[i % LANE_PATTERN.length] * amplitude,
    y: rowHeight * i + rowHeight / 2,
  }));
  const totalHeight = rowHeight * count;
  return { points, totalHeight, rowHeight };
}

/* --------------------------------------------------------- decoration icons */
// Small computer-science-themed 3D objects (plain three.js primitives, no
// model loading — same technique already used for props in AzeemJourney),
// each rendered in its own tiny WebGL canvas and given a slow idle
// animation so the map feels alive without competing with the nodes.
function LaptopObject({ color }) {
  const screenRef = useRef();
  const group = useRef();
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
    if (screenRef.current) {
      screenRef.current.material.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.25;
    }
  });
  return (
    <group ref={group} rotation={[0.25, 0.6, 0]}>
      <RoundedBox args={[1.7, 0.09, 1.15]} radius={0.04} position={[0, -0.4, 0.1]}>
        <meshStandardMaterial color={color} transparent opacity={0.80} roughness={0.4} />
      </RoundedBox>
      <RoundedBox ref={screenRef} args={[1.7, 1.05, 0.06]} radius={0.04} position={[0, 0.14, -0.42]} rotation={[-0.25, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.85} />
      </RoundedBox>
    </group>
  );
}

function ServerObject({ color }) {
  const group = useRef();
  const leds = useRef([]);
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.3;
    leds.current.forEach((m, i) => {
      if (m) m.material.emissiveIntensity = state.clock.elapsedTime % (1.2 + i * 0.3) < 0.6 ? 1.2 : 0.1;
    });
  });
  return (
    <group ref={group}>
      {[0.55, 0, -0.55].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <RoundedBox args={[1.5, 0.42, 0.9]} radius={0.05}>
            <meshStandardMaterial color={color} transparent opacity={0.75} roughness={0.5} />
          </RoundedBox>
          <mesh ref={(el) => (leds.current[i] = el)} position={[-0.55, 0, 0.47]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SatelliteObject({ color }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={group}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.80} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0.6, 0, 0]}>
        <coneGeometry args={[0.75, 0.35, 20, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.70} side={2} />
      </mesh>
      <mesh position={[0, 0.28, 0.18]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

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
          <meshStandardMaterial color={color} transparent opacity={0.80} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function RobotObject({ color }) {
  const group = useRef();
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.4;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
    }
  });
  return (
    <group ref={group}>
      <RoundedBox args={[0.95, 0.75, 0.7]} radius={0.1} position={[0, -0.1, 0]}>
        <meshStandardMaterial color={color} transparent opacity={0.80} />
      </RoundedBox>
      <mesh position={[-0.22, -0.1, 0.36]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0.22, -0.1, 0.36]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
        <meshStandardMaterial color={color} transparent opacity={0.90} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function TerminalObject({ color }) {
  const group = useRef();
  const lines = useRef([]);
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.32;
    const t = Math.floor(state.clock.elapsedTime * 1.5) % (lines.current.length + 2);
    lines.current.forEach((m, i) => {
      if (m) m.material.opacity = i < t ? 0.85 : 0.15;
    });
  });
  return (
    <group ref={group}>
      <RoundedBox args={[1.7, 1.15, 0.06]} radius={0.05}>
        <meshStandardMaterial color={color} transparent opacity={0.65} />
      </RoundedBox>
      {[0.32, 0.1, -0.12, -0.34].map((y, i) => (
        <mesh key={i} ref={(el) => (lines.current[i] = el)} position={[-0.15 + i * 0.05, y, 0.04]}>
          <boxGeometry args={[1.1 - i * 0.18, 0.06, 0.01]} />
          <meshStandardMaterial color={color} transparent opacity={0.80} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function ChipObject({ color }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.45;
  });
  const pins = [-0.55, -0.2, 0.15, 0.5];
  return (
    <group ref={group}>
      <RoundedBox args={[1.1, 0.12, 1.1]} radius={0.05}>
        <meshStandardMaterial color={color} transparent opacity={0.80} />
      </RoundedBox>
      <RoundedBox args={[0.55, 0.14, 0.55]} radius={0.03} position={[0, 0.02, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.90} />
      </RoundedBox>
      {pins.map((p, i) => (
        <group key={i}>
          <mesh position={[p, 0, 0.62]}>
            <boxGeometry args={[0.06, 0.05, 0.16]} />
            <meshStandardMaterial color={color} transparent opacity={0.90} />
          </mesh>
          <mesh position={[p, 0, -0.62]}>
            <boxGeometry args={[0.06, 0.05, 0.16]} />
            <meshStandardMaterial color={color} transparent opacity={0.90} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CodeGlyphObject({ color }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={group}>
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 5]}>
        <torusGeometry args={[0.42, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={color} transparent opacity={0.90} />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 5 + Math.PI]}>
        <torusGeometry args={[0.42, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={color} transparent opacity={0.90} />
      </mesh>
    </group>
  );
}

// Hex values mirror the --deco-* custom properties in styles.css — three.js
// materials can't read CSS variables directly, so they're restated here.
const DECO_COLORS = { cyan: '#35d7e0', magenta: '#ff5bd6', green: '#3ee089', amber: '#ffbe4d' };

const DECORATIONS = [
  { Object: LaptopObject, row: 0.5, side: 'left', color: 'cyan', keepMobile: true },
  { Object: ServerObject, row: 1.5, side: 'right', color: 'green', keepMobile: true },
  { Object: SatelliteObject, row: 2.5, side: 'left', color: 'magenta', keepMobile: false },
  { Object: CloudObject, row: 3.5, side: 'right', color: 'amber', keepMobile: true },
  { Object: RobotObject, row: 4.5, side: 'left', color: 'cyan', keepMobile: false },
  { Object: TerminalObject, row: 5.5, side: 'right', color: 'magenta', keepMobile: true },
  { Object: ChipObject, row: 6.5, side: 'left', color: 'green', keepMobile: false },
  { Object: CodeGlyphObject, row: 7.5, side: 'right', color: 'amber', keepMobile: false },
];

/* ---------------------------------------------------------------- node */
// Hovering (or focusing, for keyboard users) is the only interaction now —
// it reveals a popup with the full details. Nothing happens on click.
function LevelNode({ item, index, x, y, revealed, delay, nodeRefs }) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const scrollerRef = useRef(null);
  const tier = tierFromMedal(item.medal);
  const images = item.images || [];

  const onScrollerScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setActiveImg(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      ref={(el) => (nodeRefs.current[index] = el)}
      data-idx={index}
      className={`lvl-node-wrap${revealed ? ' visible' : ''}`}
      style={{ left: `${(x / VIEW_W) * 100}%`, top: `${y}px`, transitionDelay: `${delay}ms` }}
      // Hover state lives on the whole wrapper (not just the button) so
      // moving the cursor up into the popup to scroll through photos
      // doesn't count as "leaving" and close it.
      onMouseEnter={() => setPopupOpen(true)}
      onMouseLeave={() => setPopupOpen(false)}
    >
      <button
        type="button"
        className={`lvl-node tier-${tier}`}
        onTouchStart={() => setPopupOpen((v) => !v)}
        onFocus={() => setPopupOpen(true)}
        onBlur={() => setPopupOpen(false)}
      >
        <span className="lvl-node-medal" aria-hidden="true">{item.medal}</span>
        {/* Full description stays in the DOM (screen readers + crawlers see
            it immediately) without cluttering the compact node visually. */}
        <span className="visually-hidden">{item.description}</span>
      </button>
      <span className="lvl-node-label">{item.label}</span>

      {popupOpen && (
        <div className={`lvl-node-popup tier-${tier}${images.length ? ' has-images' : ''}`} role="tooltip">
          <div className="lvl-ig-head">
            <span className={`lvl-ig-avatar tier-${tier}`} aria-hidden="true">{item.medal}</span>
            <p className="lvl-ig-title">{item.title}</p>
          </div>

          {images.length > 0 && (
            <div className="lvl-ig-media">
              <div className="lvl-ig-scroller" ref={scrollerRef} onScroll={onScrollerScroll}>
                {images.map((src) => (
                  <img key={src} src={src} alt={item.title} />
                ))}
              </div>
              {images.length > 1 && (
                <div className="lvl-ig-dots" aria-hidden="true">
                  {images.map((src, i) => (
                    <span key={src} className={i === activeImg ? 'active' : ''} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="lvl-ig-caption">
            {item.subtitle && <span className="lvl-ig-sub">{item.subtitle}</span>}
            <span className="lvl-ig-desc">{item.description}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- decoration */
function Decoration({ deco, x, y, isNarrow }) {
  const { Object: SceneObject, color } = deco;
  if (isNarrow && !deco.keepMobile) return null;
  return (
    <div
      className={`lvl-deco lvl-deco-${color}`}
      style={{ left: `${(x / VIEW_W) * 100}%`, top: `${y}px` }}
      aria-hidden="true"
    >
      <Canvas className="lvl-deco-canvas" camera={{ position: [0, 0, 3.2], fov: 40 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.85} />
        <pointLight position={[2, 2, 3]} intensity={1.3} />
        <SceneObject color={DECO_COLORS[color]} />
      </Canvas>
    </div>
  );
}

/* ------------------------------------------------------------- level map */
function LevelMap() {
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [revealed, setRevealed] = useState(() => new Array(ACHIEVEMENTS.length).fill(false));
  const nodeRefs = useRef([]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsNarrow(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { points, totalHeight } = useMemo(() => buildLayout(ACHIEVEMENTS.length, isNarrow), [isNarrow]);
  const pathD = useMemo(() => catmullRomToBezierPath(points), [points]);
  const rowHeight = isNarrow ? ROW_HEIGHT.mobile : ROW_HEIGHT.desktop;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.idx);
          if (entry.isIntersecting) {
            setRevealed((prev) => {
              if (prev[idx]) return prev;
              const next = [...prev];
              next[idx] = true;
              return next;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    nodeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow]);

  const unlockedCount = revealed.filter(Boolean).length;

  return (
    <div className="lvl-map-outer reveal">
      <div className="lvl-header">
        <div className="lvl-initials" aria-hidden="true">H<span>S</span></div>
        <div className="lvl-progress-wrap">
          <p className="lvl-progress-label">{unlockedCount} / {ACHIEVEMENTS.length} Milestones Unlocked</p>
          <div className="lvl-progress-track">
            <div className="lvl-progress-fill" style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="lvl-map" style={{ height: totalHeight }}>
        <svg
          className="lvl-path-svg"
          viewBox={`0 0 ${VIEW_W} ${totalHeight}`}
          preserveAspectRatio="none"
          style={{ height: totalHeight }}
          aria-hidden="true"
        >
          <path d={pathD} className="lvl-path-glow" />
          <path d={pathD} className="lvl-path-line" />
        </svg>

        {DECORATIONS.map((deco, i) => (
          <Decoration key={i} deco={deco} x={VIEW_W / 2 + (deco.side === 'left' ? -1 : 1) * (VIEW_W / 2 - 40)} y={deco.row * rowHeight} isNarrow={isNarrow} />
        ))}

        {ACHIEVEMENTS.map((item, i) => (
          <LevelNode
            key={item.title}
            item={item}
            index={i}
            x={points[i].x}
            y={points[i].y}
            revealed={revealed[i]}
            delay={(i % 3) * 90}
            nodeRefs={nodeRefs}
          />
        ))}
      </div>
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

        <LevelMap />

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
