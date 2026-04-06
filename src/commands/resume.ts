import type { CommandHandler } from './types';
import { resume as resumeData } from '../data/resume';

export const resume: CommandHandler = () => ({
  nodes: [
    { type: 'text',  content: 'Resume', style: 'accent' },
    { type: 'blank' },
    { type: 'text',  content: 'Experience:', style: 'bright' },
    { type: 'table', rows: resumeData.experience.map(e => [e.period, `${e.title}  ·  ${e.org}`]) },
    { type: 'blank' },
    { type: 'text',  content: 'Education:', style: 'bright' },
    { type: 'table', rows: resumeData.education.map(e => [e.period, `${e.title}  ·  ${e.org}`]) },
    { type: 'blank' },
    ...(resumeData.pdfUrl ? [{ type: 'link' as const, label: 'Download PDF resume', href: resumeData.pdfUrl }] : []),
  ],
});
