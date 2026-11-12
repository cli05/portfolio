import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const finish = (name, color, roughness = .55) => new THREE.MeshStandardMaterial({ name, color, roughness });
const leaf = finish('Green accessories', '#95ae64');
const moss = finish('Dark green accessories', '#53774e');
const mint = finish('Pale green accessories', '#bbd28a');
const paper = finish('Cream paper', '#e2e8ba', .8);
const ink = finish('Accessory markings', '#415a36', .8);
const rubber = finish('Skateboard wheels', '#435745', .86);
const bulb = finish('Yellow light bulb', '#e7e68b', .3);
bulb.emissive.set('#caca6b');
bulb.emissiveIntensity = .18;

function mesh(parent, name, geometry, material, position) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(...position);
  parent.add(object);
  return object;
}

function ellipsoid(parent, name, material, position, radii) {
  const object = mesh(parent, name, new THREE.SphereGeometry(1, 20, 14), material, position);
  object.scale.set(...radii);
  return object;
}

function box(parent, name, material, position, size, rounding = .012) {
  return mesh(parent, name, new RoundedBoxGeometry(...size, 2, Math.min(rounding, ...size.map(v => v / 2))), material, position);
}

function cylinder(parent, name, material, position, top, bottom, height) {
  return mesh(parent, name, new THREE.CylinderGeometry(top, bottom, height, 20), material, position);
}

function rod(parent, name, material, from, to, radius, tipRadius = radius) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const object = cylinder(parent, name, material, a.add(b).multiplyScalar(.5).toArray(), tipRadius, radius, direction.length());
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return object;
}

function group(parent, name, position) {
  const object = new THREE.Group();
  object.name = name;
  object.position.set(...position);
  parent.add(object);
  return object;
}

function line(parent, name, material, points, radius) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  return mesh(parent, name, new THREE.TubeGeometry(curve, 16, radius, 6, false), material, [0, 0, 0]);
}

function cap(parent, head, material, brim, rotation, crownHeight = .226) {
  const hat = group(parent, 'Cap', head);
  hat.rotation.set(...rotation);
  const crown = mesh(hat, 'Rounded crown', new THREE.SphereGeometry(1, 24, 12, 0, 2 * Math.PI, 0, Math.PI / 2), material, [0, 0, 0]);
  crown.scale.set(.360, crownHeight, .344);
  ellipsoid(hat, 'Cap band', material, [0, -.006, 0], [.360, .039, .345]);
  ellipsoid(hat, 'Brim', material, [0, -.022, .244], brim);
  return hat;
}

export function artistProps(model, pose, _skin, faceZ) {
  const palette = group(model, 'Paint palette', [.263, .849, .343]);
  palette.rotation.set(.17, -.24, .45);
  ellipsoid(palette, 'Palette', moss, [0, 0, 0], [.136, .205, .029]);
  for (const [x, y, size] of [[-.044, .121, .029], [.048, .085, .025], [.054, -.016, .028], [-.012, -.107, .026]]) {
    ellipsoid(palette, 'Paint dab', mint, [x, y, .028], [size, size * .78, .012]);
  }
  rod(model, 'Paintbrush handle', moss, [-.378, 1.156, .305], [-.101, .986, .375], .021, .025);
  ellipsoid(model, 'Paintbrush tip', leaf, [-.081, .974, .380], [.067, .030, .028]).rotation.z = -.56;

  const face = group(model, 'Moustache', pose.head);
  face.rotation.set(...pose.tilt);
  for (const side of [-1, 1]) {
    const curl = new THREE.SphereGeometry(1, 24, 16);
    const vertices = curl.getAttribute('position');
    // Round the inner lobe and taper the outer tip upward. Fit the back to the cheek.
    for (let i = 0; i < vertices.count; i++) {
      const across = side * vertices.getX(i);
      const tip = Math.max(0, across);
      const x = .074 + .066 * across;
      const y = -.235 + .056 * tip ** 2 + .029 * (1 - .46 * tip) * vertices.getY(i);
      const z = faceZ(x, y) - .004 + .033 * vertices.getZ(i);
      vertices.setXYZ(i, side * x, y, z);
    }
    curl.deleteAttribute('uv');
    curl.deleteAttribute('normal');
    const smoothCurl = mergeVertices(curl);
    smoothCurl.computeVertexNormals();
    mesh(face, 'Moustache curl', smoothCurl, leaf, [0, 0, 0]);
  }
}

