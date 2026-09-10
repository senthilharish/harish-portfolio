import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Scene from './Scene.jsx';
import Hud from './Hud.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function AzeemJourney() {
  const scrollRef = useRef(null);
  const progressRef = useRef(0);
  const hudUpdateRef = useRef(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: scrollRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        hudUpdateRef.current?.(self.progress);
      },
    });

    // Web fonts and images finishing after mount reflow the page above this
    // section, which shifts .azeem-scroll's absolute position — refresh so
    // ScrollTrigger's cached start/end (and therefore the story's progress)
    // stays aligned with the real scroll position instead of drifting.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready?.then(refresh);
    window.addEventListener('load', refresh);
    const settleTimer = setTimeout(refresh, 1200);

    return () => {
      st.kill();
      window.removeEventListener('load', refresh);
      clearTimeout(settleTimer);
    };
  }, []);

  const registerUpdate = (fn) => { hudUpdateRef.current = fn; };
  const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 720;

  return (
    <section id="build" className="section azeem-section">
      <div className="container">
        <p className="section-tag reveal">Case Study</p>
        <h2 className="section-title reveal">Azeem Agency ERP</h2>
        <p className="build-hint reveal">
          Scroll to travel through the real project — from a client's phone call to a
          deployed Flutter ERP, one continuous cinematic journey.
        </p>
      </div>

      <div className="azeem-scroll" ref={scrollRef}>
        <div className="azeem-sticky">
          <Canvas
            camera={{ fov: 42, near: 0.1, far: 120, position: [0, 1.6, 4] }}
            dpr={isNarrow ? 1 : [1, 1.8]}
            gl={{ antialias: !isNarrow, powerPreference: 'high-performance' }}
          >
            <Suspense fallback={null}>
              <Scene progressRef={progressRef} />
            </Suspense>
          </Canvas>
          <Hud registerUpdate={registerUpdate} />
        </div>
      </div>
    </section>
  );
}
