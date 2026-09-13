import { useEffect, useRef, useState } from 'react';

// Delays mounting an expensive subtree until it's about to scroll into view.
// Used to keep heavy three.js sections (and their GLB downloads) out of the
// initial page load — they only start fetching/rendering once the user is
// close enough that they'll reach them in a moment.
export default function useDeferredMount(rootMargin = '1000px') {
  const ref = useRef(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (shouldMount || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldMount, rootMargin]);

  return [ref, shouldMount];
}
