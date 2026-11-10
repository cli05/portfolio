import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Offline implicit-surface sculpt. The browser loads the resulting GLB, not this generator.
// Reference: https://smiski.com/e/products/series-1/ (Hugging Knees).
const resolution = 160;
const half = 1.1;
const center = [0, .81, .14];
const headCenter = [0, 1.28, -.055];
const headTilt = .09;
const cos = Math.cos(headTilt), sin = Math.sin(headTilt);
const blend = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * .25;
};
const shapes = [];

function ellipsoid(position, radii, smoothing = .05) {
  shapes.push({ type: 'ellipsoid', position, radii, smoothing });
}
function stroke(points, radii, smoothing = .035) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const count = 12;
  for (let i = 0; i < count; i++) {
    const a = curve.getPoint(i / count), b = curve.getPoint((i + 1) / count);
    const radiusAt = t => {
      const s = t * (radii.length - 1), index = Math.min(radii.length - 2, Math.floor(s));
      return THREE.MathUtils.lerp(radii[index], radii[index + 1], s - index);
    };
    const v = b.clone().sub(a);
    shapes.push({ type: 'segment', a: a.toArray(), v: v.toArray(), lengthSq: v.lengthSq(), r0: radiusAt(i / count), r1: radiusAt((i + 1) / count), smoothing });
  }
}

// A softly hunched torso and full seated pelvis, with a short, blended neck.
ellipsoid([0, .77, -.105], [.207, .235, .177], .075);
ellipsoid([0, .545, -.075], [.225, .245, .196], .075);
ellipsoid([0, .215, -.055], [.236, .222, .205], .065);
ellipsoid([0, .95, -.09], [.092, .12, .092], .06);

// Folded thighs rise into the knees; the shins taper into unsegmented, rounded feet.
for (const side of [-1, 1]) {
  stroke([[side * .115, .295, -.02], [side * .145, .47, .17], [side * .145, .64, .345]], [.125, .13, .114], .045);
  stroke([[side * .145, .64, .345], [side * .145, .39, .455], [side * .145, .135, .565]], [.113, .101, .092], .035);
  ellipsoid([side * .145, .097, .60], [.103, .092, .167], .04);
}

// Arms are curved strokes wrapped around the knees, not straight capsule segments.
stroke([[-.145, .865, -.05], [-.255, .77, .04], [-.305, .625, .25], [-.18, .552, .44], [.035, .545, .475]], [.092, .086, .074, .072, .083], .035);
stroke([[.145, .865, -.05], [.25, .75, .055], [.287, .61, .25], [.145, .522, .445], [-.05, .522, .48]], [.092, .085, .073, .071, .081], .035);

function ellipsoidDistance(x, y, z, position, radii) {
  const qx = (x - position[0]) / radii[0], qy = (y - position[1]) / radii[1], qz = (z - position[2]) / radii[2];
  const k0 = Math.hypot(qx, qy, qz);
  const k1 = Math.hypot(qx / radii[0], qy / radii[1], qz / radii[2]);
  return k1 > 1e-10 ? k0 * (k0 - 1) / k1 : -Math.min(...radii);
}
function distance(x, y, z) {
  let d = 10;
  for (const shape of shapes) {
    let s;
    if (shape.type === 'ellipsoid') s = ellipsoidDistance(x, y, z, shape.position, shape.radii);
    else {
      const qx = x - shape.a[0], qy = y - shape.a[1], qz = z - shape.a[2];
      const t = Math.max(0, Math.min(1, (qx * shape.v[0] + qy * shape.v[1] + qz * shape.v[2]) / shape.lengthSq));
      s = Math.hypot(qx - shape.v[0] * t, qy - shape.v[1] * t, qz - shape.v[2] * t) - (shape.r0 + (shape.r1 - shape.r0) * t);
    }
    d = blend(d, s, shape.smoothing);
  }
  const dy = y - headCenter[1], dz = z - headCenter[2];
  const localY = dy * cos + dz * sin, localZ = -dy * sin + dz * cos;
  // Broad round crown; the lower face tapers gently into a short chin.
  const jaw = 1 - .11 * Math.max(0, Math.min(1, (-localY / .385 - .15) / .85));
  const head = ellipsoidDistance(x, localY, localZ, [0, 0, 0], [.365 * jaw, .385, .343]);
  d = blend(d, head, .05);
  // A level base avoids the floating toes of the original construction.
  return Math.max(d, .006 - y);
}

const skin = new THREE.MeshPhysicalMaterial({
  name: 'Pale phosphorescent resin', color: '#d2dfa0', roughness: .44,
  metalness: 0, clearcoat: .07, clearcoatRoughness: .68,
  transmission: .06, thickness: .22, ior: 1.43,
});
const field = new MarchingCubes(resolution, skin, false, false, 150000);
field.isolation = 0;
for (let iz = 0; iz < resolution; iz++) {
  const z = (iz / resolution * 2 - 1) * half + center[2];
  for (let iy = 0; iy < resolution; iy++) {
    const y = (iy / resolution * 2 - 1) * half + center[1];
    for (let ix = 0; ix < resolution; ix++) {
      const x = (ix / resolution * 2 - 1) * half + center[0];
      field.field[ix + iy * resolution + iz * resolution * resolution] = -distance(x, y, z);
    }
  }
}
field.update();
const raw = new THREE.BufferGeometry();
raw.setAttribute('position', new THREE.Float32BufferAttribute(field.geometry.getAttribute('position').array.slice(0, field.count * 3), 3));
let geometry = mergeVertices(raw, 1e-6);
// Discard collapsed/duplicate extraction triangles before building adjacency.
const initialIndex = geometry.index.array, uniqueFaces = new Set(), cleanIndex = [];
for (let i = 0; i < initialIndex.length; i += 3) {
  const triangle = [initialIndex[i], initialIndex[i + 1], initialIndex[i + 2]];
  if (new Set(triangle).size !== 3) continue;
  const key = [...triangle].sort((a,b)=>a-b).join(':');
  if (!uniqueFaces.has(key)) { uniqueFaces.add(key); cleanIndex.push(...triangle); }
}
geometry.setIndex(cleanIndex);
geometry = mergeVertices(geometry, 1e-6);
const pos = geometry.getAttribute('position');
for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) * half + center[0], pos.getY(i) * half + center[1], pos.getZ(i) * half + center[2]);

