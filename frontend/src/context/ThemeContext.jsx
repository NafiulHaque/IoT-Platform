import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = {
  dark:      'dark',
  enterprise:'enterprise',
  graphite:  'graphite',
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('iot-theme') || THEMES.dark
  )

  useEffect(() => {
    localStorage.setItem('iot-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// Returns Tailwind class sets based on active theme
export function useThemeClasses() {
  const { theme } = useTheme()

  const themes = {
    dark: {
      page:       'bg-dark-bg text-slate-100 min-h-screen',
      sidebar:    'bg-dark-surface border-dark-border',
      card:       'bg-dark-surface border border-dark-border rounded-xl',
      cardHover:  'hover:border-dark-accent/40 transition-colors',
      input:      'bg-dark-bg border-dark-border text-slate-100 placeholder-slate-500 focus:ring-dark-accent/50 focus:border-dark-accent',
      btn:        'bg-dark-accent hover:bg-dark-accent-light text-white focus:ring-dark-accent/50',
      accent:     'text-dark-accent-light',
      muted:      'text-slate-400',
      border:     'border-dark-border',
      label:      'text-slate-400 text-xs uppercase tracking-wider',
      nav:        'bg-dark-surface/80 backdrop-blur border-b border-dark-border',
      active:     'bg-dark-accent/10 text-dark-accent-light',
      badge:      'bg-green-500/10 text-green-400',
      badgeOff:   'bg-red-500/10 text-red-400',
    },
    enterprise: {
      page:       'bg-blue-50 text-gray-800 min-h-screen',
      sidebar:    'bg-blue-navy text-white',
      card:       'bg-white border border-blue-border rounded-xl shadow-sm border-l-4 border-l-blue-primary',
      cardHover:  'hover:shadow-md transition-shadow',
      input:      'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-blue-primary/30 focus:border-blue-primary',
      btn:        'bg-blue-primary hover:bg-blue-700 text-white focus:ring-blue-primary/30',
      accent:     'text-blue-primary',
      muted:      'text-gray-500',
      border:     'border-blue-border',
      label:      'text-gray-500 text-xs uppercase tracking-wider',
      nav:        'bg-blue-navy text-white shadow-md',
      active:     'bg-white text-blue-primary shadow-sm border-1-4 border-1-blue-primary',
      badge:      'bg-green-100 text-green-700',
      badgeOff:   'bg-red-100 text-red-600',
    },
    graphite: {
      page:       'bg-gray-50 text-gray-900 min-h-screen',
      sidebar:    'bg-white border-r border-gray-200',
      card:       'bg-white border border-gray-200 rounded-xl',
      cardHover:  'hover:shadow-sm transition-shadow',
      input:      'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-400/30 focus:border-gray-500',
      btn:        'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-500/30',
      accent:     'text-gray-800',
      muted:      'text-slate-500',
      border:     'border-gray-200',
      label:      'text-gray-400 text-xs uppercase tracking-wider',
      nav:        'bg-white border-b border-gray-200 shadow-sm',
      active:     'bg-gray-100 text-gray-900',
      badge:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
      badgeOff:   'bg-red-50 text-red-600 border border-red-200',
    },
  }

  return themes[theme]
}