import { useEffect } from 'react';

// Observes every .reveal element in the document and adds .visible once
// it scrolls into view. Runs once after the full tree has mounted.
export default function useReveal(deps = []) {
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
