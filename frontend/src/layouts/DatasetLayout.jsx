import { useEffect, useState } from 'react'
import { useParams, NavLink, Outlet, Link } from 'react-router-dom'
import {
  ArrowLeft, LayoutGrid, HeartPulse, Columns3, Table2, BarChart3,
  Sigma, Bot, FileDown, GitCompareArrows,
} from 'lucide-react'
import { getDataset, getOverview, getHealth } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

const TABS = [
  { to: '', label: 'Overview', icon: LayoutGrid, end: true },
  { to: 'health', label: 'Data Health', icon: HeartPulse },
  { to: 'columns', label: 'Columns', icon: Columns3 },
  { to: 'explorer', label: 'Data Explorer', icon: Table2 },
  { to: 'statistics', label: 'Statistics', icon: Sigma },
  { to: 'correlation', label: 'Correlation', icon: GitCompareArrows },
  { to: 'studio', label: 'Visualization', icon: BarChart3 },
  { to: 'chat', label: 'AI Analyst', icon: Bot },
  { to: 'reports', label: 'Reports', icon: FileDown },
]

export default function DatasetLayout() {
  const { id } = useParams()
  const [dataset, setDataset] = useState(null)
  const [overview, setOverview] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [dRes, oRes, hRes] = await Promise.all([getDataset(id), getOverview(id), getHealth(id)])
        if (cancelled) return
        setDataset(dRes.data)
        setOverview(oRes.data)
        setHealth(hRes.data)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Could not load this dataset's analysis."))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return <div className="text-center text-mist-500 py-20 text-sm">Loading analysis…</div>
  }
  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-quality-bad mb-4">{error}</p>
        <Link to="/app" className="text-scan-400 hover:text-scan-300 text-sm">← Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/app" className="inline-flex items-center gap-1.5 text-mist-500 hover:text-mist-100 text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <h1 className="font-display font-semibold text-2xl text-mist-100 mb-5">{dataset.display_name}</h1>

      <div className="border-b border-ink-700 mb-7 overflow-x-auto scrollbar-thin">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to || '.'}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-scan-500 text-scan-400 font-medium'
                    : 'border-transparent text-mist-500 hover:text-mist-100'
                }`
              }
            >
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet context={{ dataset, overview, health, refreshDataset: () => {} }} />
    </div>
  )
}
