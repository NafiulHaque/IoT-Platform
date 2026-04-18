import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeClasses, useTheme, THEMES } from '../context/ThemeContext'

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()

  const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    {
      to: '/energy/esp32_01',
      label: 'Energy',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z'
    },
    { to: '/devices', label: 'Devices', icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18' },
    { to: '/readings', label: 'Readings', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { to: '/alerts', label: 'Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ...(user?.role === 'admin' ? [{
      to: '/users', label: 'Users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    }] : []),
    { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]
  const tc = useThemeClasses()
  const { theme } = useTheme()
  // const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const isDark = theme === THEMES.dark
  const isBlue = theme === THEMES.enterprise

  return (
    <div className={`h-full flex flex-col w-56 ${tc.sidebar} border-r ${tc.border}`}>

      {/* Brand */}
      <div className={`px-5 py-4 border-b ${tc.border} flex items-center gap-2.5`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center
          ${isDark ? 'bg-dark-accent' : isBlue ? 'bg-blue-400' : 'bg-gray-800'}`}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className={`font-semibold text-sm ${isDark || isBlue ? 'text-white' : 'text-gray-900'}`}>
          IoT Platform
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive ? tc.active : `${tc.muted} hover:opacity-80`}`
            }
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={`px-4 py-4 border-t ${tc.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
            ${isDark ? 'bg-dark-accent/20 text-dark-accent-light' :
              isBlue ? 'bg-blue-400/20 text-blue-200' : 'bg-gray-200 text-gray-700'}`}>
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className={`text-xs font-medium ${isDark || isBlue ? 'text-white' : 'text-gray-900'}`}>
              {user?.name}
            </p>
            <p className={`text-xs ${tc.muted}`}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full text-xs px-3 py-2 rounded-lg border ${tc.border} ${tc.muted}
                      hover:opacity-80 transition-opacity text-left`}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}