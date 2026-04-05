import type { OutputNode } from '../commands/types';
import OutputRenderer from './OutputRenderer';

export interface HistoryEntry {
  id: string;
  kind: 'command' | 'output';
  prompt?: string;
  command?: string;
  nodes?: OutputNode[];
}

interface Props {
  entry: HistoryEntry;
  onCommand?: (cmd: string) => void;
}

export default function TerminalLine({ entry, onCommand }: Props) {
  if (entry.kind === 'command') {
    return (
      <div class="flex items-start gap-2 leading-relaxed select-text">
        <span class="text-terminal-amber shrink-0">{entry.prompt ?? 'guest@portfolio:~$'}</span>
        <span class="text-terminal-bright">{entry.command}</span>
      </div>
    );
  }

  if (entry.nodes && entry.nodes.length > 0) {
    return <OutputRenderer nodes={entry.nodes} onCommand={onCommand} />;
  }

  return null;
}
