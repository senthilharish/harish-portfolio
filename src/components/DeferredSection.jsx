import { Component, Suspense, lazy, useMemo, useState } from 'react';
import useDeferredMount from '../hooks/useDeferredMount.js';

// Catches a failed chunk download or a crashed 3D scene so it only takes
// down this section — without a boundary React unmounts the whole page.
class SectionErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Deferred section failed to load:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="deferred-status" style={{ minHeight: this.props.minHeight }}>
        <p>This section couldn’t load. Check your connection and try again.</p>
        <button type="button" className="btn btn-ghost" onClick={this.props.onRetry}>
          Retry
        </button>
      </div>
    );
  }
}

function Loading({ minHeight, label }) {
  return (
    <div className="deferred-status" style={{ minHeight }} role="status">
      {label && (
        <>
          <span className="deferred-spinner" aria-hidden="true" />
          <p>{label}</p>
        </>
      )}
    </div>
  );
}

// Mounts a code-split component (`load` returns its dynamic import) only once
// it's near the viewport. The placeholder reserves layout space so the page
// doesn't jump. `onRetry` lets the caller clear any cached failed assets
// before the component is re-imported.
export default function DeferredSection({
  load,
  minHeight = '100vh',
  rootMargin,
  loadingLabel,
  onRetry,
}) {
  const [ref, shouldMount] = useDeferredMount(rootMargin);
  const [attempt, setAttempt] = useState(0);

  // React.lazy caches a rejected import forever, so each retry needs a fresh one.
  const LazyComponent = useMemo(() => lazy(load), [load, attempt]);

  const retry = async () => {
    try {
      await onRetry?.();
    } catch {
      // Best effort: the re-import below will surface a real failure again.
    }
    setAttempt((n) => n + 1);
  };

  const fallback = <Loading minHeight={minHeight} label={loadingLabel} />;

  return (
    <div ref={ref}>
      {shouldMount ? (
        <SectionErrorBoundary key={attempt} minHeight={minHeight} onRetry={retry}>
          <Suspense fallback={fallback}>
            <LazyComponent />
          </Suspense>
        </SectionErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
