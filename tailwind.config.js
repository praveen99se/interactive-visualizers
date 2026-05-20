/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'info': 'rgb(6, 182, 212)',
        'secondary': 'rgb(107, 114, 128)',
      },
      fontFamily: {
        'mono': ['Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
