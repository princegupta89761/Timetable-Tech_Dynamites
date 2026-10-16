/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',
        secondary: '#64748b',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
