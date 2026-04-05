import type { CommandHandler } from './types';

export const clear: CommandHandler = () => ({
  nodes: [],
  clear: true,
});
