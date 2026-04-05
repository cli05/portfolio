import type { CommandHandler } from './types';

const COMMANDS: [string, string][] = [
  ['help',          'Show this help message'],
  ['about',         'About me'],
  ['skills',        'Tech stack and skills'],
  ['projects',      'List my projects'],
  ['projects <id>', 'View a specific project'],
  ['contact',       'How to reach me'],
  ['resume',        'View resume summary and download link'],
  ['whoami',        'Who is this person'],
  ['date',          'Current date and time'],
  ['ls',            'List available commands'],
  ['cat <cmd>',     'Show help for a specific command'],
  ['clear',         'Clear the terminal'],
  ['banner',        'Show the welcome banner'],
];

export const help: CommandHandler = () => ({
  nodes: [
    { type: 'text', content: 'Available commands:', style: 'accent' },
    { type: 'blank' },
    ...COMMANDS.map(([cmd, desc]) => ({
      type: 'command_link' as const,
      label: cmd,
      command: cmd.includes(' ') ? '' : cmd, // don't auto-run parameterised commands
      description: desc,
    })),
    { type: 'blank' },
    { type: 'text', content: 'Tip: use ↑/↓ to navigate history, Tab to autocomplete.', style: 'dim' },
  ],
});
