export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url?: string;
  highlight?: boolean;
}

export const projects: Project[] = [
  {
    id: 'tidal',
    name: 'Tidal',
    description: 'A distributed task queue built in Rust with Redis-backed persistence. Supports retries, dead-letter queues, and priority scheduling.',
    tags: ['Rust', 'Redis', 'Distributed Systems'],
    url: 'https://github.com/calebli/tidal',
    highlight: true,
  },
  {
    id: 'glance',
    name: 'Glance',
    description: 'A minimal analytics dashboard for indie developers. Single-page app with real-time event streaming over SSE.',
    tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    url: 'https://github.com/calebli/glance',
    highlight: true,
  },
  {
    id: 'forma',
    name: 'Forma',
    description: 'Schema-driven form builder with validation, conditional fields, and multi-step flows. Zero runtime dependencies.',
    tags: ['TypeScript', 'Preact'],
    url: 'https://github.com/calebli/forma',
    highlight: false,
  },
  {
    id: 'dotfiles',
    name: 'dotfiles',
    description: 'My personal Nix-based dotfiles managing Neovim, tmux, fish shell, and macOS system config declaratively.',
    tags: ['Nix', 'Neovim', 'Shell'],
    url: 'https://github.com/calebli/dotfiles',
    highlight: false,
  },
];
