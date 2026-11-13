import { useEffect, useRef, useState } from 'preact/hooks';
import { projects } from '../../data/projects';
import { resume } from '../../data/resume';
import { channels } from '../../data/contact';
import type { ShelfController, SectionId } from './scene';

const sections = [
  { id: 'about', label: 'About me', object: 'The little frame', number: '01' },
  { id: 'projects', label: 'Things I make', object: 'The open laptop', number: '02' },
  { id: 'interests', label: 'Off the screen', object: 'The cube & tennis ball', number: '03' },
  { id: 'contact', label: 'Say hello', object: 'The envelope', number: '04' },
] as const;

function readSection(): SectionId | null {
  const value = window.location.hash.slice(1);
  return sections.some(s => s.id === value) ? value as SectionId : null;
}

function SectionContent({ section }: { section: SectionId }) {
  if (section === 'about') return <>
    <p class="shelf-lead">Hey, I'm Caleb.</p>
    <p>I'm a Computer Science and Mathematics student at Purdue, based in West Lafayette, Indiana. I build software across the full stack and work with machine learning and language models.</p>
    <p>This is a little collection of the things I make and care about. Take a look around.</p>
    <h2>A few places I've been</h2>
    <ol class="shelf-timeline">{resume.experience.map(e => <li key={e.org}>
      <span>{e.period}</span><h3>{e.title}</h3><p>{e.org}</p>
    </li>)}</ol>
    <a class="shelf-text-link" href={resume.pdfUrl} target="_blank" rel="noopener noreferrer">Read my résumé <span aria-hidden="true">↗</span></a>
  </>;
  if (section === 'projects') return <>
    <p class="shelf-lead">A few things I've helped bring to life.</p>
    <div class="shelf-projects">{projects.map((p, i) => <article key={p.id}>
      <span class="shelf-project-number">0{i + 1}</span><h2>{p.name}</h2>
      <p>{p.description}</p><p class="shelf-project-stack">{p.tags.join(' · ')}</p>
      {p.url && <a class="shelf-text-link" href={p.url} target="_blank" rel="noopener noreferrer">{p.url.includes('github.com') ? 'Explore the code' : 'Visit the project'} <span aria-hidden="true">↗</span></a>}
    </article>)}</div>
  </>;
  if (section === 'interests') return <>
    <p class="shelf-lead">There's a little more to me than what's on my résumé.</p>
    <div class="shelf-interest"><span aria-hidden="true">01</span><h2>Cubing</h2><p>A Rubik's cube earns a place on the shelf.</p></div>
    <div class="shelf-interest"><span aria-hidden="true">02</span><h2>Tennis</h2><p>Something for when it's time to step away from the screen.</p></div>
    <div class="shelf-interest"><span aria-hidden="true">03</span><h2>Collecting Smiskis</h2><p>The little green figures that started the idea for this website.</p></div>
  </>;
  return <>
    <p class="shelf-lead">There's always room for a conversation.</p>
    <p>If you'd like to talk about a project, work together, or just say hello, here's where to find me.</p>
    <div class="shelf-contact-list">{channels.map(c => <a href={c.url} key={c.label} {...(c.label === 'email' ? {} : {target:'_blank', rel:'noopener noreferrer'})}>
      <span>{c.label}</span><strong>{c.value}</strong><span aria-hidden="true">↗</span>
    </a>)}</div>
  </>;
}

