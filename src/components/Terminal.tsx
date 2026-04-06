import { useReducer, useEffect, useRef } from 'preact/hooks';
import type { OutputNode } from '../commands/types';
import { commands, commandNames } from '../commands/index';
import TerminalLine, { type HistoryEntry } from './TerminalLine';
import OutputRenderer from './OutputRenderer';

const PROMPT = 'caleb@portfolio:~$';

const TURTLE_BG = `                             ___-------___
                          _-~~             ~~-_
                       _-~                    /~-_
    /^\\__/^\\         /~  \\                   /    \\
  /|  O|| O|        /      \\_______________/        \\
 | |___||__|      /       /                \\          \\
 |          \\    /      /                    \\          \\
 |   (_______) /______/                        \\_________ \\
 |         / /         \\                      /            \\
  \\         \\^\\\\         \\                  /               \\     /
    \\         ||           \\______________/      _-_       //\\__//
      \\       ||------_-~~-_ ------------- \\ --/~   ~\\    || __/
        ~-----||====/~     |==================|       |/~~~~~
         (_(__/  ./     /                    \\_\\      \\.
                (_(___/                         \\_____)_)`;

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
  | { type: 'EXECUTE'; command: string }
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

    case 'BOOT':
      return state;

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

    case 'EXECUTE': {
      const raw = action.command.trim();
      if (!raw) return state;
      const cmdEntry = newEntry({ kind: 'command', prompt: PROMPT, command: raw });
      const result = runCommand(raw);
      const newCmdHistory = [...state.cmdHistory, raw];
      if (result.clear) {
        return { ...state, history: [], inputValue: '', cmdHistory: newCmdHistory, historyIndex: -1 };
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

  // Restore saved theme preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.dataset.theme = saved;
    }
  }, []);

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
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  }

  function execute(cmd: string) {
    dispatch({ type: 'EXECUTE', command: cmd });
    inputRef.current?.focus();
  }

  const CHIPS = ['help', 'about', 'projects', 'skills', 'contact', 'resume'];

  // add/remove max-w-5xl mx-auto in first class component to make it center
  return (
    <div
      class="flex flex-col h-screen w-full max-w-5xl mx-auto px-4 py-6"
      onClick={focusInput}
    >
      {/* Background turtle watermark */}
      <div
        class="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none"
        style={{ zIndex: 1, opacity: 0.3 }}
        aria-hidden="true"
      >
        <pre
          class="text-terminal-amber font-mono"
          style={{ fontSize: '2.4vw', lineHeight: '1.4', margin: 0 }}
        >{TURTLE_BG}</pre>
      </div>
      {/* Persistent banner */}
      <div class="relative shrink-0" style={{ zIndex: 2 }}>
        <OutputRenderer nodes={commands.banner!({ args: [], allCommands: commandNames }).nodes} />
      </div>

      {/* Command chips */}
      <div class="relative flex flex-wrap gap-2 pb-3 shrink-0" style={{ zIndex: 2 }}>
        {CHIPS.map(cmd => (
          <button
            key={cmd}
            type="button"
            onClick={e => { e.stopPropagation(); execute(cmd); }}
            class="px-3 py-0.5 border border-terminal-amber text-terminal-amber bg-terminal-bg text-sm hover:bg-terminal-amber hover:text-terminal-bg transition-colors cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* History + inline input */}
      <div
        class="relative flex-1 overflow-y-auto pb-4 select-text"
        style={{ zIndex: 2 }}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="terminal output"
      >
        {state.history.map(entry => (
          <TerminalLine key={entry.id} entry={entry} onCommand={execute} />
        ))}

        {/* Inline input prompt */}
        <div class="flex items-center gap-2">
          <span class="text-terminal-amber shrink-0 select-none">{PROMPT}</span>
          <div class="relative flex-1">
            <div class="text-terminal-bright pointer-events-none leading-relaxed">
              {state.inputValue}
              <span class="inline-block w-2 h-5 bg-terminal-amber align-middle ml-px animate-blink" />
            </div>
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

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
