import { Navigate } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'
import { useThemeClasses } from '../context/ThemeContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, needsSetup } = useAuth()
  const tc = useThemeClasses()

  if (loading) return (
    <div className={`flex items-center justify-center h-screen ${tc.page}`}>
      <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin
        ${useThemeClasses().accent.replace('text-', 'border-')}`} />
    </div>
  )

  if (needsSetup) return <Navigate to="/setup" replace />
  return user ? children : <Navigate to="/login" replace />
}