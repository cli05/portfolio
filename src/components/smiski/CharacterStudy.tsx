import { useEffect, useRef, useState } from 'preact/hooks';
import type { StudyController, StudyLight, StudyView } from './study-scene';

const views: {id:StudyView;label:string}[] = [
  {id:'front',label:'Front'}, {id:'three-quarter',label:'Three-quarter'}, {id:'side',label:'Side'}, {id:'back',label:'Back'},
];
const lights: {id:StudyLight;label:string}[] = [
  {id:'neutral',label:'Neutral'}, {id:'warm',label:'Warm'}, {id:'glow',label:'Glow'},
];

export default function CharacterStudy() {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<StudyController | null>(null);
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [view, setView] = useState<StudyView|'free'>('three-quarter');
  const [light, setLight] = useState<StudyLight>('neutral');
  const [referenceLoaded, setReferenceLoaded] = useState(true);

  useEffect(() => {
    let stopped = false;
    import('./study-scene').then(async ({createStudy}) => {
      if (stopped || !host.current) return;
      const instance = await createStudy(host.current, () => setView('free'));
      if (stopped) instance.dispose();
      else { controller.current = instance; setStatus('ready'); }
    }).catch(error => { if (!stopped) { console.error('Character study could not load:',error); setStatus('error'); } });
    return () => { stopped = true; controller.current?.dispose(); controller.current = null; };
  }, []);

  return <main class="character-study">
    <header class="study-header"><a href="/shelf/" class="study-return">← The shelf</a><span>Character study <i aria-hidden="true">/</i> 01</span></header>
    <div class="study-main">
      <section class="study-model" aria-label="Interactive model inspection">
        <div ref={host} class="study-canvas-host" />
        <div class="study-model-heading"><p class="study-kicker">Likeness & form</p><h1>Hugging knees.</h1></div>
        {status !== 'ready' && <div class="study-loading" role="status">{status === 'loading' ? 'Loading the character…' : <>The 3D view couldn't open on this device. <a href="/models/smiski-hugging-knees-study.glb" download>Download the model</a></>}</div>}
        <div class="study-view-controls" role="group" aria-label="Model view">{views.map(v => <button key={v.id} type="button" disabled={status !== 'ready'} aria-pressed={view === v.id} onClick={() => {setView(v.id);controller.current?.setView(v.id);}}>{v.label}</button>)}</div>
        <p class="study-drag-hint">Drag to inspect <span aria-hidden="true">·</span> Scroll or pinch to zoom</p>
      </section>

      <aside class="study-notes" aria-label="Reference and review">
        <div class="study-reference">
          <p class="study-kicker">The reference</p>
          <figure>
            {referenceLoaded && <img src="https://smiski.com/wp-content/uploads/2016/03/s1_01.png" width="198" height="200" alt="Official Series 1 Smiski Hugging Knees figure: round head, low-set dot eyes, a small mouth, and arms folded around its knees." referrerPolicy="no-referrer" onError={() => setReferenceLoaded(false)}/>}
            <figcaption><a href="https://smiski.com/e/products/series-1/" target="_blank" rel="noopener noreferrer">Series 1 · Hugging Knees <span aria-hidden="true">↗</span></a><span>Reference image © Dreams Inc.</span></figcaption>
          </figure>
        </div>
        <div class="study-review"><p class="study-kicker">What we're looking for</p><ol>
          <li><span>01</span><div><h2>The face</h2><p>A broad, rounded head, lower-set eyes, and the small, nearly flat mouth.</p></div></li>
          <li><span>02</span><div><h2>The silhouette</h2><p>A short neck and shoulders that flow into the arms. No visible ball joints.</p></div></li>
          <li><span>03</span><div><h2>The pose</h2><p>Raised knees, wrapped forearms, and softly tapered shins and feet.</p></div></li>
        </ol></div>
        <div class="study-lighting"><p class="study-kicker">Check the material</p><div role="group" aria-label="Lighting">{lights.map(l => <button key={l.id} type="button" disabled={status !== 'ready'} aria-pressed={light === l.id} onClick={() => {setLight(l.id);controller.current?.setLight(l.id);}}>{l.label}</button>)}</div></div>
        <p class="study-status-note">This sculpt established the face, proportions, and resin color for the shelf collection.</p>
        <a class="study-download" href="/models/smiski-hugging-knees-study.glb" download>Download the 3D model <span aria-hidden="true">↓</span></a>
      </aside>
    </div>
  </main>;
}
