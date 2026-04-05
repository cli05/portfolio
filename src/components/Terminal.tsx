import { useReducer, useEffect, useRef } from 'preact/hooks';
import type { OutputNode } from '../commands/types';
import { commands, commandNames } from '../commands/index';
import TerminalLine, { type HistoryEntry } from './TerminalLine';

const PROMPT = 'caleb@portfolio:~$';

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  history: HistoryEntry[];
  inputValue: string;
  cmdHistory: string[];    // submitted commands for ↑/↓ navigation
  historyIndex: number;    // -1 = not navigating
}

type Action =
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SUBMIT' }
  | { type: 'HISTORY_UP' }
  | { type: 'HISTORY_DOWN' }
  | { type: 'TAB_COMPLETE' }
  | { type: 'CLEAR' }
  | { type: 'BOOT' };

function runCommand(raw: string): { nodes: OutputNode[]; clear?: boolean } {
  const parts = raw.trim().split(/\s+/);
  const name  = parts[0]!.toLowerCase();
  const args  = parts.slice(1);
  const handler = commands[name];
  if (!handler) {
    return {
      nodes: [
        { type: 'text', content: `command not found: ${name}`, style: 'error' },
        { type: 'text', content: "Type 'help' for available commands.", style: 'dim' },
      ],
    };
  }
  return handler({ args, allCommands: commandNames });
}

function newEntry(overrides: Partial<HistoryEntry> & { kind: HistoryEntry['kind'] }): HistoryEntry {
  return { id: crypto.randomUUID(), ...overrides } as HistoryEntry;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {

    case 'BOOT': {
      const result = commands.banner!({ args: [], allCommands: commandNames });
      return {
        ...state,
        history: [newEntry({ kind: 'output', nodes: result.nodes })],
      };
    }

    case 'SET_INPUT':
      return { ...state, inputValue: action.value, historyIndex: -1 };

    case 'HISTORY_UP': {
      if (state.cmdHistory.length === 0) return state;
      const nextIndex = state.historyIndex === -1
        ? state.cmdHistory.length - 1
        : Math.max(0, state.historyIndex - 1);
      return {
        ...state,
        historyIndex: nextIndex,
        inputValue: state.cmdHistory[nextIndex] ?? '',
      };
    }

    case 'HISTORY_DOWN': {
      if (state.historyIndex === -1) return state;
      const nextIndex = state.historyIndex + 1;
      if (nextIndex >= state.cmdHistory.length) {
        return { ...state, historyIndex: -1, inputValue: '' };
      }
      return { ...state, historyIndex: nextIndex, inputValue: state.cmdHistory[nextIndex] ?? '' };
    }

    case 'TAB_COMPLETE': {
      const val = state.inputValue;
      const tokens = val.split(' ');
      if (tokens.length === 1) {
        // Complete command name
        const prefix = tokens[0]!.toLowerCase();
        const matches = commandNames.filter(c => c.startsWith(prefix));
        if (matches.length === 1) {
          return { ...state, inputValue: matches[0]! };
        }
        if (matches.length > 1) {
          // Show candidates as output, don't change input
          const candidateEntry = newEntry({
            kind: 'output',
            nodes: [{ type: 'pre', content: matches.join('  ') }],
          });
          return { ...state, history: [...state.history, candidateEntry] };
        }
      }
      return state;
    }

    case 'SUBMIT': {
      const raw = state.inputValue.trim();
      if (!raw) return { ...state, inputValue: '' };

      const cmdEntry = newEntry({ kind: 'command', prompt: PROMPT, command: raw });
      const result = runCommand(raw);

      const newCmdHistory = [...state.cmdHistory, raw];

      if (result.clear) {
        return {
          ...state,
          history: [],
          inputValue: '',
          cmdHistory: newCmdHistory,
          historyIndex: -1,
        };
      }

      const outEntry = newEntry({ kind: 'output', nodes: result.nodes });
      return {
        ...state,
        history: [...state.history, cmdEntry, outEntry],
        inputValue: '',
        cmdHistory: newCmdHistory,
        historyIndex: -1,
      };
    }

    case 'CLEAR':
      return { ...state, history: [], inputValue: '' };

    default:
      return state;
  }
}

const initialState: State = {
  history: [],
  inputValue: '',
  cmdHistory: [],
  historyIndex: -1,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Terminal() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const inputRef  = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Boot banner
  useEffect(() => {
    dispatch({ type: 'BOOT' });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.history]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      dispatch({ type: 'SUBMIT' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dispatch({ type: 'HISTORY_UP' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      dispatch({ type: 'HISTORY_DOWN' });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      dispatch({ type: 'TAB_COMPLETE' });
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      dispatch({ type: 'CLEAR' });
    }
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  // add max-w-5xl mx-auto in first class component to make it center
  return (
    <div
      class="flex flex-col h-screen w-full px-4 py-6 cursor-text"
      onClick={focusInput}
    >
      {/* Output history */}
      <div
        class="flex-1 overflow-y-auto pb-4 select-text"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="terminal output"
      >
        {state.history.map(entry => (
          <TerminalLine key={entry.id} entry={entry} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input line */}
      <div class="flex items-center gap-2 border-t-2 border-terminal-amber pt-3 shrink-0">
        <span class="text-terminal-amber shrink-0 select-none">{PROMPT}</span>
        <div class="relative flex-1">
          {/* Visible typed text + blinking cursor */}
          <div class="text-terminal-bright pointer-events-none leading-relaxed">
            {state.inputValue}
            <span class="inline-block w-2 h-5 bg-terminal-amber align-middle ml-px animate-blink" />
          </div>
          {/* Real (invisible) input for keyboard capture */}
          <input
            ref={inputRef}
            value={state.inputValue}
            onInput={e => dispatch({ type: 'SET_INPUT', value: (e.target as HTMLInputElement).value })}
            onKeyDown={handleKeyDown}
            class="absolute inset-0 w-full opacity-0 cursor-default"
            aria-label="terminal input"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck={false}
          />
        </div>
      </div>
    </div>
  );
}
