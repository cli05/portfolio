import type { CommandHandler } from './types';

const ASCII_ART = `  ██████╗ █████╗ ██╗     ███████╗██████╗
 ██╔════╝██╔══██╗██║     ██╔════╝██╔══██╗
 ██║     ███████║██║     █████╗  ██████╔╝
 ██║     ██╔══██║██║     ██╔══╝  ██╔══██╗
 ╚██████╗██║  ██║███████╗███████╗██████╔╝
  ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝`;

// const ASCII_ART = `
//         _..---.--.
//    .'\ __|/O.__)
//   /__.' _/ .-'_\
//  (____.'.-_\____) 
//   (_/ _)__(_ \_)\_
// mrf(_..)--(.._)'--'`.trimStart();

export const banner: CommandHandler = () => ({
  nodes: [
    { type: 'pre',   content: ASCII_ART },
    { type: 'blank' },
    { type: 'text',  content: 'Caleb Li  —  Software Engineer', style: 'bright' },
    { type: 'text',  content: 'San Francisco, CA', style: 'dim' },
    { type: 'blank' },
    { type: 'text',  content: "Type 'help' to see available commands.", style: 'dim' },
    { type: 'blank' },
  ],
});
