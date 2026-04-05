import type { CommandHandler } from './types';

export const themeCmd: CommandHandler = ({ args }) => {
  const root = document.documentElement;
  const current: string =
    root.dataset.theme ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const requested = args[0]?.toLowerCase();

  if (requested && requested !== 'dark' && requested !== 'light') {
    return {
      nodes: [
        { type: 'text', content: `Unknown theme: ${requested}`, style: 'error' },
        { type: 'text', content: 'Usage: theme [dark|light]', style: 'dim' },
      ],
    };
  }

  const next: 'dark' | 'light' = (requested as 'dark' | 'light') ?? (current === 'dark' ? 'light' : 'dark');

  root.dataset.theme = next;
  localStorage.setItem('theme', next);

  return {
    nodes: [
      { type: 'text', content: `Switched to ${next} mode.`, style: 'success' },
      { type: 'text', content: 'Usage: theme [dark|light]', style: 'dim' },
    ],
  };
};
