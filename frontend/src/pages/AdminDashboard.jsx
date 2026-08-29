import { useEffect, useState } from 'react'
import { Users, Database, Activity, HardDrive, Rows3, ShieldCheck } from 'lucide-react'
import { getAdminStats, getAdminUsers, toggleUserActive, getAdminDatasets, adminDeleteDataset } from '../api/endpoints'
import StatCard from '../components/StatCard.jsx'
import { getErrorMessage } from '../api/client'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('users')

  const load = () => {
    setLoading(true)
    Promise.all([getAdminStats(), getAdminUsers(), getAdminDatasets()])
      .then(([s, u, d]) => { setStats(s.data); setUsers(u.data); setDatasets(d.data) })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggleActive = async (userId) => {
    try {
      await toggleUserActive(userId)
      load()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteDataset = async (datasetId) => {
    if (!window.confirm('Delete this dataset as admin? This cannot be undone.')) return
    try {
      await adminDeleteDataset(datasetId)
      load()
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  if (loading) return <p className="text-mist-500 text-sm text-center py-16">Loading admin dashboard…</p>
  if (error) return <p className="text-quality-bad text-sm text-center py-16">{error}</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck size={20} className="text-scan-400" />
        <h1 className="font-display font-semibold text-2xl text-mist-100">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.total_users} accent="scan" />
        <StatCard icon={Activity} label="Active Users" value={stats.active_users} accent="good" />
        <StatCard icon={Database} label="Total Datasets" value={stats.total_datasets} accent="scan" />
        <StatCard icon={Rows3} label="Rows Analyzed" value={stats.total_rows_analyzed.toLocaleString()} accent="scan" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(stats.storage_usage_bytes)} accent="warn" />
      </div>

      <div className="flex gap-2 mb-5">
        {['users', 'datasets'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              tab === t ? 'bg-scan-500/10 text-scan-400 font-medium' : 'text-mist-500 hover:text-mist-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-700">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-ink-700">
                  <td className="px-5 py-3 text-mist-100 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-mist-300">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-scan-500/10 text-scan-400 capitalize">{u.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${u.is_active ? 'bg-quality-good/10 text-quality-good' : 'bg-quality-bad/10 text-quality-bad'}`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleToggleActive(u.id)} className="text-xs text-mist-400 hover:text-scan-400">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'datasets' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-700">
                <th className="px-5 py-3 font-medium">Dataset</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Rows</th>
                <th className="px-5 py-3 font-medium">Quality</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-t border-ink-700">
                  <td className="px-5 py-3 text-mist-100 font-medium">{d.display_name}</td>
                  <td className="px-5 py-3 text-mist-300 capitalize">{d.status}</td>
                  <td className="px-5 py-3 font-mono text-mist-300">{d.total_rows?.toLocaleString() ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-mist-300">{d.quality_score != null ? Math.round(d.quality_score) : '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDeleteDataset(d.id)} className="text-xs text-quality-bad hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
