import { useState } from 'react'
import Sidebar from './Sidebar'
import { useThemeClasses } from '../context/ThemeContext'

export default function Layout({ children }) {
  const tc = useThemeClasses()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`${tc.page} flex`}>

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex flex-col w-56">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className={`md:hidden flex items-center justify-between px-4 py-3 ${tc.nav}`}>
          <button onClick={() => setSidebarOpen(true)} className={tc.muted}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className={`text-sm font-semibold ${tc.accent}`}>IoT Platform</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}