export function airplaneProps(model) {
  const plane = group(model, 'Folded paper airplane', [-.293, .855, .473]);
  plane.rotation.set(.30, -.61, .13);
  // Two paper wings share the crease above the folded keel.
  const shape = new THREE.BufferGeometry();
  const vertices = [
    0, .012, .216, -.181, .008, -.148, 0, -.010, -.098,
    0, .012, .216, 0, -.010, -.098, .181, .008, -.148,
    0, .012, .216, 0, -.059, -.124, 0, -.010, -.098,
  ];
  shape.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  shape.computeVertexNormals();
  const foldedPaper = leaf.clone();
  foldedPaper.side = THREE.DoubleSide;
  mesh(plane, 'Paper folds', shape, foldedPaper, [0, 0, 0]);
  rod(plane, 'Center fold', moss, [0, .011, .205], [0, -.009, -.103], .004);
}

export function lightBulbProps(model) {
  const socket = cylinder(model, 'Bulb socket', moss, [.002, 1.413, .010], .066, .054, .099);
  for (const y of [1.382, 1.409, 1.436]) {
    const thread = mesh(model, 'Socket thread', new THREE.TorusGeometry(.058, .008, 7, 18), leaf, [0, y, .01]);
    thread.rotation.x = Math.PI / 2;
  }
  socket.rotation.z = -.04;
  ellipsoid(model, 'Light bulb', bulb, [.005, 1.544, .010], [.131, .137, .128]);
  ellipsoid(model, 'Bulb neck', bulb, [.003, 1.468, .010], [.071, .071, .070]);
}

export function wrenchProps(model) {
  const wrench = group(model, 'Open-end wrench', [.245, .754, .391]);
  wrench.rotation.z = .77;
  const profile = new THREE.Shape();
  profile.moveTo(-.057, 0);
  profile.quadraticCurveTo(0, -.045, .057, 0);
  profile.lineTo(.061, .624);
  profile.quadraticCurveTo(.234, .669, .183, .880);
  profile.quadraticCurveTo(.152, .969, .088, .990);
  profile.lineTo(.068, .838);
  profile.lineTo(-.069, .838);
  profile.lineTo(-.095, .987);
  profile.quadraticCurveTo(-.199, .943, -.190, .794);
  profile.quadraticCurveTo(-.181, .672, -.061, .624);
  profile.closePath();
  mesh(wrench, 'Rounded wrench', new THREE.ExtrudeGeometry(profile, {
    depth: .058, bevelEnabled: true, bevelSize: .013, bevelThickness: .013, bevelSegments: 2, curveSegments: 9,
  }), leaf, [0, 0, -.029]);
  box(wrench, 'Handle recess', moss, [0, .353, .034], [.026, .441, .013]);
}

export function cactusProps(model) {
  const plant = group(model, 'Potted cactus', [-.404, .922, .320]);
  cylinder(plant, 'Tapered pot', leaf, [0, 0, 0], .137, .099, .223);
  cylinder(plant, 'Pot rim', mint, [0, .109, 0], .146, .140, .052);
  cylinder(plant, 'Soil', ink, [0, .136, 0], .120, .120, .009);
  const stem = ellipsoid(plant, 'Cactus trunk', moss, [0, .333, 0], [.073, .223, .068]);
  stem.rotation.z = -.08;
  ellipsoid(plant, 'Cactus left branch', leaf, [-.069, .319, .004], [.047, .117, .047]).rotation.z = .40;
  ellipsoid(plant, 'Cactus right branch', leaf, [.069, .347, .013], [.047, .112, .046]).rotation.z = -.48;
  line(plant, 'Cactus rib', leaf, [[-.018, .145, .056], [-.018, .303, .069], [.013, .500, .038]], .009);
}

export function trafficProps(model, pose) {
  const helmet = cap(model, [pose.head[0], pose.head[1] + .170, pose.head[2]], leaf, [.365, .035, .194], [0, .12, -.09]);
  ellipsoid(helmet, 'Raised helmet ridge', mint, [0, .143, -.025], [.044, .094, .317]);
  const mark = group(helmet, 'Safety cross', [0, .081, .329]);
  mark.rotation.x = -.29;
  box(mark, 'Cross upright', moss, [0, 0, 0], [.035, .113, .009], .004);
  box(mark, 'Cross bar', moss, [0, 0, .003], [.112, .034, .009], .004);
  rod(model, 'Traffic baton', moss, [-.548, .690, .186], [-.548, 1.452, .186], .028);
  cylinder(model, 'Baton collar', leaf, [-.548, 1.025, .186], .039, .039, .058);
}

