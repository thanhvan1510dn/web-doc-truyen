/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sepia: {
          50: '#faf6eb',
          100: '#f5ecd4',
          200: '#eddcaa',
          300: '#e3c67c',
          400: '#dbae52',
          500: '#c89335',
          600: '#ad742b',
          700: '#8b5625',
          800: '#724524',
          900: '#5e3921',
          950: '#351d0e',
        },
        midnight: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e3046',
          900: '#0f172a',
          950: '#0a0f1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Lora', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