// Two light relaxation passes remove sampling ripples while retaining the folds.
const neighbors = Array.from({length:pos.count}, () => new Set());
const index = geometry.index.array;
for (let i = 0; i < index.length; i += 3) {
  for (let j = 0; j < 3; j++) {
    const a = index[i + j], b = index[i + (j + 1) % 3];
    neighbors[a].add(b); neighbors[b].add(a);
  }
}
for (let pass = 0; pass < 2; pass++) {
  const previous = Float32Array.from(pos.array);
  for (let i = 0; i < pos.count; i++) {
    let x = 0, y = 0, z = 0;
    for (const j of neighbors[i]) { x += previous[j * 3]; y += previous[j * 3 + 1]; z += previous[j * 3 + 2]; }
    const n = neighbors[i].size;
    pos.setXYZ(i, THREE.MathUtils.lerp(previous[i * 3], x / n, .12), THREE.MathUtils.lerp(previous[i * 3 + 1], y / n, .12), THREE.MathUtils.lerp(previous[i * 3 + 2], z / n, .12));
  }
}
geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();

// Verify the anatomical sculpt is one connected surface before exporting it.
const seen = new Set(), stack = [0];
while (stack.length) { const vertex = stack.pop(); if (seen.has(vertex)) continue; seen.add(vertex); for (const n of neighbors[vertex]) if (!seen.has(n)) stack.push(n); }
if (seen.size !== pos.count) throw new Error(`Disconnected sculpt: ${seen.size}/${pos.count} vertices in main component`);
const edges = new Map();
for (let i = 0; i < index.length; i += 3) for (let j = 0; j < 3; j++) {
  const a = index[i + j], b = index[i + (j + 1) % 3], key = a < b ? `${a}:${b}` : `${b}:${a}`;
  edges.set(key, (edges.get(key) ?? 0) + 1);
}
const boundaryEdges = [...edges.values()].filter(count => count === 1).length;
const nonManifoldEdges = [...edges.values()].filter(count => count > 2).length;
if (boundaryEdges || nonManifoldEdges) throw new Error(`Sculpt is not watertight: ${boundaryEdges} boundary edges, ${nonManifoldEdges} non-manifold edges`);
const model = new THREE.Group(); model.name = 'Smiski Hugging Knees — reference study';
const body = new THREE.Mesh(geometry, skin); body.name = 'Continuous sculpt'; model.add(body);
const face = new THREE.Group(); face.position.set(...headCenter); face.rotation.x = headTilt; model.add(face);
const ink = new THREE.MeshStandardMaterial({name:'Printed face',color:'#384238',roughness:.85});
function faceZ(x, y) {
  const jaw = 1 - .11 * Math.max(0, Math.min(1, (-y / .385 - .15) / .85));
  return .343 * Math.sqrt(Math.max(0, 1 - (x / (.365 * jaw)) ** 2 - (y / .385) ** 2));
}
for (const side of [-1, 1]) {
  const x = side * .114, y = -.118, z = faceZ(x, y);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), ink);
  eye.name = side < 0 ? 'Left printed eye' : 'Right printed eye';
  eye.position.set(x, y, z + .001); eye.scale.set(.018, .021, .0035);
  eye.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(x / .365 ** 2, y / .385 ** 2, z / .343 ** 2).normalize());
  face.add(eye);
}
const mouthPoints = [];
for (let i = 0; i <= 12; i++) {
  const x = (i / 12 - .5) * .114, y = -.265 - .008 * (x / .057) ** 2;
  mouthPoints.push(new THREE.Vector3(x, y, faceZ(x, y) + .0015));
}
const mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 16, .0062, 6, false), ink);
mouth.name = 'Small flat mouth'; face.add(mouth);
model.userData = { purpose:'Independent reference-based likeness study, awaiting review', reference:'https://smiski.com/e/products/series-1/', method:'Offline continuous implicit-surface sculpt; no third-party model' };

// GLTFExporter uses FileReader for its Blob output; this small adapter is Node-only.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }).catch(error => this.onerror?.(error)); }
};
const exporter = new GLTFExporter();
const binary = await exporter.parseAsync(model, {binary:true});
const out = fileURLToPath(new URL('../public/models/smiski-hugging-knees-study.glb', import.meta.url));
await mkdir(fileURLToPath(new URL('../public/models/', import.meta.url)), {recursive:true});
await writeFile(out, Buffer.from(binary));
const report = {
  asset:'smiski-hugging-knees-study.glb', resolution, vertices:pos.count, triangles:index.length / 3,
  connectedBodyComponents:1, boundaryEdges, nonManifoldEdges, bounds:geometry.boundingBox, bytes:binary.byteLength,
  reference:'https://smiski.com/e/products/series-1/',
};
const reportPath = new URL('../docs/concepts/smiski-hugging-knees-study.json', import.meta.url);
await mkdir(fileURLToPath(new URL('.', reportPath)), {recursive:true});
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