export function rulerProps(model) {
  const ruler = group(model, 'Measuring ruler', [.612, .860, .221]);
  box(ruler, 'Ruler', leaf, [0, 0, 0], [.181, 1.72, .044], .012);
  for (let i = 0; i < 13; i++) {
    const width = i % 2 === 0 ? .074 : .042;
    box(ruler, 'Ruler graduation', ink, [.078 - width / 2, -.751 + i * .122, .023], [width, .010, .006], .002);
  }
}

export function skateboardProps(model, pose) {
  cap(model, [pose.head[0], pose.head[1] + .139, pose.head[2]], leaf, [.248, .028, .237], [-.15, -.31, -.06], .288);
  const board = group(model, 'Skateboard', [0, .104, 0]);
  board.rotation.y = .73;
  box(board, 'Board deck', leaf, [0, 0, 0], [.990, .056, .343], .026);
  box(board, 'Raised nose', leaf, [-.490, .023, 0], [.185, .050, .329], .024).rotation.z = -.21;
  box(board, 'Raised tail', leaf, [.490, .023, 0], [.185, .050, .329], .024).rotation.z = .21;
  for (const x of [-.316, .316]) {
    rod(board, 'Truck axle', moss, [x, -.048, -.190], [x, -.048, .190], .022);
    for (const z of [-.162, .162]) {
      const wheel = cylinder(board, 'Wheel', rubber, [x, -.050, z], .054, .054, .057);
      wheel.rotation.x = Math.PI / 2;
      ellipsoid(board, 'Wheel hub', leaf, [x, -.050, z + Math.sign(z) * .030], [.019, .019, .006]);
    }
  }
}

export function mugProps(model, pose) {
  const cap = group(model, 'Sleep cap', [pose.head[0] - .026, pose.head[1] + .223, pose.head[2] + .017]);
  cap.rotation.z = .34;
  ellipsoid(cap, 'Soft cap', leaf, [0, 0, 0], [.355, .220, .334]);
  ellipsoid(cap, 'Folded cap edge', leaf, [0, -.066, .019], [.340, .054, .325]);
  ellipsoid(cap, 'Cap pom', leaf, [-.326, -.044, .002], [.073, .070, .073]);

  const mug = group(model, 'Warm milk mug', [0, .713, .304]);
  cylinder(mug, 'Mug', leaf, [0, 0, 0], .114, .089, .205);
  cylinder(mug, 'Milk', paper, [0, .100, 0], .096, .096, .012);
  const handle = mesh(mug, 'Mug handle', new THREE.TorusGeometry(.065, .017, 8, 18), leaf, [.116, -.001, .006]);
  handle.scale.x = .78;
}

export function bookProps(model) {
  const book = group(model, 'Open book', [0, .414, .160]);
  book.rotation.x = -1.86;
  for (const side of [-1, 1]) {
    const half = group(book, 'Book half', [0, 0, 0]);
    half.rotation.y = -side * .43;
    box(half, 'Green cover', moss, [side * .097, 0, -.011], [.194, .265, .022], .009);
    box(half, 'Cream pages', paper, [side * .093, 0, .006], [.179, .249, .018], .006);
    for (const y of [-.065, -.029, .008, .045]) {
      box(half, 'Printed line', leaf, [side * .093, y, .017], [.101, .006, .003], .001);
    }
  }
  rod(book, 'Spine', moss, [0, -.130, -.012], [0, .130, -.012], .018);
}

export function catProps(model, _pose, skin) {
  const cat = group(model, 'Sleeping Cat Smiski', [-.175, .343, .045]);
  cat.rotation.z = .15;
  ellipsoid(cat, 'Cat body', skin, [-.034, .051, 0], [.177, .098, .100]);
  ellipsoid(cat, 'Cat head', skin, [.114, .097, .024], [.121, .110, .104]);
  for (const side of [-1, 1]) {
    const ear = ellipsoid(cat, 'Cat ear', skin, [.113 + side * .067, .183, .022], [.042, .058, .039]);
    ear.rotation.z = -side * .27;
    ellipsoid(cat, 'Front paw', skin, [.110 + side * .057, -.003, .068], [.053, .033, .051]);
    const x = .113 + side * .044;
    line(cat, 'Closed cat eye', ink, [[x - .019, .106, .120], [x, .099, .126], [x + .019, .104, .122]], .0045);
  }
  line(cat, 'Curled tail', skin, [[-.169, .066, -.020], [-.239, .046, .016], [-.228, .036, .095], [-.178, .032, .108]], .027);
}
