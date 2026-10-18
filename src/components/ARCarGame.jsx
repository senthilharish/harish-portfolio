import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  ACHIEVEMENTS, tierFromMedal, TIER_COLOR, buildWaypoints, Road, RoadEdgeRidges, STAR_GEOMETRY,
  CompletedMarker, CAR_MODEL_PATH, CAR_SCALE, WHEEL_NODE_NAMES, DriveController,
} from './Achievements.jsx';

// The journey is ~40 units long; at 1:10 it becomes a ~4 m toy road on the
// floor that the player walks beside while driving.
const WORLD_SCALE = 0.1;
// Details card size/height in journey units (×0.1 = metres in the room).
const CARD_WIDTH = 4.2;
const CARD_HEIGHT_ABOVE = 2.4;

/* ------------------------------------------------------------- card texture */
// The achievement details are drawn onto a canvas so they live in the 3D
// scene, floating above the star the car just hit.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function createCardTexture(item, index) {
  const W = 1024;
  const PAD = 56;
  const inner = W - PAD * 2;
  const tierColor = TIER_COLOR[tierFromMedal(item.medal)];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Lay out once to measure, then size the canvas and draw for real.
  const layout = (draw) => {
    let y = PAD;
    ctx.textBaseline = 'top';

    ctx.font = '700 26px "Space Mono", monospace';
    if (draw) { ctx.fillStyle = '#ff5b1f'; ctx.fillText(`MILESTONE ${index + 1} / ${ACHIEVEMENTS.length} · ${(item.type || '').toUpperCase()}`, PAD, y); }
    y += 50;

    ctx.font = '96px serif';
    if (draw) ctx.fillText(item.medal, PAD, y - 6);
    ctx.font = '64px Anton, Impact, sans-serif';
    const titleLines = wrapLines(ctx, item.title, inner - 130);
    titleLines.forEach((l, i) => { if (draw) { ctx.fillStyle = '#ffffff'; ctx.fillText(l, PAD + 130, y + i * 74); } });
    y += Math.max(110, titleLines.length * 74 + 8);

    if (item.subtitle) {
      ctx.font = '600 34px Inter, sans-serif';
      wrapLines(ctx, item.subtitle, inner).forEach((l) => { if (draw) { ctx.fillStyle = '#6f8dff'; ctx.fillText(l, PAD, y); } y += 44; });
    }
    if (item.date) {
      ctx.font = '26px "Space Mono", monospace';
      if (draw) { ctx.fillStyle = '#8a8a90'; ctx.fillText(item.date, PAD, y + 4); }
      y += 52;
    }

    ctx.font = '32px Inter, sans-serif';
    wrapLines(ctx, item.description, inner).forEach((l) => { if (draw) { ctx.fillStyle = '#c9c9ce'; ctx.fillText(l, PAD, y); } y += 44; });
    y += 18;

    if (item.achieved?.length) {
      ctx.font = '700 24px "Space Mono", monospace';
      if (draw) { ctx.fillStyle = '#8a8a90'; ctx.fillText('WHAT I ACHIEVED', PAD, y); }
      y += 42;
      ctx.font = '30px Inter, sans-serif';
      item.achieved.forEach((point) => {
        wrapLines(ctx, point, inner - 40).forEach((l, i) => {
          if (draw) {
            ctx.fillStyle = '#ff5b1f';
            if (i === 0) ctx.fillText('▹', PAD, y);
            ctx.fillStyle = '#e4e4e8';
            ctx.fillText(l, PAD + 40, y);
          }
          y += 40;
        });
        y += 6;
      });
      y += 12;
    }

    if (item.role) {
      ctx.font = '700 24px "Space Mono", monospace';
      if (draw) { ctx.fillStyle = '#8a8a90'; ctx.fillText('ROLE', PAD, y); }
      y += 40;
      ctx.font = '30px Inter, sans-serif';
      wrapLines(ctx, item.role, inner).forEach((l) => { if (draw) { ctx.fillStyle = '#e4e4e8'; ctx.fillText(l, PAD, y); } y += 40; });
    }
    return y + PAD;
  };

  canvas.width = W;
  canvas.height = Math.ceil(layout(false));
  ctx.clearRect(0, 0, W, canvas.height);
  roundRect(ctx, 6, 6, W - 12, canvas.height - 12, 44);
  ctx.fillStyle = 'rgba(12, 12, 14, 0.92)';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = tierColor;
  ctx.stroke();
  layout(true);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: canvas.height / W };
}

