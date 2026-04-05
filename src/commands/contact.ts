import type { CommandHandler, OutputNode } from './types';
import { channels } from '../data/contact';

export const contact: CommandHandler = () => {
  const nodes: OutputNode[] = [
    { type: 'text', content: 'Get in touch:', style: 'accent' },
    { type: 'blank' },
  ];
  for (const ch of channels) {
    if (ch.url) {
      nodes.push({ type: 'link', label: `${ch.label.padEnd(10)} ${ch.value}`, href: ch.url });
    } else {
      nodes.push({ type: 'text', content: `${ch.label.padEnd(10)} ${ch.value}` });
    }
  }
  return { nodes };
};
