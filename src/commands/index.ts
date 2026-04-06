import type { CommandHandler } from './types';
import { banner }      from './banner';
import { help }        from './help';
import { about }       from './about';
import { skillsCmd }   from './skills';
import { projectsCmd } from './projects';
import { contact }     from './contact';
import { resume }      from './resume';
import { clear }       from './clear';
import { whoami }      from './whoami';
import { dateCmd }     from './date';
import { ls }          from './ls';
import { cat }         from './cat';
import { themeCmd }    from './theme';
import { turtleCmd }   from './turtle';

export const commands: Record<string, CommandHandler> = {
  banner,
  help,
  about,
  skills:   skillsCmd,
  projects: projectsCmd,
  contact,
  resume,
  clear,
  whoami,
  date:     dateCmd,
  ls,
  cat,
  theme: themeCmd,
  turtle: turtleCmd,
};

export const commandNames = Object.keys(commands).filter(k => !['banner', 'turtle'].includes(k));