/* -------------------------------------------------------------- scene parts */
function DetailsCard({ index, position }) {
  const group = useRef();
  const born = useRef(null);
  const { gl } = useThree();
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const { texture, aspect } = useMemo(() => createCardTexture(ACHIEVEMENTS[index], index), [index]);
  useEffect(() => () => texture.dispose(), [texture]);

  const height = CARD_WIDTH * aspect;

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    if (born.current === null) born.current = state.clock.elapsedTime;
    const t = Math.min(1, (state.clock.elapsedTime - born.current) / 0.35);
    const s = 1 - (1 - t) ** 3;
    g.scale.setScalar(Math.max(0.001, s));
    // Always face the player so the card is readable from wherever they walk.
    gl.xr.getCamera().getWorldPosition(camPos);
    g.lookAt(camPos);
  });

  return (
    <group ref={group} position={[position.x, CARD_HEIGHT_ABOVE + height / 2, position.z]}>
      <mesh>
        <planeGeometry args={[CARD_WIDTH, height]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ARStar({ position, tier, collected }) {
  const spin = useRef();
  const burst = useRef();
  const collectedAt = useRef(null);
  const color = TIER_COLOR[tier];

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (spin.current) {
      spin.current.rotation.y = t * 1.4;
      spin.current.position.y = 0.75 + Math.sin(t * 2 + position.z) * 0.08;
    }
    if (collected && burst.current) {
      if (collectedAt.current === null) collectedAt.current = t;
      const p = Math.min(1, (t - collectedAt.current) / 0.5);
      burst.current.visible = p < 1;
      burst.current.scale.setScalar(0.3 + p * 2.4);
      burst.current.material.opacity = 0.85 * (1 - p);
    }
  });

  if (collected) {
    return (
      <group position={[position.x, 0, position.z]}>
        <mesh ref={burst} position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <CompletedMarker tier={tier} position={[0, 0, 0]} />
      </group>
    );
  }

  return (
    <group position={[position.x, 0, position.z]}>
      <group ref={spin}>
        {/* STAR_GEOMETRY is extruded along +z from 0; centre it on its pivot. */}
        <mesh geometry={STAR_GEOMETRY} position={[0, 0, -0.045]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ARCar({ carRef, wheelRefs, steerRef }) {
  const { scene } = useGLTF(CAR_MODEL_PATH);
  // The page's journey canvas owns the cached scene; clone so both can exist.
  const model = useMemo(() => cloneSkinned(scene), [scene]);

  useEffect(() => {
    Object.entries(WHEEL_NODE_NAMES).forEach(([key, name]) => {
      const node = model.getObjectByName(name);
      wheelRefs.current[key] = node;
      if (key === 'fl' || key === 'fr') steerRef.current[key] = node;
    });
  }, [model, wheelRefs, steerRef]);

  return (
    <group ref={carRef}>
      <primitive object={model} scale={CAR_SCALE} />
    </group>
  );
}

// Hit-test reticle while placing, then the whole journey anchored to the floor.
function ARWorld({ session, placement, onReticle, onNoFloor, onPlaced, visitedRef, collected, cardIndex, touchKeysRef, onArrive }) {
  const { gl } = useThree();
  const reticle = useRef();
  const world = useRef();
  const hitSource = useRef(null);
  const reticleVisible = useRef(false);
  const noHitTest = useRef(false);
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);

  const carRef = useRef();
  const wheelRefs = useRef({});
  const steerRef = useRef({});
  const cameraTargetRef = useRef({ position: new THREE.Vector3(), heading: 0, speed: 0 });
  const autopilotRef = useRef(null);
  const hudRef = useRef(null);

  const waypoints = useMemo(() => buildWaypoints(ACHIEVEMENTS.length), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.4), [waypoints]);
  const totalLength = useMemo(() => curve.getLength(), [curve]);
  const nodeDistances = useMemo(() => {
    const lengths = curve.getLengths(waypoints.length - 1);
    return waypoints.slice(1).map((_, i) => lengths[i + 1]);
  }, [curve, waypoints]);

  useEffect(() => {
    let cancelled = false;
    const noFloor = () => {
      if (cancelled) return;
      noHitTest.current = true;
      onNoFloor();
    };
    if (!session.requestHitTestSource) {
      noFloor();
      return undefined;
    }
    session.requestReferenceSpace('viewer')
      .then((space) => session.requestHitTestSource({ space }))
      .then((source) => {
        if (cancelled) source.cancel();
        else hitSource.current = source;
      })
      .catch(noFloor);
    return () => {
      cancelled = true;
      hitSource.current?.cancel();
      hitSource.current = null;
    };
  }, [session]);

  useFrame((state, delta, frame) => {
    if (!frame) return;
    const refSpace = gl.xr.getReferenceSpace();

    if (!placement.current.placed && hitSource.current && reticle.current) {
      const hits = frame.getHitTestResults(hitSource.current);
      const pose = hits.length ? hits[0].getPose(refSpace) : null;
      const visible = Boolean(pose);
      if (pose) {
        reticle.current.matrix.fromArray(pose.transform.matrix);
      }
      reticle.current.visible = visible;
      if (visible !== reticleVisible.current) {
        reticleVisible.current = visible;
        onReticle(visible);
      }
    }

    // Placement: anchor the start of the road on the reticle, with the road
    // running straight away from where the player is standing.
    if (placement.current.request && (reticleVisible.current || noHitTest.current) && world.current) {
      placement.current.request = false;
      gl.xr.getCamera().getWorldPosition(camPos);
      if (noHitTest.current) {
        // No floor detection: guess the floor ~1.3 m below the phone, 1 m ahead.
        const cam = gl.xr.getCamera();
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
        fwd.y = 0;
        if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
        fwd.normalize();
        tmpPos.copy(camPos).addScaledVector(fwd, 1);
        tmpPos.y = camPos.y - 1.3;
      } else {
        tmpPos.setFromMatrixPosition(reticle.current.matrix);
      }
      world.current.position.copy(tmpPos);
      world.current.rotation.set(0, Math.atan2(tmpPos.x - camPos.x, tmpPos.z - camPos.z), 0);
      world.current.visible = true;
      reticle.current.visible = false;
      placement.current.placed = true;
      onPlaced();
    }
  });

  // "Move road" from the HUD: go back to aiming the reticle.
  useEffect(() => {
    placement.current.reset = () => {
      placement.current.placed = false;
      placement.current.request = false;
      reticleVisible.current = false;
      if (world.current) world.current.visible = false;
    };
  }, [placement]);

  return (
    <>
      <hemisphereLight args={['#ffffff', '#444455', 1.4]} />
      <directionalLight position={[1, 3, 2]} intensity={2.2} />

      <mesh ref={reticle} matrixAutoUpdate={false} visible={false}>
        <ringGeometry args={[0.08, 0.1, 40]} />
        <meshBasicMaterial color="#ff5b1f" side={THREE.DoubleSide} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.012, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </mesh>

      <group ref={world} visible={false} scale={WORLD_SCALE}>
        <Road curve={curve} length={totalLength} />
        <RoadEdgeRidges curve={curve} length={totalLength} />
        {waypoints.slice(1).map((p, i) => (
          <ARStar key={i} position={p} tier={tierFromMedal(ACHIEVEMENTS[i].medal)} collected={collected[i]} />
        ))}
        {cardIndex !== null && <DetailsCard key={cardIndex} index={cardIndex} position={waypoints[cardIndex + 1]} />}
        <Suspense fallback={null}>
          <ARCar carRef={carRef} wheelRefs={wheelRefs} steerRef={steerRef} />
        </Suspense>
        <DriveController
          curve={curve}
          totalLength={totalLength}
          nodeDistances={nodeDistances}
          carRef={carRef}
          wheelRefs={wheelRefs}
          steerRef={steerRef}
          cameraTargetRef={cameraTargetRef}
          onArrive={onArrive}
          activeIndex={null}
          visitedRef={visitedRef}
          hudRef={hudRef}
          autopilotRef={autopilotRef}
          touchKeysRef={touchKeysRef}
          cinematicRef={null}
        />
      </group>
    </>
  );
}

function describeStartError(err) {
  const detail = err ? ` (${err.name}${err.message ? `: ${err.message}` : ''})` : '';
  if (err?.name === 'NotAllowedError') {
    return `Camera access was blocked. Tap the lock icon next to the address bar, allow Camera, and try again.${detail}`;
  }
  if (err?.name === 'SecurityError') {
    return `AR has to start straight from a tap. Please tap Start AR again.${detail}`;
  }
  if (err?.name === 'NotSupportedError') {
    return `This phone can't start AR. It needs "Google Play Services for AR" (ARCore): install or update it from the Play Store, then try again. Some phones don't support ARCore at all.${detail}`;
  }
  return `Could not start AR.${detail}`;
}

// Hands the session to three.js once the Canvas exists.
function SessionBinder({ session }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.xr.setReferenceSpaceType('local');
    gl.xr.setSession(session).catch(() => session.end());
  }, [gl, session]);
  return null;
}

