export interface SkillCategory {
  name: string;
  items: string[];
}

export const skills: SkillCategory[] = [
  {
    name: 'Languages',
    items: ['Python', 'TypeScript', 'Java', 'C++', 'C', 'HTML/CSS', 'CUDA', 'Triton', 'LaTeX'],
  },
  {
    name: 'Frontend',
    items: ['React', 'Next.js', 'Astro', 'Tailwind CSS'],
  },
  {
    name: 'Backend',
    items: ['Node.js', 'Express', 'FastAPI', 'Flask', 'MongoDB', 'Redis', 'REST', 'JWT'],
  },
  {
    name: 'AI / ML',
    items: ['PyTorch', 'TensorFlow', 'Keras', 'scikit-learn', 'LangChain/Graph', 'RAG', 'Agents', 'MCP', 'GenAI', 'Prompt Engineering'],
  },
  {
    name: 'Data',
    items: ['pandas', 'NumPy', 'Matplotlib', 'Elasticsearch'],
  },
  {
    name: 'Infrastructure',
    items: ['Docker', 'Railway', 'Modal', 'Cloudflare', 'Celery', 'Gunicorn', 'n8n'],
  },
];
