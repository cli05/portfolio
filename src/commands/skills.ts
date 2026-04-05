import type { CommandHandler } from './types';
import { skills } from '../data/skills';

export const skillsCmd: CommandHandler = () => ({
  nodes: [
    { type: 'text', content: 'Skills & tech stack:', style: 'accent' },
    { type: 'blank' },
    ...skills.flatMap(category => [
      {
        type: 'section' as const,
        title: category.name,
        items: [{ type: 'text' as const, content: category.items.join('  ·  '), style: 'dim' as const }],
      },
    ]),
  ],
});
