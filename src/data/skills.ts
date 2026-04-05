export interface SkillCategory {
  name: string;
  items: string[];
}

export const skills: SkillCategory[] = [
  {
    name: 'Languages',
    items: ['TypeScript', 'Python', 'Rust', 'Go', 'SQL'],
  },
  {
    name: 'Frontend',
    items: ['React', 'Preact', 'Astro', 'Tailwind CSS', 'HTML/CSS'],
  },
  {
    name: 'Backend',
    items: ['Node.js', 'FastAPI', 'PostgreSQL', 'Redis', 'REST', 'GraphQL'],
  },
  {
    name: 'Infrastructure',
    items: ['Docker', 'GitHub Actions', 'AWS', 'Vercel', 'Linux'],
  },
  {
    name: 'Tools',
    items: ['Git', 'Neovim', 'tmux', 'Nix', 'Figma'],
  },
];
