import { useEffect } from 'react';

// Observes every .reveal element and adds .visible once it scrolls into
// view. Also watches for .reveal elements added after the initial mount
// (e.g. sections that lazy-mount later, like AzeemJourney/Achievements) so
// they still get observed instead of staying stuck at opacity: 0 forever.
export default function useReveal(deps = []) {
  useEffect(() => {
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

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches('.reveal')) observer.observe(node);
          node.querySelectorAll?.('.reveal').forEach((el) => observer.observe(el));
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
