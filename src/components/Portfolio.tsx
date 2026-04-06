import { name, role, location, bio, links } from '../data/about';
import { skills } from '../data/skills';
import { projects } from '../data/projects';
import { channels } from '../data/contact';
import { resume } from '../data/resume';

interface Props {
  onOpenTerminal: () => void;
}

function Section({ id, title, children }: { id: string; title: string; children: any }) {
  return (
    <section id={id} class="py-16 border-b border-gray-200 last:border-b-0">
      <h2 class="text-xs font-bold tracking-widest uppercase text-gray-400 mb-8">{title}</h2>
      {children}
    </section>
  );
}

export default function Portfolio({ onOpenTerminal }: Props) {
  return (
    <div class="min-h-screen bg-white text-black font-mono">

      {/* Sticky nav */}
      <nav class="sticky top-0 bg-white border-b border-gray-200 z-30 py-3">
        <div class="max-w-3xl mx-auto px-6 flex justify-between items-center">
          <span class="font-bold text-sm">{name}</span>
          <div class="flex gap-6 text-sm text-gray-500">
            {['about', 'experience', 'projects', 'skills', 'contact'].map(s => (
              <a key={s} href={`#${s}`} class="hover:text-black transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </nav>

      <main class="max-w-3xl mx-auto px-6">

        {/* Hero / About */}
        <Section id="about" title="About">
          <div class="mb-6">
            <h1 class="text-4xl font-bold tracking-tight mb-1">{name}</h1>
            <p class="text-gray-500 text-sm">{role}  ·  {location}</p>
          </div>
          <div class="space-y-3 text-gray-700 leading-relaxed mb-8">
            {bio.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div class="flex gap-4">
            {links.map(l => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </Section>

        {/* Experience */}
        <Section id="experience" title="Experience">
          <div class="space-y-6 mb-10">
            {resume.experience.map((e, i) => (
              <div key={i} class="grid grid-cols-[10rem_1fr] gap-4">
                <span class="text-xs text-gray-400 pt-0.5">{e.period}</span>
                <div>
                  <p class="font-bold text-sm">{e.title}</p>
                  <p class="text-gray-500 text-sm">{e.org}</p>
                </div>
              </div>
            ))}
          </div>
          <h3 class="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6">Education</h3>
          <div class="space-y-6">
            {resume.education.map((e, i) => (
              <div key={i} class="grid grid-cols-[10rem_1fr] gap-4">
                <span class="text-xs text-gray-400 pt-0.5">{e.period}</span>
                <div>
                  <p class="font-bold text-sm">{e.title}</p>
                  <p class="text-gray-500 text-sm">{e.org}</p>
                </div>
              </div>
            ))}
          </div>
          {resume.pdfUrl && (
            <div class="mt-8">
              <a
                href={resume.pdfUrl}
                class="text-sm border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
              >
                Download PDF
              </a>
            </div>
          )}
        </Section>

        {/* Projects */}
        <Section id="projects" title="Projects">
          <div class="grid gap-4">
            {projects.map(p => (
              <div
                key={p.id}
                class={`border p-5 ${p.highlight ? 'border-black' : 'border-gray-200'}`}
              >
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-sm">{p.name}</h3>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-gray-400 hover:text-black transition-colors ml-4 shrink-0"
                    >
                      ↗ view
                    </a>
                  )}
                </div>
                <p class="text-gray-600 text-sm leading-relaxed mb-3">{p.description}</p>
                <div class="flex flex-wrap gap-1.5">
                  {p.tags.map(t => (
                    <span key={t} class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Skills */}
        <Section id="skills" title="Skills">
          <div class="space-y-5">
            {skills.map(cat => (
              <div key={cat.name} class="grid grid-cols-[8rem_1fr] gap-4 items-start">
                <span class="text-xs text-gray-400 pt-0.5">{cat.name}</span>
                <div class="flex flex-wrap gap-1.5">
                  {cat.items.map(item => (
                    <span key={item} class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact */}
        <Section id="contact" title="Contact">
          <div class="space-y-3">
            {channels.map(c => (
              <div key={c.label} class="flex items-center gap-4">
                <span class="text-xs text-gray-400 w-20 shrink-0">{c.label}</span>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm hover:underline underline-offset-2"
                  >
                    {c.value}
                  </a>
                ) : (
                  <span class="text-sm">{c.value}</span>
                )}
              </div>
            ))}
          </div>
        </Section>

      </main>

      {/* >_ terminal toggle button */}
      <button
        type="button"
        onClick={onOpenTerminal}
        class="fixed bottom-6 right-6 z-40 w-12 h-12 bg-black text-white font-mono text-sm border border-black hover:bg-white hover:text-black transition-colors flex items-center justify-center"
        aria-label="Open terminal"
        title="Open terminal"
      >
        &gt;_
      </button>

    </div>
  );
}
