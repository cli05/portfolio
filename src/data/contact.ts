export interface ContactChannel {
  label: string;
  value: string;
  url?: string;
}

export const channels: ContactChannel[] = [
  { label: 'email',    value: 'caleb.jesseli@gmail.com',             url: 'mailto:caleb.jesseli@gmail.com' },
  { label: 'github',   value: 'github.com/cli05',            url: 'https://github.com/cli05' },
  { label: 'linkedin', value: 'linkedin.com/in/caleb-j-li/',       url: 'https://www.linkedin.com/in/caleb-j-li/' },
];
