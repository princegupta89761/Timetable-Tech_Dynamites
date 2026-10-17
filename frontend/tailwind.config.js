/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: '#174D35',
        deep_forest: '#103B2B',
        leaf: '#29965B',
        fresh_mint: '#CFF4D7',
        light_mint: '#EAF9ED',
        botanical_cream: '#FAF8EF',
        earth_brown: '#8B6745',
        sunshine_yellow: '#F3C969',
        flower_coral: '#E98176',
        lagoon_teal: '#278F89',
        primary: '#29965B',
        dark: '#103B2B',
        light: '#EAF9ED',
        page_background: '#FAF8EF',
        card: '#FFFFFF',
        text_primary: '#103B2B',
        text_secondary: '#4A5568',
        border: '#CFF4D7',
        success: '#29965B',
        warning: '#F3C969',
        error: '#E98176',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
