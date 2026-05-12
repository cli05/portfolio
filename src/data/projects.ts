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
    id: 'pyrotech',
    name: 'PyroTech',
    description: 'Real-time wildfire incident command simulation platform with a physics-informed spread engine (72-sector elliptical perimeters per tick) and a multi-agent orchestration layer of specialized Google Gemini 2.5 Flash agents for fire behavior, evacuation, and resource coordination.',
    tags: ['TypeScript', 'Next.js', 'React', 'Node.js', 'Google Gemini', 'Agent Orchestration'],
    url: 'https://github.com/alexyan06/Pyro_Tech',
    highlight: true,
  },
  {
    id: 're-dub',
    name: 're-dub',
    description: 'Automated video translation and lip-syncing web app achieving 33% lower compute cost vs. industry benchmarks. End-to-end pipeline on Modal with Whisper large-v3, Llama-3.3-70b, Coqui-XTTS, and MuseTalk; speaker-adaptive PyTorch pipeline improves voice cloning similarity by 15–20%.',
    tags: ['Python', 'React', 'FastAPI', 'Modal', 'PyTorch', 'Cloudflare R2/D1'],
    url: 'https://github.com/cli05/re-dub',
    highlight: true,
  },
  {
    id: 'deepquery',
    name: 'DeepQuery (Captain YC\'W26)',
    description: 'Full-stack RAG evaluation platform benchmarking VanillaRAG, RerankerRAG, Fusion/Iterative Retrieval, and Elasticsearch. Scalable data pipeline processing 1000+ Arxiv papers and a 23M-word Wikipedia dataset; LLM-as-a-Judge evaluation on multiple hosted datasets.',
    tags: ['Next.js', 'React', 'FastAPI', 'RAG', 'LangChain', 'Railway'],
    url: 'https://deepquery.org',
    highlight: false,
  },
  {
    id: 'vpwa-lms',
    name: 'VPWA Learning Management System',
    description: 'Full-stack LMS serving 200+ students in Ghana. RESTful API built with Node.js and Express; React frontend with custom admin dashboards, student/teacher views, and submission windows; JWT-based role access control.',
    tags: ['React', 'Node.js', 'Express', 'JWT'],
    highlight: false,
  },
];
