import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { huggingKnees, shelfPoses } from './smiski-poses.mjs';

// Both the close-up study and the shelf use the same head, face and body sculpt.
const reference = 'https://smiski.com/e/products/series-1/';
const skinColor = '#d2dfa0';
const faceInk = new THREE.MeshStandardMaterial({ name: 'Printed face', color: '#384238', roughness: .85 });

function smoothUnion(a, b, radius) {
  const blend = Math.max(radius - Math.abs(a - b), 0) / radius;
  return Math.min(a, b) - blend * blend * radius * .25;
}

function ellipsoidDistance(x, y, z, position, radii) {
  const qx = (x - position[0]) / radii[0];
  const qy = (y - position[1]) / radii[1];
  const qz = (z - position[2]) / radii[2];
  const k0 = Math.hypot(qx, qy, qz);
  const k1 = Math.hypot(qx / radii[0], qy / radii[1], qz / radii[2]);
  return k1 > 1e-10 ? k0 * (k0 - 1) / k1 : -Math.min(...radii);
}

function jawWidth(y) {
  return .365 * (1 - .11 * Math.max(0, Math.min(1, (-y / .385 - .15) / .85)));
}

function sculptGeometry(buildPose, resolution, skin) {
  const shapes = [];
  const pose = buildPose(
    (position, radii, smoothing = .05) => shapes.push({ type: 'ellipsoid', position, radii, smoothing }),
    (points, radii, smoothing = .035) => {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
      const radiusAt = t => {
        const step = t * (radii.length - 1);
        const index = Math.min(radii.length - 2, Math.floor(step));
        return THREE.MathUtils.lerp(radii[index], radii[index + 1], step - index);
      };
      const count = 12;
      for (let i = 0; i < count; i++) {
        const a = curve.getPoint(i / count);
        const direction = curve.getPoint((i + 1) / count).sub(a);
        shapes.push({
          type: 'segment', a: a.toArray(), direction: direction.toArray(),
          lengthSq: direction.lengthSq(), r0: radiusAt(i / count), r1: radiusAt((i + 1) / count), smoothing,
        });
      }
    },
  );
  const inverse = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...pose.tilt)).invert().elements;
  const headOrigin = [0, 0, 0];

  function distance(x, y, z) {
    let result = 10;
    for (const shape of shapes) {
      let surface;
      if (shape.type === 'ellipsoid') {
        surface = ellipsoidDistance(x, y, z, shape.position, shape.radii);
      } else {
        const qx = x - shape.a[0];
        const qy = y - shape.a[1];
        const qz = z - shape.a[2];
        const [dx, dy, dz] = shape.direction;
        const t = Math.max(0, Math.min(1, (qx * dx + qy * dy + qz * dz) / shape.lengthSq));
        surface = Math.hypot(qx - dx * t, qy - dy * t, qz - dz * t) - THREE.MathUtils.lerp(shape.r0, shape.r1, t);
      }
      result = smoothUnion(result, surface, shape.smoothing);
    }
    const dx = x - pose.head[0];
    const dy = y - pose.head[1];
    const dz = z - pose.head[2];
    const localX = inverse[0] * dx + inverse[4] * dy + inverse[8] * dz;
    const localY = inverse[1] * dx + inverse[5] * dy + inverse[9] * dz;
    const localZ = inverse[2] * dx + inverse[6] * dy + inverse[10] * dz;
    const head = ellipsoidDistance(localX, localY, localZ, headOrigin, [jawWidth(localY), .385, .343]);
    result = smoothUnion(result, head, .05);
    // Trim the portion below the plank top and behind its front lip.
    if (pose.shelfEdge) result = Math.max(result, Math.min(-y, -z));
    return pose.floor === undefined ? result : Math.max(result, pose.floor - y);
  }

  const field = new MarchingCubes(resolution, skin, false, false, 150000);
  field.isolation = 0;
  const [cx, cy, cz] = pose.center;
  for (let iz = 0; iz < resolution; iz++) {
    const z = (iz / resolution * 2 - 1) * pose.half + cz;
    for (let iy = 0; iy < resolution; iy++) {
      const y = (iy / resolution * 2 - 1) * pose.half + cy;
      for (let ix = 0; ix < resolution; ix++) {
        const x = (ix / resolution * 2 - 1) * pose.half + cx;
        field.field[ix + iy * resolution + iz * resolution * resolution] = -distance(x, y, z);
      }
    }
  }
  field.update();
  const raw = new THREE.BufferGeometry();
  raw.setAttribute('position', new THREE.Float32BufferAttribute(field.geometry.getAttribute('position').array.slice(0, field.count * 3), 3));
  let geometry = mergeVertices(raw, 1e-6);
  const initialIndex = geometry.index.array;
  const uniqueFaces = new Set();
  const cleanIndex = [];
  for (let i = 0; i < initialIndex.length; i += 3) {
    const triangle = [initialIndex[i], initialIndex[i + 1], initialIndex[i + 2]];
    if (new Set(triangle).size !== 3) continue;
    const key = [...triangle].sort((a, b) => a - b).join(':');
    if (!uniqueFaces.has(key)) {
      uniqueFaces.add(key);
      cleanIndex.push(...triangle);
    }
  }
  geometry.setIndex(cleanIndex);
  geometry = mergeVertices(geometry, 1e-6);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    positions.setXYZ(i, positions.getX(i) * pose.half + cx, positions.getY(i) * pose.half + cy, positions.getZ(i) * pose.half + cz);
  }
  return { geometry, pose };
}