/* ------------------------------------------------------------------- game */
export default function ARCarGame({ onClose }) {
  const overlayRef = useRef(null);
  const [supported, setSupported] = useState(null);
  const [session, setSession] = useState(null);
  const [startError, setStartError] = useState('');
  const [hasOverlay, setHasOverlay] = useState(true);
  const [reticleVisible, setReticleVisible] = useState(false);
  const [noFloor, setNoFloor] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [collected, setCollected] = useState(() => ACHIEVEMENTS.map(() => false));
  const [cardIndex, setCardIndex] = useState(null);
  const [qr, setQr] = useState('');
  const visitedRef = useRef(ACHIEVEMENTS.map(() => false));
  const touchKeysRef = useRef({ forward: false, backward: false });
  // Shared with ARWorld's frame loop: request = place on next frame.
  const placement = useRef({ request: false, placed: false, reset: null });

  useEffect(() => {
    let alive = true;
    const xr = navigator.xr;
    (xr ? xr.isSessionSupported('immersive-ar') : Promise.resolve(false))
      .catch(() => false)
      .then((ok) => alive && setSupported(ok));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (supported !== false) return;
    let alive = true;
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = 'achievements';
    import('qrcode')
      .then((QR) => QR.toDataURL(url.toString(), { margin: 1, width: 360 }))
      .then((data) => alive && setQr(data))
      .catch(() => {});
    return () => { alive = false; };
  }, [supported]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (session) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [session, onClose]);

  // End the session if the component goes away mid-game.
  useEffect(() => () => { session?.end().catch(() => {}); }, [session]);

  const resetRound = () => {
    visitedRef.current = ACHIEVEMENTS.map(() => false);
    setCollected(ACHIEVEMENTS.map(() => false));
    setCardIndex(null);
    setPlaced(false);
    setReticleVisible(false);
    setNoFloor(false);
    placement.current = { request: false, placed: false, reset: null };
  };

  // requestSession must run inside the tap's user gesture. Some phones reject
  // a session that *requires* hit-test, so fall back to asking for it
  // optionally (ARWorld then places the road in front of the player).
  const startAR = async () => {
    setStartError('');
    const domOverlay = { root: overlayRef.current };
    const attempts = [
      { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay },
      { optionalFeatures: ['hit-test', 'dom-overlay'], domOverlay },
    ];
    let lastError = null;
    for (const init of attempts) {
      try {
        const s = await navigator.xr.requestSession('immersive-ar', init);
        resetRound();
        setHasOverlay(Boolean(s.domOverlayState));
        s.addEventListener('end', () => {
          touchKeysRef.current = { forward: false, backward: false };
          setSession(null);
        });
        setSession(s);
        return;
      } catch (err) {
        lastError = err;
        // Denied permission or lost user gesture: retrying won't help.
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') break;
      }
    }
    setStartError(describeStartError(lastError));
  };

  // Without DOM overlay (rare) the HUD is invisible: tap to place, hold to drive.
  useEffect(() => {
    if (!session) return undefined;
    const onStart = () => {
      if (!placement.current.placed) placement.current.request = true;
      else if (!hasOverlay) touchKeysRef.current.forward = true;
    };
    const onEnd = () => { if (!hasOverlay) touchKeysRef.current.forward = false; };
    session.addEventListener('selectstart', onStart);
    session.addEventListener('selectend', onEnd);
    return () => {
      session.removeEventListener('selectstart', onStart);
      session.removeEventListener('selectend', onEnd);
    };
  }, [session, hasOverlay]);

  // Taps on HUD buttons shouldn't also count as taps on the AR scene.
  useEffect(() => {
    const root = overlayRef.current;
    const stop = (e) => { if (e.target.closest('button')) e.preventDefault(); };
    root.addEventListener('beforexrselect', stop);
    return () => root.removeEventListener('beforexrselect', stop);
  }, []);

  const handlePlaced = useCallback(() => setPlaced(true), []);

  const handleArrive = useCallback((idx) => {
    if (visitedRef.current[idx]) return;
    visitedRef.current[idx] = true;
    setCollected((c) => c.map((v, i) => v || i === idx));
    setCardIndex(idx);
    navigator.vibrate?.(60);
  }, []);

  const moveRoad = () => {
    placement.current.reset?.();
    setPlaced(false);
    setReticleVisible(false);
  };

  const holdKey = (key, value) => (e) => {
    e.preventDefault();
    touchKeysRef.current[key] = value;
  };

  const count = collected.filter(Boolean).length;
  const allDone = count === ACHIEVEMENTS.length;

  return createPortal(
    <div ref={overlayRef} className={`arcar${session ? ' arcar--live' : ''}`}>
      <div className="arcar-canvas">
        <Canvas
          frameloop="demand"
          gl={{ alpha: true, antialias: true }}
          camera={{ near: 0.01, far: 50 }}
        >
          {session && (
            <>
              <SessionBinder session={session} />
              <ARWorld
                session={session}
                placement={placement}
                onReticle={setReticleVisible}
                onNoFloor={() => setNoFloor(true)}
                onPlaced={handlePlaced}
                visitedRef={visitedRef}
                collected={collected}
                cardIndex={cardIndex}
                touchKeysRef={touchKeysRef}
                onArrive={handleArrive}
              />
            </>
          )}
        </Canvas>
      </div>

      {!session && (
        <div className="arcar-intro" role="dialog" aria-modal="true" aria-label="AR car game">
          <button type="button" className="ar-close" onClick={onClose} aria-label="Close">✕</button>
          <p className="ar-tag">AR car game</p>
          <h3>Drive the journey on your floor</h3>
          <ol className="arcar-steps">
            <li>Find a clear floor space about 5 m long.</li>
            <li>Point your phone at the floor and tap <strong>Place road</strong>.</li>
            <li>Hold <strong>▲</strong> to drive and walk beside the car.</li>
            <li>Hit a star and its achievement details pop up above it.</li>
          </ol>
          {supported === null && <p className="arcar-note">Checking AR support…</p>}
          {supported && (
            <button type="button" className="arcar-start" onClick={startAR}>Start AR</button>
          )}
          {startError && <p className="arcar-note arcar-note--err">{startError}</p>}
          {supported === false && (
            <div className="ar-qr">
              {qr && <img src={qr} alt="QR code to open the portfolio on your phone" />}
              <p className="arcar-note">
                This device can't run AR. Open the site on an Android phone in Chrome (scan the code), then
                tap <strong>Play in AR</strong>. iPhone Safari doesn't support WebXR yet.
              </p>
            </div>
          )}
        </div>
      )}

      {session && (
        <div className="arcar-hud">
          <div className="arcar-top">
            <span className="arcar-count">⭐ {count} / {ACHIEVEMENTS.length}</span>
            <div className="arcar-top-actions">
              {placed && <button type="button" className="arcar-pill" onClick={moveRoad}>Move road</button>}
              <button type="button" className="arcar-pill" onClick={() => session.end()}>Exit</button>
            </div>
          </div>

          {!placed && (
            <div className="arcar-place">
              <p>
                {noFloor
                  ? 'Floor detection isn't available on this phone. Point at the floor and the road will start about 1 m ahead.'
                  : reticleVisible ? 'Road start goes on the orange ring' : 'Move your phone slowly to find the floor…'}
              </p>
              <button type="button" className="arcar-start" disabled={!reticleVisible && !noFloor} onClick={() => { placement.current.request = true; }}>
                Place road
              </button>
            </div>
          )}

          {placed && (
            <>
              <p className="arcar-hint">
                {allDone
                  ? '🎉 All milestones collected!'
                  : cardIndex !== null
                    ? ACHIEVEMENTS[cardIndex].title
                    : 'Hold ▲ to drive to the first star'}
              </p>
              <div className="arcar-drive">
                <button
                  type="button"
                  className="lvl-touch-btn lvl-touch-btn--brake"
                  aria-label="Reverse / brake"
                  onPointerDown={holdKey('backward', true)}
                  onPointerUp={holdKey('backward', false)}
                  onPointerLeave={holdKey('backward', false)}
                  onPointerCancel={holdKey('backward', false)}
                >
                  ▼
                </button>
                <button
                  type="button"
                  className="lvl-touch-btn lvl-touch-btn--gas"
                  aria-label="Drive forward"
                  onPointerDown={holdKey('forward', true)}
                  onPointerUp={holdKey('forward', false)}
                  onPointerLeave={holdKey('forward', false)}
                  onPointerCancel={holdKey('forward', false)}
                >
                  ▲
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
