/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#111111',
        primary: '#FFFFFF',
        primaryLight: '#E5E5E5',
        success: '#FFFFFF',
        danger: '#EF4444',
        text: '#FFFFFF',
        textMuted: '#666666',
        border: '#222222',
        primaryForeground: '#000000'
      },
      fontFamily: {
        fraunces: ['Fraunces_400Regular'],
        'fraunces-bold': ['Fraunces_700Bold'],
        manrope: ['Manrope_400Regular'],
        'manrope-bold': ['Manrope_700Bold'],
      }
    },
  },
  plugins: [],
}