function finishBody(geometry) {
  const positions = geometry.getAttribute('position');
  const neighbors = Array.from({ length: positions.count }, () => new Set());
  const index = geometry.index.array;
  const edges = new Map();
  for (let i = 0; i < index.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = index[i + j], b = index[i + (j + 1) % 3];
      neighbors[a].add(b);
      neighbors[b].add(a);
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }

  const seen = new Set();
  const stack = [0];
  while (stack.length) {
    const vertex = stack.pop();
    if (seen.has(vertex)) continue;
    seen.add(vertex);
    for (const neighbor of neighbors[vertex]) {
      if (!seen.has(neighbor)) stack.push(neighbor);
    }
  }
  if (seen.size !== positions.count) {
    throw new Error(`Disconnected sculpt: ${seen.size}/${positions.count} vertices in main component`);
  }
  const boundaryEdges = [...edges.values()].filter(count => count === 1).length;
  const nonManifoldEdges = [...edges.values()].filter(count => count > 2).length;
  if (boundaryEdges || nonManifoldEdges) {
    throw new Error(`Sculpt is not watertight: ${boundaryEdges} boundary edges, ${nonManifoldEdges} non-manifold edges`);
  }

  // Relax the extracted surface without rounding away the folds.
  for (let pass = 0; pass < 2; pass++) {
    const previous = Float32Array.from(positions.array);
    for (let i = 0; i < positions.count; i++) {
      let x = 0, y = 0, z = 0;
      for (const neighbor of neighbors[i]) {
        x += previous[neighbor * 3];
        y += previous[neighbor * 3 + 1];
        z += previous[neighbor * 3 + 2];
      }
      const count = neighbors[i].size;
      positions.setXYZ(i,
        THREE.MathUtils.lerp(previous[i * 3], x / count, .12),
        THREE.MathUtils.lerp(previous[i * 3 + 1], y / count, .12),
        THREE.MathUtils.lerp(previous[i * 3 + 2], z / count, .12),
      );
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return {
    vertices: positions.count,
    triangles: index.length / 3,
    connectedBodyComponents: 1,
    boundaryEdges,
    nonManifoldEdges,
    bounds: geometry.boundingBox,
  };
}

function createFace(pose, detailed) {
  const face = new THREE.Group();
  face.position.set(...pose.head);
  face.rotation.set(...pose.tilt);
  const faceZ = (x, y) => .343 * Math.sqrt(Math.max(0, 1 - (x / jawWidth(y)) ** 2 - (y / .385) ** 2));
  const { eyeY = -.118, mouthY = -.265 } = pose.face ?? {};
  for (const side of [-1, 1]) {
    const x = side * .114, y = eyeY, z = faceZ(x, y);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, detailed ? 20 : 12, detailed ? 12 : 8), faceInk);
    eye.name = side < 0 ? 'Left printed eye' : 'Right printed eye';
    eye.position.set(x, y, z + .001);
    eye.scale.set(.018, .021, .0035);
    eye.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(x / .365 ** 2, y / .385 ** 2, z / .343 ** 2).normalize());
    face.add(eye);
  }
  const mouthPoints = [];
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12 - .5) * .114;
    const y = mouthY - .008 * (x / .057) ** 2;
    mouthPoints.push(new THREE.Vector3(x, y, faceZ(x, y) + .0015));
  }
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), detailed ? 16 : 12, .0062, 6, false), faceInk);
  mouth.name = 'Small flat mouth';
  face.add(mouth);
  if (!detailed) {
    // Combine the three facial marks into one draw call per shelf figure.
    const geometries = face.children.map(mesh => {
      mesh.updateMatrix();
      return mesh.geometry.applyMatrix4(mesh.matrix);
    });
    face.clear();
    face.add(new THREE.Mesh(mergeGeometries(geometries), faceInk));
  }
  return face;
}

