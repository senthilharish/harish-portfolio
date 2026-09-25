import { useRef } from 'react';
import useTypedRole from '../hooks/useTypedRole.js';

export default function Hero() {
  const typedRole = useTypedRole();
  const avatarRef = useRef(null);
  const tiltRef = useRef(null);

  const onMouseMove = (e) => {
    const rect = avatarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -24;
    const rotateY = ((x / rect.width) - 0.5) * 24;
    tiltRef.current.style.transition = 'transform 0.1s linear';
    tiltRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const onMouseLeave = () => {
    tiltRef.current.style.transition = 'transform 0.6s cubic-bezier(.4,0,.2,1)';
    tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  return (
    <section id="home" className="section hero">
      <div className="container hero-grid">
        <div className="hero-text reveal">
          <p className="eyebrow">Hello, I'm</p>
          <h1 className="hero-name">Harish S</h1>
          <h2 className="hero-role">
            <span id="typedRole">{typedRole}</span><span className="cursor-blink">|</span>
          </h2>
          <p className="hero-desc">
            Hi, I'm Harish S, a freelance software developer and Computer Science Engineering student with a passion for building modern, scalable, and user-focused digital solutions.<br />
            I specialize in developing Flutter mobile applications, responsive web applications, and custom business management systems..
          </p>
          <div className="hero-buttons d-flex flex-wrap gap-3">
            <a href="#contact" className="btn btn-primary">Get In Touch</a>
            <a href="/assets/Harish-S-Resume.pdf" className="btn btn-ghost" download>Download Resume</a>
          </div>
          <div className="hero-socials d-flex gap-3">
            <a href="mailto:sindhuharish2802@gmail.com" className="social-btn" aria-label="Email" title="Email">
              <svg viewBox="0 0 24 24"><path d="M2 4h20v16H2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M2 5l10 8 10-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a href="tel:+916382322728" className="social-btn" aria-label="Phone" title="Call">
              <svg viewBox="0 0 24 24"><path d="M4 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
            </a>
            <a href="https://github.com/" target="_blank" rel="noopener" className="social-btn" aria-label="GitHub" title="GitHub">
              <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.4 9.4 0 0 1 5 0c1.9-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" fill="currentColor" /></svg>
            </a>
          </div>
        </div>
        <div className="hero-avatar reveal" id="heroAvatar" ref={avatarRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
          <div className="avatar-orbit"></div>
          <div className="avatar-ring">
            <div className="avatar-tilt" id="avatarTilt" ref={tiltRef}>
              <div className="avatar-frame" id="avatarFrame">
                <img src="/assets/profile.png" alt="Harish S" />
                <div className="avatar-shine"></div>
              </div>
            </div>
          </div>
          <div className="floating-chip chip1">Flutter</div>
          <div className="floating-chip chip2">Firebase</div>
          <div className="floating-chip chip3">AI / ML</div>
        </div>
      </div>
      <a href="#about" className="scroll-indicator" aria-label="Scroll down">
        <span></span>
      </a>
    </section>
  );
}
