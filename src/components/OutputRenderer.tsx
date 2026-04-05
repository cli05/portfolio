import type { OutputNode } from '../commands/types';

interface Props {
  nodes: OutputNode[];
}

const styleClass: Record<string, string> = {
  dim:     'text-terminal-dim',
  success: 'text-terminal-amber',
  error:   'text-terminal-red',
  accent:  'text-terminal-amber font-bold',
  bright:  'text-terminal-bright font-bold',
};

function Node({ node }: { node: OutputNode }) {
  switch (node.type) {
    case 'text':
      return (
        <div class={`leading-relaxed ${node.style ? styleClass[node.style] : 'text-terminal-white'}`}>
          {node.content}
        </div>
      );

    case 'link':
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          class="terminal-link leading-relaxed block"
        >
          {node.label}
        </a>
      );

    case 'section':
      return (
        <div class="mb-2">
          <div class="text-terminal-amber font-bold leading-relaxed">{node.title}</div>
          <div class="pl-4">
            {node.items.map((item, i) => <Node key={i} node={item} />)}
          </div>
        </div>
      );

    case 'table':
      return (
        <div class="grid gap-x-4 mb-1" style="grid-template-columns: max-content 1fr;">
          {node.rows.map(([key, val], i) => (
            <>
              <span key={`k-${i}`} class="text-terminal-dim">{key}</span>
              <span key={`v-${i}`} class="text-terminal-white">{val}</span>
            </>
          ))}
        </div>
      );

    case 'pre':
      return (
        <pre class="text-terminal-amber font-mono whitespace-pre leading-snug overflow-x-auto">
          {node.content}
        </pre>
      );

    case 'blank':
      return <div class="h-2" />;

    default:
      return null;
  }
}

export default function OutputRenderer({ nodes }: Props) {
  return (
    <div class="py-1">
      {nodes.map((node, i) => <Node key={i} node={node} />)}
    </div>
  );
}