export default function ShelfExperience() {
  const [active, setActive] = useState<SectionId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [panMode, setPanMode] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const [hovered, setHovered] = useState<SectionId | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const exploreButton = useRef<HTMLButtonElement>(null);
  const controller = useRef<ShelfController | null>(null);
  const selection = useRef<SectionId | null>(null);

  function navigate(section: SectionId | null) {
    const next = `${window.location.pathname}${window.location.search}${section ? `#${section}` : ''}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, '', next);
    setActive(section);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onRoute = () => { setActive(readSection()); setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (selection.current) navigate(null); else setMenuOpen(false); }
    };
    onRoute();
    window.addEventListener('popstate', onRoute);
    window.addEventListener('hashchange', onRoute);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onRoute);
      window.removeEventListener('hashchange', onRoute);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const initialization = new AbortController();
    import('./scene').then(async ({ createShelf }) => {
      if (initialization.signal.aborted || !stage.current) return;
      const shelf = await createShelf(stage.current, navigate, setHovered, initialization.signal);
      if (initialization.signal.aborted) {
        shelf.dispose();
        return;
      }
      controller.current = shelf;
      shelf.focus(selection.current, true);
      setStatus('ready');
    }).catch(error => {
      if (initialization.signal.aborted) return;
      console.error('Shelf could not load:', error);
      setStatus('fallback');
      setMenuOpen(true);
    });
    return () => {
      initialization.abort();
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  useEffect(() => {
    const previous = selection.current;
    selection.current = active;
    controller.current?.focus(active);
    if (active) panelHeading.current?.focus({ preventScroll: true });
    else if (previous) exploreButton.current?.focus({ preventScroll: true });
  }, [active]);

  const selected = sections.find(s => s.id === active);
  return <div class={`shelf-experience${active ? ' has-selection' : ''}${dimmed ? ' is-dimmed' : ''}`} data-status={status}>
    <h1 class="shelf-sr-only">Caleb Li: a shelf of things I make and care about</h1>
    <div ref={stage} class="shelf-stage" data-hovered={hovered ?? ''} data-pan-mode={panMode}>
      <div class="shelf-vignette" aria-hidden="true" />
      <div class="shelf-hotspots" aria-label="Explore the shelf">
        {sections.map(s => <button key={s.id} type="button" data-hotspot={s.id}
          class="shelf-hotspot" aria-label={`Explore ${s.label}: ${s.object.toLowerCase()}`}
          onClick={() => navigate(s.id)} onFocus={() => setHovered(s.id)} onBlur={() => setHovered(null)} disabled={!!active || status !== 'ready'}>
          <span class="shelf-hotspot-dot" aria-hidden="true" /><span class="shelf-hotspot-label">{s.label}</span>
        </button>)}
      </div>
    </div>

    {status === 'fallback' && <div class="shelf-fallback"><p class="shelf-eyebrow">A little collection</p><h2>Welcome to my shelf.</h2><p>The 3D scene couldn't open on this device. You can still explore everything below.</p>
      <nav aria-label="Shelf sections">{sections.map(s => <button type="button" onClick={() => navigate(s.id)}>{s.label} <span aria-hidden="true">↗</span></button>)}</nav>
    </div>}

    {!active && <footer class="shelf-tools">
      <div class="shelf-menu-wrap">
        {menuOpen && <nav class="shelf-menu" id="shelf-navigation" aria-label="Sections">{sections.map(s => <button key={s.id} type="button" onClick={() => navigate(s.id)}><span>{s.number}</span><span>{s.label}</span><span aria-hidden="true">↗</span></button>)}</nav>}
        <button ref={exploreButton} type="button" class="shelf-explore-button" aria-expanded={menuOpen} aria-controls="shelf-navigation" onClick={() => setMenuOpen(!menuOpen)}><span class="shelf-menu-icon" aria-hidden="true">{menuOpen ? '−' : '+'}</span> Explore</button>
      </div>
      <p class="shelf-instructions" aria-live="polite">
        {status === 'loading' && 'Setting things in place…'}
        {status === 'ready' && <>
          <span class="shelf-mouse-instructions">{panMode ? 'Drag to pan · Scroll to zoom' : 'Drag to rotate · Shift-drag to pan · Scroll to zoom'}</span>
          <span class="shelf-touch-instructions">{panMode ? 'Drag to pan · Pinch to zoom' : 'Drag to rotate · Two fingers to pan · Pinch to zoom'}</span>
        </>}
      </p>
      <div class="shelf-camera-tools">
        <button type="button" class="shelf-pan-button" disabled={status !== 'ready'} aria-label="Pan view" aria-pressed={panMode} title="Drag to pan"
          onClick={() => { controller.current?.setPanMode(!panMode); setPanMode(!panMode); }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>
          </svg>
          Pan
        </button>
        <button type="button" onClick={() => controller.current?.focus(null)} disabled={status !== 'ready'} aria-label="Reset shelf view" title="Reset view">↺</button>
        <button type="button" disabled={status !== 'ready'} aria-label={dimmed ? 'Turn up the lights' : 'Dim the lights'} aria-pressed={dimmed} title={dimmed ? 'Warm light' : 'Evening light'} onClick={() => { controller.current?.setDimmed(!dimmed); setDimmed(!dimmed); }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
        </button>
      </div>
    </footer>}

    {active && selected && <aside class="shelf-reading" aria-labelledby="shelf-section-title">
      <header class="shelf-reading-header"><button type="button" class="shelf-back" onClick={() => navigate(null)}><span aria-hidden="true">←</span> Back to shelf</button><span>{selected.number} / 04</span></header>
      <nav class="shelf-section-nav" aria-label="Sections">{sections.map(s => <button key={s.id} type="button" aria-current={s.id === active ? 'page' : undefined} onClick={() => navigate(s.id)}>{s.id === 'about' ? 'About' : s.id === 'projects' ? 'Projects' : s.id === 'interests' ? 'Interests' : 'Contact'}</button>)}</nav>
      <div class="shelf-reading-scroll" key={active}><p class="shelf-eyebrow">{selected.object}</p><h2 id="shelf-section-title" ref={panelHeading} tabIndex={-1}>{selected.label}</h2><SectionContent section={active}/><p class="shelf-reading-end">A little piece of my world.</p></div>
    </aside>}
  </div>;
}
