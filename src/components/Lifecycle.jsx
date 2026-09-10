import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    label: 'Requirement Analysis',
    desc: 'Client meetings, brainstorming, and market research.',
    icon: (
      <>
        <rect x="14" y="6" width="36" height="52" rx="6" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <rect x="24" y="2" width="16" height="8" rx="3" fill="url(#lcGradPrimary)" />
        <rect x="20" y="20" width="24" height="3" rx="1.5" fill="url(#lcGradPrimary)" />
        <rect x="20" y="28" width="24" height="3" rx="1.5" fill="url(#lcGradPrimary)" opacity="0.7" />
        <rect x="20" y="36" width="16" height="3" rx="1.5" fill="url(#lcGradPrimary)" opacity="0.5" />
        <circle cx="44" cy="46" r="8" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="2.5" />
        <line x1="50" y1="52" x2="56" y2="58" stroke="url(#lcGradPrimary)" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: 'UI/UX Design',
    desc: 'Wireframes and design systems in Figma.',
    icon: (
      <>
        <rect x="8" y="10" width="26" height="46" rx="5" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" transform="rotate(-8 21 33)" />
        <rect x="26" y="6" width="30" height="50" rx="6" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <rect x="32" y="16" width="18" height="3" rx="1.5" fill="url(#lcGradPrimary)" />
        <rect x="32" y="24" width="12" height="3" rx="1.5" fill="url(#lcGradPrimary)" opacity="0.7" />
        <rect x="32" y="34" width="18" height="12" rx="3" fill="url(#lcGradPrimary)" opacity="0.5" />
        <circle cx="36" cy="52" r="3" fill="url(#lcGradPrimary)" />
        <circle cx="44" cy="52" r="3" fill="url(#lcGradPrimary)" opacity="0.7" />
        <circle cx="52" cy="52" r="3" fill="url(#lcGradPrimary)" opacity="0.4" />
      </>
    ),
  },
  {
    label: 'System Architecture',
    desc: 'MVC.',
    icon: (
      <>
        <path d="M32 6c8 0 14 5 14 11s-6 8-6 8h-16s-6-2-6-8 8-11 14-11z" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <ellipse cx="16" cy="48" rx="10" ry="4" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <rect x="6" y="40" width="20" height="8" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <ellipse cx="16" cy="40" rx="10" ry="4" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <polygon points="48,36 56,40 56,48 48,52 40,48 40,40" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <line x1="32" y1="25" x2="18" y2="38" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <line x1="34" y1="25" x2="48" y2="38" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
      </>
    ),
  },
  {
    label: 'Development',
    desc: 'Flutter, VS Code, Firebase.',
    icon: (
      <>
        <rect x="6" y="10" width="52" height="40" rx="5" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <circle cx="13" cy="16" r="1.6" fill="url(#lcGradPrimary)" />
        <circle cx="18" cy="16" r="1.6" fill="url(#lcGradPrimary)" opacity="0.6" />
        <circle cx="23" cy="16" r="1.6" fill="url(#lcGradPrimary)" opacity="0.3" />
        <path d="M18 28l-8 6 8 6" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M46 28l8 6-8 6" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="36" y1="24" x2="28" y2="42" stroke="url(#lcGradPrimary)" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: 'Database & Backend',
    desc: 'Firebase',
    icon: (
      <>
        <ellipse cx="32" cy="14" rx="18" ry="6" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <path d="M14 14v12c0 3.3 8 6 18 6s18-2.7 18-6V14" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <path d="M14 26v12c0 3.3 8 6 18 6s18-2.7 18-6V26" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <path d="M14 38v10c0 3.3 8 6 18 6s18-2.7 18-6V38" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <path d="M46 20a9 9 0 1 1 -3-7" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="2" strokeLinecap="round" />
        <polygon points="42,10 46,13 42,16" fill="url(#lcGradPrimary)" />
      </>
    ),
  },
  {
    label: 'Testing',
    desc: 'Manual Testing, Performance Testing.',
    icon: (
      <>
        <rect x="14" y="8" width="30" height="48" rx="6" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <ellipse cx="40" cy="34" rx="10" ry="7" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <line x1="40" y1="23" x2="40" y2="27" stroke="url(#lcGradPrimary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="33" y1="27" x2="36" y2="29" stroke="url(#lcGradPrimary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="47" y1="27" x2="44" y2="29" stroke="url(#lcGradPrimary)" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 46l6 6" stroke="url(#lcGradPrimary)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 44l4 4 6-8" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    label: 'Deployment',
    desc: 'App, Web App, Windows Exe.',
    icon: (
      <>
        <path d="M32 4l6 12h-12z" fill="url(#lcGradPrimary)" />
        <rect x="24" y="16" width="16" height="24" rx="8" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <path d="M20 34l-6 10 8-2z" fill="url(#lcGradPrimary)" opacity="0.8" />
        <path d="M44 34l6 10-8-2z" fill="url(#lcGradPrimary)" opacity="0.8" />
        <path d="M27 44c0 8 2 12 5 16 3-4 5-8 5-16" fill="url(#lcGradPrimary)" opacity="0.55" />
        <ellipse cx="32" cy="52" rx="16" ry="4" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
      </>
    ),
  },
  {
    label: 'Maintenance',
    desc: 'Monitoring, updates, and ongoing support.',
    icon: (
      <>
        <path d="M32 4l20 8v14c0 14-8 24-20 34-12-10-20-20-20-34V12z" fill="url(#lcGradSoft)" stroke="url(#lcGradPrimary)" strokeWidth="1.5" />
        <circle cx="32" cy="28" r="9" fill="none" stroke="url(#lcGradPrimary)" strokeWidth="2" />
        <circle cx="32" cy="28" r="3" fill="url(#lcGradPrimary)" />
        <path d="M32 15v4M32 37v4M19 28h4M41 28h4" stroke="url(#lcGradPrimary)" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
];

function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export default function Lifecycle() {
  const scrollWrapRef = useRef(null);
  const stageRef = useRef(null);
  const phoneRef = useRef(null);
  const stageLabelRef = useRef(null);
  const particlesRef = useRef(null);
  const cardRefs = useRef([]);
  const lastStageIdx = useRef(-1);

  const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 720;

  const particles = useMemo(() => {
    const count = isNarrow ? 14 : 26;
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      animationDelay: (Math.random() * 6).toFixed(2) + 's',
      animationDuration: (5 + Math.random() * 5).toFixed(2) + 's',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layout = useMemo(() => {
    const RADIUS_X_PCT = isNarrow ? 40 : 34;
    const RADIUS_Y_PCT = isNarrow ? 34 : 28;
    const N = STAGES.length;
    return STAGES.map((_, i) => {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const ox = Math.cos(angle) * RADIUS_X_PCT;
      const oy = Math.sin(angle) * RADIUS_Y_PCT;
      const z = (i % 2 === 0 ? 1 : -1) * (60 + ((i * 8) % 40));
      const rotY = Math.cos(angle) * 18;
      const rotX = Math.sin(angle) * -12;
      const rotZ = (i % 2 === 0 ? 1 : -1) * 4;
      return { ox, oy, z, rotX, rotY, rotZ };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const N = STAGES.length;

    function render(progress) {
      let explode;
      if (progress < 0.3) {
        explode = smoothstep(progress / 0.3);
      } else if (progress < 0.72) {
        explode = 1;
      } else {
        explode = 1 - smoothstep((progress - 0.72) / 0.28);
      }

      const stageRect = stageRef.current.getBoundingClientRect();

      layout.forEach((l, i) => {
        const card = cardRefs.current[i];
        if (!card) return;
        const px = (l.ox / 100) * stageRect.width * explode;
        const py = (l.oy / 100) * stageRect.height * explode;
        const pz = l.z * explode;
        const rx = l.rotX * explode;
        const ry = l.rotY * explode;
        const rz = l.rotZ * explode;
        const scale = 0.55 + 0.45 * explode;

        card.style.transform =
          `translate3d(-50%, -50%, 0) translate3d(${px}px, ${py}px, ${pz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
        card.style.opacity = String(Math.max(0, Math.min(1, explode * 1.3 - 0.15)));
        card.style.pointerEvents = explode > 0.15 ? 'auto' : 'none';
        card.style.zIndex = String(10 + Math.round(pz));
      });

      const phoneScale = 1 - 0.08 * explode;
      phoneRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${phoneScale})`;
      phoneRef.current.style.opacity = String(1 - 0.25 * explode);

      let idx = 0;
      if (progress < 0.3) {
        idx = 0;
      } else if (progress >= 0.72) {
        idx = N - 1;
      } else {
        const holdT = (progress - 0.3) / (0.72 - 0.3);
        idx = Math.min(N - 1, Math.floor(holdT * N));
      }
      if (idx !== lastStageIdx.current) {
        lastStageIdx.current = idx;
        const label = stageLabelRef.current;
        label.textContent = STAGES[idx].label;
        label.classList.remove('pulse');
        void label.offsetWidth;
        label.classList.add('pulse');
      }
    }

    const st = ScrollTrigger.create({
      trigger: scrollWrapRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => render(self.progress),
    });

    render(0);

    return () => st.kill();
  }, [layout]);

  return (
    <section id="lifecycle" className="section lifecycle-section">
      <svg className="visually-hidden" aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <linearGradient id="lcGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5b1f" />
            <stop offset="100%" stopColor="#2f5fff" />
          </linearGradient>
          <linearGradient id="lcGradSoft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5b1f" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2f5fff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      <div className="container">
        <p className="section-tag reveal">How I Build</p>
        <h2 className="section-title reveal">Software Development Lifecycle</h2>
        <p className="lifecycle-hint reveal">Scroll to watch the app come apart — stage by stage — then snap back together.</p>
      </div>

      <div className="lifecycle-scroll" ref={scrollWrapRef}>
        <div className="lifecycle-sticky">
          <p className="lifecycle-stage-label" ref={stageLabelRef}>{STAGES[0].label}</p>

          <div className="lifecycle-stage" ref={stageRef}>
            <div className="lifecycle-particles" ref={particlesRef}>
              {particles.map((p, i) => (
                <span
                  className="lc-particle"
                  key={i}
                  style={{
                    left: p.left,
                    top: p.top,
                    animationDelay: p.animationDelay,
                    animationDuration: p.animationDuration,
                  }}
                />
              ))}
            </div>

            <div className="lifecycle-phone" ref={phoneRef}>
              <div className="lifecycle-phone-notch"></div>
              <div className="lifecycle-phone-screen">
                <div className="lifecycle-phone-bar"></div>
                <div className="lifecycle-phone-card"></div>
                <div className="lifecycle-phone-card short"></div>
                <div className="lifecycle-phone-dot"></div>
              </div>
            </div>

            {STAGES.map((stage, i) => (
              <div
                className="lifecycle-card"
                data-index={i}
                key={stage.label}
                ref={(el) => (cardRefs.current[i] = el)}
              >
                <div className="lifecycle-card-inner">
                  <svg className="lc-icon" viewBox="0 0 64 64">
                    {stage.icon}
                  </svg>
                  <h3>{stage.label}</h3>
                  <p>{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
