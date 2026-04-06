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
    { period: '2023–present', title: 'Senior Software Engineer', org: 'Acme Corp' },
    { period: '2021–2023',    title: 'Software Engineer',        org: 'Startup Inc' },
    { period: '2019–2021',    title: 'Junior Engineer',          org: 'Agency Co' },
  ],
  education: [
    { period: '2015–2019', title: 'B.S. Computer Science', org: 'University of California, Berkeley' },
  ],
  pdfUrl: '/resume.pdf',
};
