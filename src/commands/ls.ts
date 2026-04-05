import type { CommandHandler } from './types';

export const ls: CommandHandler = ({ allCommands }) => ({
  nodes: [
    {
      type: 'pre',
      content: allCommands
        .filter(c => !['banner'].includes(c))
        .map(c => c.padEnd(12))
        .reduce((acc, cmd, i) => {
          if (i % 4 === 0 && i > 0) return acc + '\n' + cmd;
          return acc + cmd;
        }, ''),
    },
  ],
});
