/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:      'var(--color-bg)',
          surface: 'var(--color-surface)',
          amber:   'var(--color-amber)',
          bright:  'var(--color-bright)',
          dim:     'var(--color-dim)',
          white:   'var(--color-white)',
          red:     'var(--color-red)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
