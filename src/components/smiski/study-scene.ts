import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type StudyView = 'front'|'three-quarter'|'side'|'back';
export type StudyLight = 'neutral'|'warm'|'glow';
export interface StudyController { setView(view:StudyView):void; setLight(light:StudyLight):void; dispose():void; }

export async function createStudy(host:HTMLDivElement, onFree:()=>void):Promise<StudyController> {
  // Load first, so a failed request cannot leave a renderer or GPU resources behind.
  const {scene:model} = await new GLTFLoader().loadAsync('/models/smiski-hugging-knees-study.glb');
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.setClearColor('#e3e4d9');
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute('role','img');
  renderer.domElement.setAttribute('aria-label','Reference-based Smiski hugging its knees, sculpted as a continuous surface. Use the view controls to inspect the front, side, and back.');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(model);
  const camera = new THREE.PerspectiveCamera(32,1,.05,50);
  const target = new THREE.Vector3(0,.84,.16), wanted = new THREE.Vector3(1.7,1.35,3.55);
  camera.position.copy(wanted);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.target.copy(target); controls.enableDamping=true; controls.dampingFactor=.09;
  controls.enablePan=false; controls.minDistance=2.1; controls.maxDistance=6.5;
  controls.minPolarAngle=.4; controls.maxPolarAngle=1.65; controls.rotateSpeed=.55; controls.zoomSpeed=.65;
  controls.update();
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = pmrem.fromScene(room,.04); room.dispose(); pmrem.dispose();
  scene.environment = environment.texture; scene.environmentIntensity=.5;
  const ambient = new THREE.HemisphereLight('#f7f8e9','#a5ac91',.7); scene.add(ambient);
  const key = new THREE.DirectionalLight('#fff4dd',1.8); key.position.set(-3,4,5);
  key.castShadow = true; key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left=-1.5; key.shadow.camera.right=1.5; key.shadow.camera.top=2; key.shadow.camera.bottom=-1;
  key.shadow.camera.near=.1; key.shadow.camera.far=12; key.shadow.normalBias=.007; key.shadow.bias=-.00005;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dbe8cf',.65); fill.position.set(3,2,-1); scene.add(fill);
  const floorMaterial = new THREE.ShadowMaterial({color:'#65704e',opacity:.15});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMaterial); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  model.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow=true; object.receiveShadow=true; } });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const orbit = new THREE.Spherical(), destination = new THREE.Spherical(), offset = new THREE.Vector3();
  let dirty=true, moving=false, disposed=false, last=0;
  function setView(view:StudyView) {
    const positions:Record<StudyView,[number,number,number]> = {front:[0,1.02,3.85],'three-quarter':[1.7,1.35,3.55],side:[3.8,1.05,.16],back:[0,1.1,-3.7]};
    wanted.set(...positions[view]);
    if (reduced.matches) { camera.position.copy(wanted); controls.update(); } else moving=true;
    dirty=true;
  }
  function setLight(mode:StudyLight) {
    const glow=mode==='glow', warm=mode==='warm';
    const background = glow ? '#1b2820' : warm ? '#b2a08a' : '#e3e4d9';
    renderer.setClearColor(background); floorMaterial.color.set(glow ? '#0e170f' : '#65704e');
    key.color.set(warm ? '#ffd1a2' : '#fff4dd'); key.intensity=glow ? .25 : 1.8;
    ambient.intensity=glow ? .28 : .7; fill.intensity=glow ? .18 : .65;
    scene.environmentIntensity=glow ? .08 : .5;
    model.traverse(object => { if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshPhysicalMaterial) {
      object.material.emissive.set(glow ? '#b2d85d' : '#000000'); object.material.emissiveIntensity=glow ? .7 : 0;
    } });
    host.parentElement?.style.setProperty('--study-backdrop',background);
    host.dataset.light=mode; dirty=true;
  }
  function change() { dirty=true; }
  function start() { moving=false; onFree(); }
  controls.addEventListener('change',change); controls.addEventListener('start',start);
  const resize = () => {
    if(disposed) return;
    renderer.setSize(host.clientWidth,host.clientHeight);
    camera.aspect=host.clientWidth/host.clientHeight; camera.updateProjectionMatrix(); dirty=true;
  };
  const observer=new ResizeObserver(resize); observer.observe(host); resize(); setLight('neutral');
  renderer.setAnimationLoop(time => {
    if(disposed || document.hidden) return;
    const dt=Math.min((time-last)/1000 || .016,.05); last=time;
    if(moving) {
      const step=1-Math.exp(-6*dt);
      orbit.setFromVector3(offset.copy(camera.position).sub(target));
      destination.setFromVector3(offset.copy(wanted).sub(target));
      const turn=THREE.MathUtils.euclideanModulo(destination.theta-orbit.theta+Math.PI,2*Math.PI)-Math.PI;
      orbit.theta+=turn*step;
      orbit.phi=THREE.MathUtils.lerp(orbit.phi,destination.phi,step);
      orbit.radius=THREE.MathUtils.lerp(orbit.radius,destination.radius,step);
      camera.position.setFromSpherical(orbit).add(target); dirty=true;
      if(camera.position.distanceToSquared(wanted)<.00001) {camera.position.copy(wanted);moving=false;}
    }
    controls.update();
    if(dirty) {renderer.render(scene,camera);dirty=false;}
  });
  renderer.render(scene,camera);
  renderer.shadowMap.autoUpdate=false;
  return {setView,setLight,dispose() {
    disposed=true; observer.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
    const materials = new Set<THREE.Material>();
    scene.traverse(object=>{if(object instanceof THREE.Mesh) {object.geometry.dispose(); for(const mat of Array.isArray(object.material)?object.material:[object.material]) materials.add(mat);}});
    materials.forEach(material=>material.dispose()); environment.dispose(); key.shadow.dispose();renderer.dispose();renderer.domElement.remove();
  }};
}
