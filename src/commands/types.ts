export type OutputNode =
  | { type: 'heading'; content: string }
  | { type: 'text'; content: string; style?: 'dim' | 'success' | 'error' | 'accent' | 'bright' }
  | { type: 'link'; label: string; href: string }
  | { type: 'command_link'; label: string; command: string; description?: string }
  | { type: 'section'; title: string; items: OutputNode[] }
  | { type: 'table'; rows: [string, string][] }
  | { type: 'pre'; content: string }
  | { type: 'blank' };

export interface CommandResult {
  nodes: OutputNode[];
  /** If true, Terminal clears history after executing this command */
  clear?: boolean;
}

export interface CommandContext {
  args: string[];
  allCommands: string[];
}

export type CommandHandler = (ctx: CommandContext) => CommandResult;
