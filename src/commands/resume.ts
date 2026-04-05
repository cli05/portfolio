import type { CommandHandler } from './types';

export const resume: CommandHandler = () => ({
  nodes: [
    { type: 'text',  content: 'Resume', style: 'accent' },
    { type: 'blank' },
    { type: 'text',  content: 'Experience:', style: 'bright' },
    { type: 'table', rows: [
      ['2023–present', 'Senior Software Engineer  ·  Acme Corp'],
      ['2021–2023',    'Software Engineer  ·  Startup Inc'],
      ['2019–2021',    'Junior Engineer  ·  Agency Co'],
    ]},
    { type: 'blank' },
    { type: 'text',  content: 'Education:', style: 'bright' },
    { type: 'table', rows: [
      ['2015–2019', 'B.S. Computer Science  ·  University of California, Berkeley'],
    ]},
    { type: 'blank' },
    { type: 'link',  label: 'Download PDF resume', href: '/resume.pdf' },
  ],
});
