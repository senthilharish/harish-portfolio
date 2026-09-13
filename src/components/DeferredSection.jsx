import { Suspense } from 'react';
import useDeferredMount from '../hooks/useDeferredMount.js';

// Placeholder reserves layout space (so the page doesn't jump) until the
// real, code-split component mounts near-viewport.
export default function DeferredSection({ children, minHeight = '100vh' }) {
  const [ref, shouldMount] = useDeferredMount();

  return (
    <div ref={ref}>
      {shouldMount ? (
        <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>
      ) : (
        <div style={{ minHeight }} />
      )}
    </div>
  );
}
