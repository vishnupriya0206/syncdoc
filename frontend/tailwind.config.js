/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f2ff',
          100: '#ece7ff',
          400: '#8b6df0',
          500: '#7c5cf0',
          600: '#6a3ce8',
          700: '#5a2fd1',
        },
        ink: {
          900: '#111318',
          800: '#191c24',
          700: '#20232c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
      },
    },
  },
  plugins: [],
};