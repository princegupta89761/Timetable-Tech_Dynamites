/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10998F',
        dark: '#08786F',
        light: '#E7F7F4',
        page_background: '#F5F7F8',
        card: '#FFFFFF',
        text_primary: '#182230',
        text_secondary: '#667085',
        border: '#E4E7EC',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
