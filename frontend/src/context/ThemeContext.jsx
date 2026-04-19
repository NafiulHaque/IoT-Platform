import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = {
  dark:       'dark',
  enterprise: 'enterprise',
  graphite:   'graphite',
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('iot-theme') || THEMES.dark
  )

  useEffect(() => {
    localStorage.setItem('iot-theme', theme)
    // Tailwind v4 uses data-theme on <html>
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// ── useChartColors — reads CSS vars AFTER mount ──────
// Call this inside a component, not at module level
export function useChartColors() {
  const { theme } = useTheme()

  // Re-read every time theme changes
  const read = (name) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim()

  return {
    power:          read('--color-power'),
    energy:         read('--color-energy'),
    voltage:        read('--color-voltage'),
    current:        read('--color-current'),
    pf:             read('--color-pf'),
    freq:           read('--color-freq'),
    temp:           read('--color-temp'),
    hum:            read('--color-hum'),
    gridLine:       read('--color-grid-line'),
    tick:           read('--color-tick'),
    tooltipBg:      read('--color-tooltip-bg'),
    tooltipBorder:  read('--color-tooltip-border'),
    heatmap: [0, 1, 2, 3, 4].map(i => read(`--hm-${i}`)),
  }
}

// ── useThemeClasses — Tailwind class sets per theme ──
export function useThemeClasses() {
  const { theme } = useTheme()

  const map = {
    dark: {
      page:       'bg-dark-bg text-dark-text min-h-screen',
      sidebar:    'bg-dark-surface border-dark-border',
      card:       'bg-dark-surface border border-dark-border rounded-xl',
      cardInner:  'bg-dark-bg border border-dark-border/50 rounded-lg',
      cardHover:  'hover:border-dark-accent/40 transition-colors duration-150',
      input:      'bg-dark-bg border-dark-border text-dark-text placeholder-dark-muted focus:ring-dark-accent/40 focus:border-dark-accent',
      btn:        'bg-dark-accent hover:bg-dark-accent-h text-white focus:ring-dark-accent/40',
      accent:     'text-dark-accent-h',
      muted:      'text-dark-muted',
      border:     'border-dark-border',
      label:      'text-dark-muted text-xs uppercase tracking-wider',
      nav:        'bg-dark-surface border-b border-dark-border',
      active:     'bg-dark-accent/10 text-dark-accent-h',
      badge:      'bg-green-500/10 text-green-400 border border-green-500/20',
      badgeOff:   'bg-red-500/10 text-red-400 border border-red-500/20',
      gaugeTrack: 'bg-dark-border',
      tabBar:     'bg-dark-surface border border-dark-border',
      tabActive:  'bg-dark-border text-dark-text',
      tabIdle:    'text-dark-muted hover:text-dark-text',
      devPill:    'bg-dark-surface border-dark-border',
      sel:        'bg-dark-bg border-dark-border text-dark-muted',
    },
    enterprise: {
      page:       'bg-blue-light text-blue-text min-h-screen',
      sidebar:    'bg-blue-navy text-white',
      card:       'bg-white border border-blue-border border-l-4 border-l-blue-primary rounded-xl',
      cardInner:  'bg-blue-light border border-blue-border rounded-lg',
      cardHover:  'hover:shadow-md transition-shadow duration-150',
      input:      'bg-white border-gray-300 text-blue-text placeholder-blue-muted focus:ring-blue-primary/30 focus:border-blue-primary',
      btn:        'bg-blue-primary hover:bg-blue-700 text-white focus:ring-blue-primary/30',
      accent:     'text-blue-primary',
      muted:      'text-blue-muted',
      border:     'border-blue-border',
      label:      'text-blue-muted text-xs uppercase tracking-wider',
      nav:        'bg-blue-navy text-white shadow-md',
      active:     'bg-white/10 text-white',
      badge:      'bg-green-100 text-green-700 border border-green-300',
      badgeOff:   'bg-red-100 text-red-700 border border-red-300',
      gaugeTrack: 'bg-blue-border',
      tabBar:     'bg-white border border-blue-border',
      tabActive:  'bg-blue-primary text-white',
      tabIdle:    'text-blue-muted hover:text-blue-text',
      devPill:    'bg-blue-light border-blue-border',
      sel:        'bg-white border-blue-border text-blue-muted',
    },
    graphite: {
      page:       'bg-gray-50 text-gray-900 min-h-screen',
      sidebar:    'bg-white border-r border-gray-200',
      card:       'bg-white border border-gray-200 rounded-xl',
      cardInner:  'bg-gray-50 border border-gray-100 rounded-lg',
      cardHover:  'hover:shadow-sm transition-shadow duration-150',
      input:      'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-gray-400/30 focus:border-gray-500',
      btn:        'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-500/30',
      accent:     'text-gray-800',
      muted:      'text-gray-400',
      border:     'border-gray-200',
      label:      'text-gray-400 text-xs uppercase tracking-wider',
      nav:        'bg-white border-b border-gray-200 shadow-sm',
      active:     'bg-gray-100 text-gray-900',
      badge:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
      badgeOff:   'bg-red-50 text-red-600 border border-red-200',
      gaugeTrack: 'bg-gray-100',
      tabBar:     'bg-white border border-gray-200',
      tabActive:  'bg-gray-700 text-white',
      tabIdle:    'text-gray-400 hover:text-gray-700',
      devPill:    'bg-gray-100 border-gray-200',
      sel:        'bg-white border-gray-200 text-gray-500',
    },
  }

  return map[theme]
}



export function buildTooltip(cc) {
  return {
    backgroundColor: cc.tooltipBg,
    borderColor: cc.tooltipBorder,
    borderWidth: 1,
    titleColor: cc.accent,
    bodyColor: cc.tick,
  }
}