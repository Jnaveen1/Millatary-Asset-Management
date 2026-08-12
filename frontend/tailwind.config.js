/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          900: '#0b0f19',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
          border: '#2d3748',
          accent: '#10b981',
          gold: '#f59e0b',
          alert: '#ef4444',
          cyan: '#06b6d4',
        }
      }
    },
  },
  plugins: [],
}
