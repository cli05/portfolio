import type { OutputNode } from '../commands/types';

interface Props {
  nodes: OutputNode[];
  onCommand?: (cmd: string) => void;
}

const styleClass: Record<string, string> = {
  dim:     'text-terminal-dim',
  success: 'text-terminal-amber',
  error:   'text-terminal-red',
  accent:  'text-terminal-amber font-bold',
  bright:  'text-terminal-bright font-bold',
};

function Node({ node, onCommand }: { node: OutputNode; onCommand?: (cmd: string) => void }) {
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

    case 'command_link': {
      const clickable = node.command && onCommand;
      return (
        <div class="grid gap-x-4" style="grid-template-columns: max-content 1fr;">
          {clickable ? (
            <button
              type="button"
              class="text-terminal-bright font-bold text-left hover:text-terminal-amber hover:underline underline-offset-2 transition-colors cursor-pointer"
              onClick={() => onCommand!(node.command)}
            >
              {node.label}
            </button>
          ) : (
            <span class="text-terminal-bright font-bold">{node.label}</span>
          )}
          {node.description && (
            <span class="text-terminal-dim">{node.description}</span>
          )}
        </div>
      );
    }

    case 'section':
      return (
        <div class="mb-2">
          <div class="text-terminal-amber font-bold leading-relaxed">{node.title}</div>
          <div class="pl-4">
            {node.items.map((item, i) => <Node key={i} node={item} onCommand={onCommand} />)}
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

export default function OutputRenderer({ nodes, onCommand }: Props) {
  return (
    <div class="py-1">
      {nodes.map((node, i) => <Node key={i} node={node} onCommand={onCommand} />)}
    </div>
  );
}
