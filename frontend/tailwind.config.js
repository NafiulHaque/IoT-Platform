export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern Dark
        dark: {
          bg:      '#0f172a',
          surface: '#1e293b',
          border:  '#334155',
          accent:  '#6366f1',
          'accent-light': '#818cf8',
        },
        // Enterprise Blue
        blue: {
          navy:    '#1a365d',
          primary: '#3182ce',
          light:   '#ebf8ff',
          border:  '#bee3f8',
        },
        // Minimalist Graphite
        gray: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          400: '#a1a1aa',
          600: '#52525b',
          800: '#27272a',
          900: '#18181b',
        },
      },
    },
  },
  plugins: [],
}