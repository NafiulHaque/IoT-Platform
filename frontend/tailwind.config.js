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
          muted:  '#64748b',
          text: '#f1f5f9',
          'accent-h': '#818cf8',
        },
        // Enterprise Blue
        blue: {
          navy:    '#1a365d',
          primary: '#3182ce',
          light:   '#ebf8ff',
          border:  '#bee3f8',
          muted:   '#718096',
          text:     '#1a365d',
        },
        // Minimalist Graphite
        gray: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          400: '#9ca3af',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}