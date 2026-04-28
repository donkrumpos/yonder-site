/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // =================================================================
        // YONDER PALETTE — PLACEHOLDER (refine with Foggy)
        // Atmosphere: dark academia, cabinet of curiosities, handmade.
        // Current site uses near-black background with full-color project
        // cards. These tokens preserve that and give us names for the
        // accent colors that will emerge as the brand develops.
        // =================================================================

        // Ink — primary background (near-black, slightly warm)
        'yonder-ink': {
          50:  '#f4f3f0',
          100: '#e3e1db',
          200: '#c4c0b6',
          300: '#9d978a',
          400: '#777062',
          500: '#5a5447',
          600: '#403c33',
          700: '#2c2a24',
          800: '#1c1b18',
          900: '#0e0e0c',
          950: '#070705', // ← primary background
          DEFAULT: '#0e0e0c',
        },

        // Bone — primary text on dark background, warm off-white
        'yonder-bone': {
          50:  '#fbf9f4',
          100: '#f3efe3',
          200: '#e8e1d1', // ← primary text
          300: '#d4c8ad',
          400: '#bda988',
          500: '#a98e6a',
          600: '#8c7553',
          700: '#6f5e44',
          800: '#574a3a',
          900: '#473d31',
          950: '#262017',
          DEFAULT: '#e8e1d1',
        },

        // --- FLAT ACCENT TOKENS (TBD — refine when palette is decided) ---
        'yonder-brick':     '#8b3a2e', // warm dark accent (the building, the fire)
        'yonder-moss':      '#4a5d3e', // deep green (Wisconsin, natural materials)
        'yonder-brass':     '#b8945f', // metallic accent (cabinet hardware)
        'yonder-smoke':     '#5c4f5e', // muted plum-grey (atmosphere)
        'yonder-parchment': '#ede6da', // warm off-white for light sections
      },

      // =================================================================
      // YONDER TYPE SYSTEM — PLACEHOLDER
      // Pattern matches DCLT: sans for display/UI, serif for body/editorial.
      // Real fonts to be picked — candidates: IM Fell DW Pica, Cardo,
      // EB Garamond (serif); Söhne, Inter, or a hand-feel display face.
      // =================================================================

      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
        serif: [
          'Georgia',
          'Cambria',
          'serif',
        ],
        display: [
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },

      // Sharp corners by default (matches DCLT and the Yonder vitrine aesthetic)
      borderRadius: {
        'none': '0',
        'DEFAULT': '0',
        'sm': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        'full': '9999px',
      },
    },
  },
  plugins: [],
};
