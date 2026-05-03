/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        craft: {
          50: '#f8f6f3',
          100: '#f0ebe4',
          200: '#e2d6c6',
          300: '#cdb99a',
          400: '#b8996e',
          500: '#a67f50',
          600: '#8a6640',
          700: '#6e5135',
          800: '#5a432e',
          900: '#4a3828',
        }
      }
    },
  },
  plugins: [],
}