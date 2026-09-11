import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const NAME_LETTERS = ['H', 'A', 'R', 'I', 'S', 'H', ' ', 'S'];

export default function IntroLoader() {
  const rootRef = useRef(null);
  const vBars = useRef([]);
  const hBars = useRef([]);
  const wordRef = useRef(null);
  const bgRef = useRef(null);

  useLayoutEffect(() => {
    if (sessionStorage.getItem('portfolio_intro_played') === 'true') {
      if (rootRef.current) rootRef.current.style.display = 'none';
      return;
    }

    document.body.style.overflow = 'hidden';

    const ctx = gsap.context(() => {
      const letters = wordRef.current.querySelectorAll('.intro-letter');
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('portfolio_intro_played', 'true');
          document.body.style.overflow = '';
        },
      });

      gsap.set(vBars.current, { scaleY: 0 });
      gsap.set(hBars.current, { scaleX: 0 });
      gsap.set(wordRef.current, { opacity: 0, scale: 0.85, xPercent: -50, yPercent: -50 });
      gsap.set(letters, {
        fillOpacity: 0,
        stroke: 'var(--accent)',
        strokeWidth: 1.5,
        strokeDasharray: 160,
        strokeDashoffset: 160,
      });

      tl.to(vBars.current, { scaleY: 1, duration: 0.6, stagger: 0.08, ease: 'power4.inOut' }, 'start')
        .to(hBars.current, { scaleX: 1, duration: 0.6, stagger: 0.08, ease: 'power4.inOut' }, 'start')
        .set(bgRef.current, { autoAlpha: 0 })
        .to(wordRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2')
        .to(
          letters,
          { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut', stagger: { each: 0.08, from: 'random' } },
          '+=0.05'
        )
        .to(letters, { fillOpacity: 1, stroke: 'transparent', duration: 0.5, ease: 'power2.out' }, '-=0.4')
        .to({}, { duration: 0.5 })
        .to(wordRef.current, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 'retract')
        .to(vBars.current, { scaleY: 0, duration: 0.6, stagger: { each: 0.04, from: 'end' }, ease: 'power3.inOut' }, 'retract')
        .to(hBars.current, { scaleX: 0, duration: 0.6, stagger: { each: 0.04, from: 'end' }, ease: 'power3.inOut' }, 'retract')
        .fromTo('.logo', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 'retract+=0.2');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="intro-loader" aria-hidden="true">
      <div ref={bgRef} className="intro-loader__bg" />
      <div className="intro-loader__bars intro-loader__bars--v">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => (vBars.current[i] = el)}
            className="intro-loader__bar"
            style={{ transformOrigin: i % 2 === 0 ? 'top' : 'bottom' }}
          />
        ))}
      </div>
      <div className="intro-loader__bars intro-loader__bars--h">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            ref={(el) => (hBars.current[i] = el)}
            className="intro-loader__bar"
            style={{ transformOrigin: i % 2 === 0 ? 'left' : 'right' }}
          />
        ))}
      </div>
      <svg
        ref={wordRef}
        className="intro-loader__word"
        viewBox="0 0 620 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text x="50%" y="72" textAnchor="middle" className="intro-loader__text">
          {NAME_LETTERS.map((ch, i) => (
            <tspan key={i} className="intro-letter">
              {ch === ' ' ? '  ' : ch}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  );
}
