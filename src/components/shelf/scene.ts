import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type SectionId = 'about' | 'projects' | 'interests' | 'contact';
export interface ShelfController {
  focus(section: SectionId | null, immediate?: boolean): void;
  setDimmed(value: boolean): void;
  dispose(): void;
}
const poses = ['stand', 'climb', 'research', 'hug', 'think', 'wave', 'lie', 'lounge'] as const;
const plankTop = .0575;
type Pose = (typeof poses)[number] | 'sit';
type FigureColor = 'green' | 'teal';
type Point = [number, number, number];

/** Every visible shelf object is geometry, including the figures and their poses. */
export async function createShelf(
  host: HTMLDivElement,
  select: (id: SectionId) => void,
  hover: (id: SectionId | null) => void,
  signal: AbortSignal,
): Promise<ShelfController> {
  const loader = new GLTFLoader();
  async function loadFigures(filename: string) {
    const response = await fetch(`/models/${filename}`, { signal });
    if (!response.ok) throw new Error(`Shelf figure model ${filename} could not load (${response.status})`);
    return (await loader.parseAsync(await response.arrayBuffer(), '')).scene;
  }
  const [collection, sittingStudy] = await Promise.all([
    loadFigures('smiski-shelf.glb'),
    loadFigures('smiski-series-1-sitting.glb'),
  ]);
  signal.throwIfAborted();

  const figures = new Map<Pose, THREE.Object3D>();
  for (const pose of poses) {
    const figure = collection.getObjectByName(pose);
    if (!figure) throw new Error(`Missing shelf figure pose: ${pose}`);
    figures.set(pose, figure);
  }
  const sample = figures.get('hug')?.children.find(object => object instanceof THREE.Mesh);
  if (!(sample instanceof THREE.Mesh) || !(sample.material instanceof THREE.MeshStandardMaterial)) {
    throw new Error('The shelf figure resin material is missing');
  }
  const green = sample.material;
  sittingStudy.traverse(object => {
    if (object instanceof THREE.Mesh && object.material.name === green.name) object.material = green;
  });
  figures.set('sit', sittingStudy);
  const teal = green.clone();
  teal.color.set('#76b2ad');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.setClearColor('#625044');
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'A warmly lit wooden shelf with little green figures, a framed print, a laptop, a Rubik’s cube, a tennis ball, and an envelope. Drag to look around, scroll to zoom, or use Explore for keyboard navigation.');
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.enablePan = false;
  controls.rotateSpeed = .42;
  controls.zoomSpeed = .65;
  controls.minAzimuthAngle = -.46;
  controls.maxAzimuthAngle = .46;
  controls.minPolarAngle = Math.PI / 2 - .23;
  controls.maxPolarAngle = Math.PI / 2 + .07;
  controls.minDistance = 4.2;
  controls.maxDistance = 34;

  const textures = new Set<THREE.Texture>();
  const geometryCache = new Map<string, THREE.BufferGeometry>();
  const material = (color: string, roughness = .7) => new THREE.MeshStandardMaterial({ color, roughness });
  const darkGreen = material('#364e39');
  const paper = material('#e5d9b8');
  const rubber = material('#222624');
  const sphere = new THREE.SphereGeometry(1, 28, 20);

  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, mat: THREE.Material, position: Point, scale?: Point) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);
    if (scale) object.scale.set(...scale);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function ball(parent: THREE.Object3D, mat: THREE.Material, position: Point, scale: Point) { return mesh(parent, sphere, mat, position, scale); }
  function box(parent: THREE.Object3D, mat: THREE.Material, size: Point, position: Point, radius = .025) {
    const key = `${size.join(',')}:${radius}`;
    if (!geometryCache.has(key)) geometryCache.set(key, new RoundedBoxGeometry(...size, 2, Math.min(radius, Math.min(...size) / 2)));
    return mesh(parent, geometryCache.get(key)!, mat, position);
  }
  function limb(parent: THREE.Object3D, mat: THREE.Material, start: Point, end: Point, radius: number) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), direction = b.clone().sub(a);
    const length = direction.length();
    const key = `limb:${radius}:${length.toFixed(4)}`;
    if (!geometryCache.has(key)) geometryCache.set(key, new THREE.CapsuleGeometry(radius, Math.max(.001, length - 2 * radius), 5, 12));
    const result = mesh(parent, geometryCache.get(key)!, mat, [0, 0, 0]);
    result.position.copy(a.add(b).multiplyScalar(.5));
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return result;
  }
  function line(parent: THREE.Object3D, points: Point[], mat: THREE.Material, radius = .008) {
    return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 32, radius, 5, false), mat, [0, 0, 0]);
  }
  function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas textures unavailable');
    paint(ctx);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture); return texture;
  }

  // Deterministic grain, generated locally; no image downloads or external models.
  let seed = 42;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const woodMap = canvasTexture(1024, 128, ctx => {
    ctx.fillStyle = '#c7aa80'; ctx.fillRect(0, 0, 1024, 128);
    for (let i = 0; i < 700; i++) {
      const y = random() * 128;
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(280, y + random() * 8, 690, y - random() * 9, 1024, y + random() * 3);
      ctx.strokeStyle = `rgba(91,61,35,${random() * .11})`; ctx.lineWidth = random() * .8 + .25; ctx.stroke();
    }
  });
  woodMap.wrapS = THREE.RepeatWrapping;
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, roughness: .72, color: '#e3c69e' });
  const wallNoise = canvasTexture(128, 128, ctx => {
    const image = ctx.createImageData(128, 128);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 125 + random() * 14;
      image.data[i] = value; image.data[i + 1] = value; image.data[i + 2] = value; image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  });
  wallNoise.colorSpace = THREE.NoColorSpace;
  wallNoise.wrapS = wallNoise.wrapT = THREE.RepeatWrapping; wallNoise.repeat.set(26, 26);
  const wall = mesh(scene, new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#a18d76', roughness: 1, bumpMap: wallNoise, bumpScale: .018 }), [0, 0, -.55]);
  wall.castShadow = false;

  const ambient = new THREE.HemisphereLight('#f6e3c3', '#655d44', 1.1); scene.add(ambient);
  const keyLight = new THREE.SpotLight('#ffd2a0', 275, 40, .8, .85, 2);
  keyLight.position.set(-3.6, 6.4, 10); keyLight.target.position.set(0, .6, 0);
  keyLight.castShadow = true; keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -.00008; keyLight.shadow.normalBias = .025;
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 24;
  keyLight.shadow.radius = 3;
  scene.add(keyLight, keyLight.target);
  const fill = new THREE.DirectionalLight('#e0dac0', 1.05); fill.position.set(5, 2, 8); scene.add(fill);

  const shadowMap = canvasTexture(64, 64, ctx => {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(32,22,10,.34)'); gradient.addColorStop(1, 'rgba(32,22,10,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  });
  const contactShadow = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
  function ground(parent: THREE.Object3D, x: number, z: number, width = .65) {
    const m = mesh(parent, new THREE.PlaneGeometry(width, .5), contactShadow, [x, .002, z]);
    m.rotation.x = -Math.PI / 2; m.castShadow = m.receiveShadow = false;
  }

  function figure(parent: THREE.Object3D, x: number, pose: Pose, yaw = 0, scale = 1, color: FigureColor = 'green', z = .16) {
    const group = new THREE.Group();
    group.position.set(x, plankTop, z);
    group.rotation.y = yaw;
    group.scale.setScalar(scale);
    parent.add(group);
    if (pose !== 'sit' && pose !== 'climb' && pose !== 'research') {
      ground(group, 0, 0, pose === 'lie' || pose === 'lounge' ? 1.1 : .6);
    }

    // Clones reuse the pose meshes and materials, including the original facial marks.
    const sculpt = figures.get(pose)!.clone(true);
    sculpt.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.material === green && color === 'teal') object.material = teal;
      object.castShadow = object.material === green || object.material === teal;
      object.receiveShadow = true;
    });
    group.add(sculpt);
    return group;
  }

  const compact = () => window.innerWidth <= 700;
  let small = compact();
  let spread = small ? .62 : 1;
  let vertical = small ? 1.13 : 1;
  const initialVertical = vertical;
  const layoutItems: { object: THREE.Object3D; x: number; y?: number; width?: boolean }[] = [];
  const rowYs = [2.55, 1.25, -.05, -1.35, -2.65];
  const widths = [7.55, 7.8, 8.0, 7.45, 7.0];
  const offsets = [-.65, .6, -.75, -.15, .85];
  const plankDepth = .98;
  const plankCenterZ = .06;
  const shelfFront = plankCenterZ + plankDepth / 2;
  const rows = rowYs.map((y, i) => {
    const row = new THREE.Group(); row.position.y = y * vertical; scene.add(row);
    layoutItems.push({ object: row, x: 0, y });
    const plank = box(row, wood, [widths[i]!, 2 * plankTop, plankDepth], [offsets[i]! * spread, 0, plankCenterZ], .023);
    plank.scale.x = spread;
    layoutItems.push({ object: plank, x: offsets[i]!, width: true });
    for (const x of [offsets[i]! - widths[i]! * .36, offsets[i]! + widths[i]! * .36]) {
      const bracket = box(row, wood, [.14, .27, .12], [x * spread, -.1, -.4], .01);
      layoutItems.push({ object: bracket, x });
    }
    return row;
  });
  const sections = new Map<SectionId, THREE.Group>();
  function section(id: SectionId, row: number, x: number) {
    const group = new THREE.Group(); group.position.x = x * spread; group.userData.section = id;
    rows[row]!.add(group); layoutItems.push({ object: group, x }); sections.set(id, group); return group;
  }
  function extra(row: number, x: number, pose: Pose, yaw = 0, scale = 1, color: FigureColor = 'green', z = .16) {
    const group = figure(rows[row]!, x * spread, pose, yaw, scale, color, z);
    layoutItems.push({ object: group, x }); return group;
  }
  function ladder(x: number, upper: number, railOverhang = .0725) {
    const bottom = rows[upper + 1]!.position.y + .06;
    const top = rows[upper]!.position.y + plankTop + railOverhang;
    const group = new THREE.Group(); group.position.set(x * spread, bottom, shelfFront); scene.add(group);
    layoutItems.push({object:group, x});
    const height = top - bottom;
    for (const side of [-1, 1]) limb(group, darkGreen, [side * .16, 0, 0], [side * .16, height, 0], .022);
    for (let y = .13; y < height; y += .16) limb(group, darkGreen, [-.16, y, 0], [.16, y, 0], .014);
    return group;
  }
  const climbingLadderX = -2.85;
  const ladders = [ladder(2.45, 0), ladder(climbingLadderX, 1, 0), ladder(2.35, 2), ladder(-1.8, 3)];
  extra(1, climbingLadderX, 'climb', 0, .92, 'green', shelfFront);

  // Frame: an illustrative landscape print, never a fabricated photo of Caleb.
  const about = section('about', 0, -1.7);
  figure(about, -.55, 'hug', .12, .88, 'green', .16);
  const frame = new THREE.Group(); frame.position.set(.3, .075, .05); frame.rotation.y = -.1; frame.rotation.x = -.07; about.add(frame);
  box(frame, wood, [.65, .81, .075], [0, .405, 0], .015);
  box(frame, paper, [.535, .69, .012], [0, .405, .046], .006);
  const print = canvasTexture(128, 160, ctx => {
    ctx.fillStyle = '#d4c8a8'; ctx.fillRect(0, 0, 128, 160);
    ctx.fillStyle = '#b6b99b'; ctx.beginPath(); ctx.arc(84, 48, 21, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#718267'; ctx.beginPath(); ctx.moveTo(0, 118); ctx.lineTo(49, 71); ctx.lineTo(128, 135); ctx.lineTo(128, 160); ctx.lineTo(0, 160); ctx.fill();
    ctx.fillStyle = '#a1aa81'; ctx.beginPath(); ctx.moveTo(0, 143); ctx.lineTo(87, 88); ctx.lineTo(128, 120); ctx.lineTo(128, 160); ctx.lineTo(0, 160); ctx.fill();
  });
  mesh(frame, new THREE.PlaneGeometry(.46, .60), new THREE.MeshStandardMaterial({map:print, roughness:1}), [0, .405, .055]);
  extra(0, .15, 'wave', -.12, .82); extra(0, 1.15, 'sit', 0, .72, 'green', shelfFront);
  extra(0, -3.45, 'stand', .2, .7);

  const projectsGroup = section('projects', 1, -.2);
  const researcher = figure(projectsGroup, 0, 'research', -.28, .96, 'green', shelfFront);
  const laptop = researcher.getObjectByName('LaptopMount');
  if (!laptop) throw new Error('The Researching figure is missing its laptop mount');
  const laptopCase = material('#91a766', .51);
  box(laptop, laptopCase, [.74, .036, .47], [0, .018, 0], .013);
  box(laptop, darkGreen, [.62, .007, .19], [0, .038, .070], .008);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
    box(laptop, laptopCase, [.056, .007, .04], [-.269 + c * .067, .044, .008 + r * .059], .005);
  }
  box(laptop, darkGreen, [.20, .003, .102], [0, .037, -.126], .009);
  const screen = new THREE.Group(); screen.position.set(0, .034, .214); screen.rotation.x = .31; laptop.add(screen);
  const lidHeight = .37;
  box(screen, laptopCase, [.74, lidHeight, .033], [0, lidHeight / 2, 0], .014);
  const screenMap = canvasTexture(256, 160, ctx => {
    ctx.fillStyle = '#202d27'; ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#3c5145'; ctx.fillRect(0, 0, 256, 15);
    for (let r = 0; r < 9; r++) {
      ctx.fillStyle = r % 3 === 0 ? '#97b598' : r % 3 === 1 ? '#baa779' : '#768d89';
      ctx.fillRect(15 + (r % 3) * 12, 30 + r * 12, 40 + (r * 17) % 120, 4);
    }
  });
  const display = mesh(screen, new THREE.PlaneGeometry(.66, lidHeight - .075), new THREE.MeshBasicMaterial({map:screenMap}), [0, lidHeight / 2, -.017]);
  display.rotation.y = Math.PI;
  display.castShadow = false;
  const lidMark = canvasTexture(64, 64, ctx => {
    ctx.fillStyle = '#e5e8b9'; ctx.beginPath(); ctx.arc(32, 32, 29, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#68794d';
    for (const x of [24, 40]) { ctx.beginPath(); ctx.arc(x, 31, 2.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillRect(29, 42, 6, 2);
  });
  const badge = mesh(screen, new THREE.PlaneGeometry(.111, .111), new THREE.MeshStandardMaterial({ map: lidMark, transparent: true, roughness: .67 }), [0, lidHeight / 2, .017]);
  badge.castShadow = false;
  figure(projectsGroup, -.92, 'think', .32, .95);
  figure(projectsGroup, 1.0, 'lounge', -.12, .9, 'green', .20);
  extra(1, 2.55, 'stand', -.15, .82); extra(1, 3.6, 'hug', -.25, .76);

  extra(2, -3.65, 'wave', .12, .82); extra(2, -2.0, 'think', .18, .83);
  extra(2, -.48, 'sit', 0, .84, 'green', shelfFront);
  for (let i = 0; i < 3; i++) extra(2, .65 + i * .62, 'stand', -.12 + i * .1, .62, 'teal');
  extra(2, 2.65, 'hug', -.18, .74);

  const interests = section('interests', 3, -.2);
  const cube = new THREE.Group(); cube.position.set(-.15, .38, .17); cube.rotation.y = .24; cube.rotation.z = .02; interests.add(cube);
  box(cube, rubber, [.61, .61, .61], [0, 0, 0], .025);
  const colors = ['#bd5436', '#e2b938', '#387d73', '#e3d5b1', '#44647f', '#bd853c'];
  const stickerMats = colors.map(c => material(c, .46));
  for (let face = 0; face < 6; face++) {
    const faceGroup = new THREE.Group();
    if (face === 1) faceGroup.rotation.y = Math.PI / 2;
    if (face === 2) faceGroup.rotation.x = -Math.PI / 2;
    if (face === 3) faceGroup.rotation.y = Math.PI;
    if (face === 4) faceGroup.rotation.y = -Math.PI / 2;
    if (face === 5) faceGroup.rotation.x = Math.PI / 2;
    cube.add(faceGroup);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box(faceGroup, stickerMats[(face + r + (c === 1 ? 2 : 0)) % 6]!, [.174, .174, .008], [(c - 1) * .197, (r - 1) * .197, .307], .009);
  }
  figure(interests, -.92, 'stand', .24, .86);
  figure(interests, .65, 'sit', 0, .72, 'green', shelfFront);
  const tennis = new THREE.Group(); tennis.position.set(small ? 1.17 : 1.65, .35, .13); tennis.rotation.z = .4; interests.add(tennis);
  const tennisMat = material('#b2ba45', .95); ball(tennis, tennisMat, [0, 0, 0], [.285, .285, .285]);
  const seamPoints: Point[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100 * Math.PI * 2;
    const v = new THREE.Vector3(Math.cos(t), Math.sin(t) * Math.cos(t * 2) * .8, Math.sin(t) * Math.sin(t * 2) * .8).normalize().multiplyScalar(.286);
    seamPoints.push([v.x, v.y, v.z]);
  }
  line(tennis, seamPoints, paper, .009);
  figure(interests, 2.3, 'hug', -.28, .86);
  extra(3, -3.1, 'sit', 0, .88, 'green', shelfFront);
  const interestExtra = extra(3, 3.1, 'wave', -.16, .72);
  interestExtra.visible = !small;

  const contact = section('contact', 4, 1.5);
  const envelope = new THREE.Group(); envelope.position.set(0, .075, .33); envelope.rotation.y = -.13; contact.add(envelope);
  box(envelope, paper, [.73, .46, .055], [0, .23, 0], .012);
  const envelopeLine = material('#b4a481', .9);
  line(envelope, [[-.35, .44, .032], [0, .20, .037], [.35, .44, .032]], envelopeLine, .005);
  line(envelope, [[-.35, .025, .032], [-.13, .20, .033]], envelopeLine, .004);
  line(envelope, [[.35, .025, .032], [.13, .20, .033]], envelopeLine, .004);
  figure(contact, .18, 'hug', .1, .8, 'green', -.05);
  extra(4, -.6, 'sit', 0, .92, 'green', shelfFront); extra(4, 3.25, 'lie', -.14, .8);
  for (let i = 0; i < 2; i++) extra(4, -1.55 + i * .5, 'stand', -.1, .48);

  const ids: SectionId[] = ['about', 'projects', 'interests', 'contact'];
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const targetPosition = new THREE.Vector3(), targetLook = new THREE.Vector3();
  let active: SectionId | null = null, hovering: SectionId | null = null;
  let tweening = false, dirty = true, disposed = false, dragging = false, resizedOnce = false;
  let startX = 0, startY = 0, lastFrame = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  const hotspotElements = ids.map(id => host.querySelector<HTMLButtonElement>(`[data-hotspot="${id}"]`)!);

  function homeDistance() {
    const aspect = Math.max(.25, host.clientWidth / host.clientHeight);
    const halfHeight = Math.max(4.4 * vertical, (small ? 5.8 : 5.25) * spread / aspect);
    return halfHeight / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  }
  function focus(id: SectionId | null, immediate = false) {
    active = id;
    scene.updateMatrixWorld(true);
    if (id) {
      const anchor = sections.get(id)!.getWorldPosition(new THREE.Vector3());
      targetLook.copy(anchor).add(new THREE.Vector3(.2, .45, .15));
      targetPosition.copy(targetLook).add(new THREE.Vector3(.75, .65, small ? 5.3 : 6.5));
    } else {
      targetLook.set(0, .38 * vertical, .02);
      targetPosition.set(.35, .95 * vertical, homeDistance());
    }
    controls.maxDistance = Math.max(15, homeDistance() * 1.22);
    if (reduced || immediate) { camera.position.copy(targetPosition); controls.target.copy(targetLook); controls.update(); }
    else tweening = true;
    dirty = true;
  }
  function resize() {
    if (disposed) return;
    const nextSmall = compact();
    if (nextSmall !== small) {
      small = nextSmall; spread = small ? .62 : 1; vertical = small ? 1.13 : 1;
      layoutItems.forEach(({object, x, y, width}) => {
        object.position.x = x * spread;
        if (y !== undefined) object.position.y = y * vertical;
        if (width) object.scale.x = spread;
      });
      ladders.forEach((ladder, i) => {
        const upper = [0, 1, 2, 3][i]!;
        ladder.position.y = rows[upper + 1]!.position.y + .06;
        ladder.scale.y = vertical / initialVertical;
      });
      interestExtra.visible = !small;
      tennis.position.x = small ? 1.17 : 1.65;
      renderer.shadowMap.needsUpdate = true;
    }
    renderer.setSize(host.clientWidth, host.clientHeight);
    camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix();
    focus(active, !resizedOnce);
    resizedOnce = true;
    dirty = true;
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  function hit(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects([...sections.values()], true);
    if (!intersections.length) return null;
    let object: THREE.Object3D | null = intersections[0]!.object;
    while (object && !object.userData.section) object = object.parent;
    return (object?.userData.section as SectionId | undefined) ?? null;
  }
  function pointerDown(event: PointerEvent) { startX = event.clientX; startY = event.clientY; dragging = false; tweening = false; }
  function pointerMove(event: PointerEvent) {
    if (event.buttons && Math.hypot(event.clientX - startX, event.clientY - startY) > 5) dragging = true;
    const id = dragging || active ? null : hit(event);
    if (hovering !== id) { hovering = id; hover(id); }
    renderer.domElement.style.cursor = dragging ? 'grabbing' : id ? 'pointer' : 'grab';
  }
  function pointerUp(event: PointerEvent) {
    if (!dragging && !active && Math.hypot(event.clientX - startX, event.clientY - startY) < 6) { const id = hit(event); if (id) select(id); }
    dragging = false;
  }
  function pointerLeave() { hovering = null; hover(null); }
  function onWheel() { tweening = false; }
  function onChange() { dirty = true; }
  function onMotion(event: MediaQueryListEvent) { reduced = event.matches; if (reduced) focus(active, true); }
  function onContextLost(event: Event) { event.preventDefault(); }
  function onContextRestored() { dirty = true; }
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('pointerleave', pointerLeave);
  renderer.domElement.addEventListener('wheel', onWheel, {passive:true});
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  controls.addEventListener('change', onChange);
  controls.addEventListener('start', onWheel);
  motion.addEventListener('change', onMotion);

  function positionHotspots() {
    const projected = new THREE.Vector3();
    ids.forEach((id, i) => {
      if (id === 'projects') badge.getWorldPosition(projected);
      else {
        sections.get(id)!.getWorldPosition(projected);
        projected.y += .47;
        projected.z += .65;
      }
      projected.project(camera);
      const button = hotspotElements[i];
      if (!button) return;
      button.style.left = `${(projected.x + 1) / 2 * host.clientWidth}px`;
      button.style.top = `${(-projected.y + 1) / 2 * host.clientHeight}px`;
      button.style.visibility = active || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1 ? 'hidden' : '';
    });
  }
  renderer.setAnimationLoop(time => {
    if (disposed || document.hidden) return;
    const delta = Math.min((time - lastFrame) / 1000 || .016, .05); lastFrame = time;
    if (tweening) {
      const blend = 1 - Math.exp(-5.5 * delta);
      camera.position.lerp(targetPosition, blend); controls.target.lerp(targetLook, blend); dirty = true;
      if (camera.position.distanceToSquared(targetPosition) + controls.target.distanceToSquared(targetLook) < .00002) tweening = false;
    }
    controls.update();
    if (dirty) { renderer.render(scene, camera); positionHotspots(); dirty = false; }
  });
  resize();
  renderer.render(scene, camera); positionHotspots();
  // The scene is static. Camera movement reuses the same shadow map.
  renderer.shadowMap.autoUpdate = false;

  return {
    focus,
    setDimmed(value) {
      keyLight.intensity = value ? 75 : 275; ambient.intensity = value ? .40 : 1.1; fill.intensity = value ? .26 : 1.05;
      green.emissive.set(value ? '#6c8c37' : '#000000'); green.emissiveIntensity = value ? .35 : 0;
      teal.emissive.set(value ? '#39776a' : '#000000'); teal.emissiveIntensity = value ? .24 : 0;
      renderer.shadowMap.needsUpdate = true; dirty = true;
    },
    dispose() {
      disposed = true; observer.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
      motion.removeEventListener('change', onMotion);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointerleave', pointerLeave);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
        }
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      keyLight.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
