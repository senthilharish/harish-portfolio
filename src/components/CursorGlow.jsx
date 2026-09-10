import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!glowRef.current) return;
      glowRef.current.style.left = e.clientX + 'px';
      glowRef.current.style.top = e.clientY + 'px';
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div className="cursor-glow" ref={glowRef} />;
}
