/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bulbasaur Signature Palette
        bulba_teal: '#4EA59D',
        bulba_dark: '#2B6B63',
        bulba_light: '#E3F6F3',
        bulba_patch: '#357B72',
        bulb_green: '#78C850',
        bulb_coral: '#E98176',
        
        // Nature Foliage Tokens
        forest: '#174D35',
        deep_forest: '#0F3323',
        leaf: '#29965B',
        fresh_mint: '#CFF4D7',
        light_mint: '#EAF9ED',
        botanical_cream: '#FAF8EF',
        earth_brown: '#8B6745',
        sunshine_yellow: '#F3C969',
        lagoon_teal: '#278F89',
        
        // Semantic Mapping
        primary: '#29965B',
        'primary-dark': '#174D35',
        page_background: '#F4FAF6',
        card: '#FFFFFF',
        text_primary: '#0F3323',
        text_secondary: '#41594F',
        border: '#C7EEDB',
        success: '#29965B',
        warning: '#F3C969',
        error: '#E98176',
      },
      borderRadius: {
        'organic': '1.25rem',
        'leaf': '1.5rem 0.5rem 1.5rem 0.5rem',
        'leaf-reverse': '0.5rem 1.5rem 0.5rem 1.5rem',
      },
      backgroundImage: {
        'bulba-gradient': 'linear-gradient(135deg, #174D35 0%, #29965B 50%, #4EA59D 100%)',
        'canopy-gradient': 'linear-gradient(180deg, rgba(23,77,53,0.92) 0%, rgba(41,150,91,0.85) 100%)',
        'meadow-radial': 'radial-gradient(circle at 10% 20%, rgba(207,244,215,0.45) 0%, rgba(250,248,239,0.8) 90%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
