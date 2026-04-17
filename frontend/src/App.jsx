import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }   from './context/AuthContext'
import { ThemeProvider }  from './context/ThemeContext'
import ProtectedRoute     from './components/ProtectedRoute'
import Layout             from './components/Layout'
import Login              from './pages/Login'
import Setup              from './pages/Setup'
import Dashboard          from './pages/Dashboard'
import Devices            from './pages/Devices'
import DeviceDetail       from './pages/DeviceDetail'
import Readings           from './pages/Readings'
import Alerts             from './pages/Alerts'
import Users              from './pages/Users'
import Settings           from './pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard"          element={<Dashboard />} />
                    <Route path="/devices"            element={<Devices />} />
                    <Route path="/devices/:device_id" element={<DeviceDetail />} />
                    <Route path="/readings"           element={<Readings />} />
                    <Route path="/alerts"             element={<Alerts />} />
                    <Route path="/users"              element={<Users />} />
                    <Route path="/settings"           element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}