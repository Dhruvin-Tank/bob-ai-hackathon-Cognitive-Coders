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
        night: {
          950: '#060a13',
          900: '#0a0f1c',
          800: '#101828',
          700: '#1a2332',
          600: '#253147',
          500: '#384661',
        },
        volt: {
          DEFAULT: '#22d3ee',
          glow: '#06b6d4',
          dim: 'rgba(34, 211, 238, 0.15)',
        },
        gridrisk: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#f59e0b',
          low: '#22c55e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'volt-glow': '0 0 20px -2px rgba(34, 211, 238, 0.25)',
        'critical-glow': '0 0 25px -3px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
