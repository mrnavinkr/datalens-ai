/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ink/mist are theme-aware: values come from CSS custom properties
        // that flip between the .dark and .light root classes (see index.css),
        // so every existing bg-ink-900 / text-mist-100 utility automatically
        // works in both themes without per-component dark: variants.
        ink: {
          950: 'rgb(var(--color-ink-950) / <alpha-value>)',
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
          800: 'rgb(var(--color-ink-800) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
        },
        scan: {
          400: '#5EEAD4',
          500: '#2DD4BF',
          600: '#14B8A6',
        },
        quality: {
          good: '#34D399',
          warn: '#F59E0B',
          bad: '#FB7185',
        },
        mist: {
          100: 'rgb(var(--color-mist-100) / <alpha-value>)',
          300: 'rgb(var(--color-mist-300) / <alpha-value>)',
          500: 'rgb(var(--color-mist-500) / <alpha-value>)',
          700: 'rgb(var(--color-mist-700) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'scan-sweep': 'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(45,212,191,0.35) 60deg, transparent 120deg)',
        'grid-fade': 'linear-gradient(180deg, rgba(45,212,191,0.06) 0%, transparent 100%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(45, 212, 191, 0.35)',
      },
    },
  },
  plugins: [],
}
