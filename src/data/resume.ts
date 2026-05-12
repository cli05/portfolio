export interface ResumeEntry {
  period: string;
  title: string;
  org: string;
}

export interface Resume {
  experience: ResumeEntry[];
  education: ResumeEntry[];
  pdfUrl?: string;
}

export const resume: Resume = {
  experience: [
    { period: 'May 2026 – Aug 2026',  title: 'Software Engineer Intern',          org: 'Visa · Highlands Ranch, CO' },
    { period: 'Jan 2026 – Present',   title: 'Undergraduate Teaching Assistant',  org: 'Purdue CS · West Lafayette, IN' },
    { period: 'Oct 2025 – Present',   title: 'Software Developer',                org: 'Volunteer Partnerships for West Africa · West Lafayette, IN' },
    { period: 'Sep 2025 – Present',   title: 'AI Research Engineer',              org: 'Captain (YC\'W26) · West Lafayette, IN' },
    { period: 'Jun 2025 – Aug 2025',  title: 'Software Engineer Intern',          org: 'Tencent Americas · Palo Alto, CA' },
  ],
  education: [
    { period: 'May 2027', title: 'B.S. Computer Science & Mathematics', org: 'Purdue University · West Lafayette, IN' },
  ],
  pdfUrl: '/Caleb-JLi-Resume.pdf',
};
