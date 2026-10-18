// Builds the AR trophy models (public/models/trophy-*.glb) from three.js
// primitives. Run with `npm run trophies` after changing the shapes/colours.
// Units are metres, so in AR the trophies appear at real desk-top size.
import { writeFile, mkdir } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter reads Blobs through FileReader, which Node doesn't ship.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => { this.result = buf; this.onloadend?.(); });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

const TIERS = {
  gold: '#ffc84a',
  silver: '#c9ccd1',
  bronze: '#d0793f',
  // Papers, conferences and participation: a star award instead of a cup.
  none: '#ff5b1f',
};

const metal = (color) => new THREE.MeshStandardMaterial({ name: 'metal', color, metalness: 0.9, roughness: 0.28 });
const baseMat = new THREE.MeshStandardMaterial({ name: 'base', color: '#141416', metalness: 0.2, roughness: 0.55 });

function mesh(geometry, material, y = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.y = y;
  return m;
}

function starGeometry(outer, inner, depth) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: depth * 0.35, bevelSize: depth * 0.35, bevelSegments: 2,
  });
  geo.center();
  return geo;
}

function plinth(group) {
  group.add(mesh(new THREE.BoxGeometry(0.15, 0.03, 0.15), baseMat, 0.015));
  group.add(mesh(new THREE.BoxGeometry(0.115, 0.025, 0.115), baseMat, 0.0425));
  return 0.055;
}

function cupTrophy(color) {
  const group = new THREE.Group();
  const m = metal(color);
  let y = plinth(group);

  // Stem + cup as one lathe profile (radius, height) from the plinth upward.
  const profile = [
    [0.0, 0], [0.032, 0], [0.032, 0.008], [0.012, 0.016], [0.009, 0.05], [0.016, 0.062],
    [0.012, 0.07], [0.03, 0.08], [0.048, 0.1], [0.058, 0.13], [0.062, 0.16], [0.064, 0.17],
    [0.058, 0.17], [0.0, 0.17],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const cup = mesh(new THREE.LatheGeometry(profile, 48), m, y);
  group.add(cup);

  // Handles: half tori either side of the bowl.
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 12, 24, Math.PI), m);
    handle.rotation.z = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    handle.position.set(side * 0.058, y + 0.128, 0);
    group.add(handle);
  }

  const star = mesh(starGeometry(0.03, 0.013, 0.008), m, y + 0.17 + 0.034);
  group.add(star);
  return group;
}

function starAward(color) {
  const group = new THREE.Group();
  const m = metal(color);
  const y = plinth(group);
  group.add(mesh(new THREE.CylinderGeometry(0.007, 0.01, 0.07, 24), m, y + 0.035));
  group.add(mesh(starGeometry(0.075, 0.032, 0.016), m, y + 0.07 + 0.07));
  return group;
}

async function exportGlb(object) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(object, resolve, reject, { binary: true });
  });
}

const outDir = new URL('../public/models/', import.meta.url);
await mkdir(outDir, { recursive: true });
for (const [tier, color] of Object.entries(TIERS)) {
  const scene = new THREE.Scene();
  scene.name = `trophy-${tier}`;
  scene.add(tier === 'none' ? starAward(color) : cupTrophy(color));
  const glb = await exportGlb(scene);
  await writeFile(new URL(`trophy-${tier}.glb`, outDir), Buffer.from(glb));
  console.log(`wrote public/models/trophy-${tier}.glb (${glb.byteLength} bytes)`);
}
