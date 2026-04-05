export interface ContactChannel {
  label: string;
  value: string;
  url?: string;
}

export const channels: ContactChannel[] = [
  { label: 'email',    value: 'caleb@example.com',             url: 'mailto:caleb@example.com' },
  { label: 'github',   value: 'github.com/calebli',            url: 'https://github.com/calebli' },
  { label: 'linkedin', value: 'linkedin.com/in/calebli',       url: 'https://linkedin.com/in/calebli' },
];
