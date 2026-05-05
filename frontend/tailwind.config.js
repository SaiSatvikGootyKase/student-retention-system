/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          white: '#FFFFFF',
          slate: '#F8FAFC',
          indigo: '#4F46E5',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#E11D48'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-soft': {
          '0%': { opacity: '0', transform: 'translateX(-6px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease-out forwards',
        'slide-up': 'slide-up 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-soft': 'slide-in-soft 0.35s ease-out forwards',
      },
      boxShadow: {
        'card-hover': '0 12px 40px -12px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
}