function createModel(name, buildPose, resolution, skin, detailed) {
  const { geometry, pose } = sculptGeometry(buildPose, resolution, skin);
  const report = { resolution, ...finishBody(geometry) };
  const model = new THREE.Group();
  model.name = name;
  const body = new THREE.Mesh(geometry, skin);
  body.name = 'Continuous sculpt';
  model.add(body, createFace(pose, detailed));
  if (pose.laptopMount) {
    const mount = new THREE.Object3D();
    mount.name = 'LaptopMount';
    mount.position.set(...pose.laptopMount);
    model.add(mount);
  }
  return { model, report };
}

// GLTFExporter reads its binary Blob through FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const shelf = process.argv.includes('--shelf');
const output = new URL('../public/models/', import.meta.url);
const reports = new URL('../docs/concepts/', import.meta.url);
await mkdir(output, { recursive: true });
await mkdir(reports, { recursive: true });
const exporter = new GLTFExporter();

if (shelf) {
  const skin = new THREE.MeshStandardMaterial({ name: 'Smiski resin', color: skinColor, roughness: .48 });
  const collection = new THREE.Group();
  collection.name = 'Smiski shelf poses';
  const poses = {};
  for (const [name, buildPose] of Object.entries(shelfPoses)) {
    const { model, report } = createModel(name, buildPose, 70, skin, false);
    model.scale.setScalar(.62);
    collection.add(model);
    poses[name] = report;
    console.log(`${name}: ${report.triangles} triangles, one closed body`);
  }
  const binary = await exporter.parseAsync(collection, { binary: true });
  const asset = 'smiski-shelf.glb';
  await writeFile(new URL(asset, output), Buffer.from(binary));
  const climbingReference = 'https://smiski.com/e/products/series-2/';
  const researchingReference = 'https://smiski.com/e/products/work-series/';
  await writeFile(new URL('smiski-shelf-meshes.json', reports), JSON.stringify({ asset, bytes: binary.byteLength, poses, reference, climbingReference, researchingReference }, null, 2) + '\n');
  console.log(`${asset}: ${binary.byteLength} bytes`);
} else {
  const skin = new THREE.MeshPhysicalMaterial({
    name: 'Pale phosphorescent resin', color: skinColor, roughness: .44,
    metalness: 0, clearcoat: .07, clearcoatRoughness: .68, transmission: .06, thickness: .22, ior: 1.43,
  });
  const { model, report } = createModel('Smiski Hugging Knees', huggingKnees, 160, skin, true);
  const binary = await exporter.parseAsync(model, { binary: true });
  const asset = 'smiski-hugging-knees-study.glb';
  await writeFile(new URL(asset, output), Buffer.from(binary));
  await writeFile(new URL('smiski-hugging-knees-study.json', reports), JSON.stringify({ asset, ...report, bytes: binary.byteLength, reference }, null, 2) + '\n');
  console.log(`${asset}: ${report.triangles} triangles, ${binary.byteLength} bytes`);
}
