import type { CommandHandler } from './types';
import { bio, links, role, location } from '../data/about';

export const about: CommandHandler = () => ({
  nodes: [
    { type: 'text',  content: `${role}  ·  ${location}`, style: 'accent' },
    { type: 'blank' },
    ...bio.map(p => ({ type: 'text' as const, content: p })),
    { type: 'blank' },
    { type: 'text',  content: 'Links:', style: 'dim' },
    ...links.map(l => ({ type: 'link' as const, label: l.label, href: l.url })),
  ],
});
