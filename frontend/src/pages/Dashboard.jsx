import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, FileStack, Rows3, Gauge, UploadCloud, Trash2, PencilLine } from 'lucide-react'
import { listDatasets, deleteDataset, renameDataset } from '../api/endpoints'
import StatCard from '../components/StatCard.jsx'
import { getErrorMessage } from '../api/client'

const STATUS_STYLES = {
  ready: 'text-quality-good bg-quality-good/10',
  processing: 'text-scan-400 bg-scan-500/10',
  uploading: 'text-scan-400 bg-scan-500/10',
  failed: 'text-quality-bad bg-quality-bad/10',
}

function usabilityStyle(status) {
  switch (status) {
    case 'Excellent':
    case 'Good':
      return 'text-quality-good bg-quality-good/10'
    case 'Needs Cleaning':
      return 'text-quality-warn bg-quality-warn/10'
    default:
      return 'text-quality-bad bg-quality-bad/10'
  }
}

export default function Dashboard() {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await listDatasets()
      setDatasets(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your datasets.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dataset? This cannot be undone.')) return
    try {
      await deleteDataset(id)
      setDatasets((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete dataset.'))
    }
  }

  const startRename = (d) => {
    setRenamingId(d.id)
    setRenameValue(d.display_name)
  }

  const submitRename = async (id) => {
    try {
      const res = await renameDataset(id, renameValue.trim() || 'Untitled dataset')
      setDatasets((prev) => prev.map((d) => (d.id === id ? res.data : d)))
    } catch (err) {
      alert(getErrorMessage(err, 'Could not rename dataset.'))
    } finally {
      setRenamingId(null)
    }
  }

  const readyDatasets = datasets.filter((d) => d.status === 'ready')
  const totalRows = readyDatasets.reduce((sum, d) => sum + (d.total_rows || 0), 0)
  const avgQuality = readyDatasets.length
    ? Math.round(readyDatasets.reduce((sum, d) => sum + (d.quality_score || 0), 0) / readyDatasets.length)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-2xl text-mist-100">Dashboard</h1>
          <p className="text-mist-500 text-sm mt-1">An overview of everything you've analyzed.</p>
        </div>
        <Link
          to="/app/upload"
          className="flex items-center gap-2 bg-scan-500 text-ink-950 font-medium px-4 py-2.5 rounded-lg hover:bg-scan-400 transition-colors text-sm"
        >
          <UploadCloud size={16} /> Upload Dataset
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={FileStack} label="Datasets Uploaded" value={datasets.length} accent="scan" />
        <StatCard icon={Database} label="Analyses Completed" value={readyDatasets.length} accent="good" />
        <StatCard icon={Rows3} label="Rows Analyzed" value={totalRows.toLocaleString()} accent="scan" />
        <StatCard icon={Gauge} label="Avg. Data Quality" value={readyDatasets.length ? `${avgQuality}%` : '—'} accent="good" />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-700">
          <h2 className="font-display font-medium text-mist-100">Recent Datasets</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-mist-500 text-sm">Loading datasets…</div>
        ) : error ? (
          <div className="p-10 text-center text-quality-bad text-sm">{error}</div>
        ) : datasets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-mist-300 mb-3">You haven't uploaded any datasets yet.</p>
            <Link to="/app/upload" className="text-scan-400 hover:text-scan-300 text-sm font-medium">
              Upload your first dataset →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-mist-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Dataset</th>
                  <th className="px-5 py-3 font-medium">Rows</th>
                  <th className="px-5 py-3 font-medium">Columns</th>
                  <th className="px-5 py-3 font-medium">Quality</th>
                  <th className="px-5 py-3 font-medium">Usability</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.id} className="border-t border-ink-700 hover:bg-ink-700/30">
                    <td className="px-5 py-3">
                      {renamingId === d.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => submitRename(d.id)}
                          onKeyDown={(e) => e.key === 'Enter' && submitRename(d.id)}
                          className="bg-ink-700 border border-scan-500 rounded px-2 py-1 text-mist-100 text-sm w-full"
                        />
                      ) : (
                        <Link
                          to={d.status === 'ready' ? `/app/datasets/${d.id}` : '#'}
                          className={`font-medium ${d.status === 'ready' ? 'text-mist-100 hover:text-scan-400' : 'text-mist-300 cursor-default'}`}
                        >
                          {d.display_name}
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-mist-300">{d.total_rows?.toLocaleString() ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-mist-300">{d.total_columns ?? '—'}</td>
                    <td className="px-5 py-3 font-mono text-mist-300">{d.quality_score != null ? `${Math.round(d.quality_score)}%` : '—'}</td>
                    <td className="px-5 py-3">
                      {d.usability_status ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${usabilityStyle(d.usability_status)}`}>
                          {d.usability_status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${STATUS_STYLES[d.status] || ''}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => startRename(d)} className="text-mist-500 hover:text-scan-400" title="Rename">
                          <PencilLine size={15} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="text-mist-500 hover:text-quality-bad" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
