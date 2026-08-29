import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Demo from './pages/Demo.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import DatasetLayout from './layouts/DatasetLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Upload from './pages/Upload.jsx'
import Profile from './pages/Profile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import DatasetOverview from './pages/DatasetOverview.jsx'
import DataHealth from './pages/DataHealth.jsx'
import ColumnAnalysis from './pages/ColumnAnalysis.jsx'
import DataExplorer from './pages/DataExplorer.jsx'
import Statistics from './pages/Statistics.jsx'
import VisualizationStudio from './pages/VisualizationStudio.jsx'
import CorrelationAnalysis from './pages/CorrelationAnalysis.jsx'
import AIDataAnalyst from './pages/AIDataAnalyst.jsx'
import Reports from './pages/Reports.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-900 text-mist-500">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/demo" element={<Demo />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        <Route path="datasets/:id" element={<DatasetLayout />}>
          <Route index element={<DatasetOverview />} />
          <Route path="health" element={<DataHealth />} />
          <Route path="columns" element={<ColumnAnalysis />} />
          <Route path="explorer" element={<DataExplorer />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="studio" element={<VisualizationStudio />} />
          <Route path="correlation" element={<CorrelationAnalysis />} />
          <Route path="chat" element={<AIDataAnalyst />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
