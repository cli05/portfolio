import type { CommandHandler } from './types';
import { name, role, location } from '../data/about';

export const whoami: CommandHandler = () => ({
  nodes: [
    { type: 'text', content: name, style: 'bright' },
    { type: 'text', content: role, style: 'accent' },
    { type: 'text', content: location, style: 'dim' },
  ],
});
