import type { CommandHandler, OutputNode } from './types';
import { projects } from '../data/projects';

export const projectsCmd: CommandHandler = ({ args }) => {
  if (args[0]) {
    const project = projects.find(p => p.id === args[0]);
    if (!project) {
      return {
        nodes: [
          { type: 'text', content: `project not found: ${args[0]}`, style: 'error' },
          { type: 'blank' },
          { type: 'text', content: `Available: ${projects.map(p => p.id).join(', ')}`, style: 'dim' },
        ],
      };
    }
    const rows: [string, string][] = [
      ['tags', project.tags.join(', ')],
    ];
    if (project.url) rows.push(['url', project.url]);

    const nodes: OutputNode[] = [
      { type: 'text',  content: project.name, style: 'bright' },
      { type: 'blank' },
      { type: 'text',  content: project.description },
      { type: 'blank' },
      { type: 'table', rows },
    ];
    if (project.url) {
      nodes.push({ type: 'blank' });
      nodes.push({ type: 'link', label: 'View on GitHub', href: project.url });
    }
    return { nodes };
  }

  // List all
  return {
    nodes: [
      { type: 'text', content: 'Projects:', style: 'accent' },
      { type: 'blank' },
      ...projects.flatMap(p => [
        {
          type: 'section' as const,
          title: p.id,
          items: [
            { type: 'text' as const, content: p.name, style: 'bright' as const },
            { type: 'text' as const, content: p.description },
            { type: 'text' as const, content: p.tags.join('  ·  '), style: 'dim' as const },
          ],
        },
      ]),
      { type: 'blank' },
      { type: 'text', content: "Run 'projects <id>' for details.", style: 'dim' },
    ],
  };
};
