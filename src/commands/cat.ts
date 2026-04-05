import type { CommandHandler } from './types';

const COMMAND_HELP: Record<string, string> = {
  help:     'Show all available commands.',
  about:    'Display bio, role, and social links.',
  skills:   'List tech stack grouped by category.',
  projects: 'List projects. Use `projects <id>` for details.',
  contact:  'Show contact channels.',
  resume:   'View resume summary and PDF download link.',
  whoami:   'One-line identity.',
  date:     'Print current date and time.',
  ls:       'List commands like directory entries.',
  cat:      'Usage: cat <command>  —  show help for a command.',
  clear:    'Clear the terminal history.',
  banner:   'Display the ASCII art welcome banner.',
};

export const cat: CommandHandler = ({ args, allCommands }) => {
  if (!args[0]) {
    return {
      nodes: [
        { type: 'text', content: 'Usage: cat <command>', style: 'error' },
        { type: 'blank' },
        { type: 'text', content: `Available: ${allCommands.join(', ')}`, style: 'dim' },
      ],
    };
  }
  const help = COMMAND_HELP[args[0]];
  if (!help) {
    return {
      nodes: [
        { type: 'text', content: `cat: ${args[0]}: no such command`, style: 'error' },
      ],
    };
  }
  return {
    nodes: [
      { type: 'text', content: args[0], style: 'bright' },
      { type: 'text', content: help },
    ],
  };
};
