import type { CommandHandler } from './types';

export const dateCmd: CommandHandler = () => {
  const now = new Date();
  return {
    nodes: [
      { type: 'text', content: now.toDateString() + '  ' + now.toLocaleTimeString() },
    ],
  };
};
