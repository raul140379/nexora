/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold:   '#D4AF37',
        'gold-dark': '#B8860B',
        patron: '#0F0F0F',
        'patron-card': '#1A1A1A',
      },
    },
  },
  plugins: [],
}
