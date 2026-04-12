/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        page: 'var(--color-page)',
        card: 'var(--color-card)',
        'text-primary': 'var(--color-text-primary)',
        muted: 'var(--color-muted-text)',
        healthy: 'var(--color-healthy)',
        tumor: 'var(--color-tumor)',
        bbox: 'var(--color-bbox)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
