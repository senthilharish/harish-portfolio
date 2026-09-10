import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Creates a CanvasTexture driven by a draw(ctx, w, h) function, and exposes
// a redraw() to call whenever the on-canvas content needs to change (e.g. a
// checklist item ticking on, or handwriting appearing). Keeps every "screen"
// in the scene (notebook, phone, tablet, terminal) as a real drawable surface
// instead of a static image.
export function useCanvasTexture(width, height, draw) {
  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { canvas, ctx, texture };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useEffect(() => () => texture.dispose(), [texture]);

  // redraw(): repaints using the hook's original draw function.
  // redraw(fn): repaints using `fn` instead, for dynamic per-frame content.
  const redraw = (overrideDraw) => {
    const fn = overrideDraw || draw;
    ctx.clearRect(0, 0, width, height);
    fn(ctx, width, height);
    texture.needsUpdate = true;
  };

  return { texture, redraw, canvas };
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
