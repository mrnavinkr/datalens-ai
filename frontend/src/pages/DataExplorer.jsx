import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { getDatasetRows } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

export default function DataExplorer() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const load = useCallback(() => {
    setLoading(true)
    getDatasetRows(id, { page, page_size: 25, search: search || undefined, sort_by: sortBy || undefined, sort_dir: sortDir })
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, page, search, sortBy, sortDir])

  useEffect(() => { load() }, [load])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-700 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-medium text-mist-100">Data Explorer</h2>
          {data && <p className="text-sm text-mist-500 mt-0.5">{data.total_rows.toLocaleString()} rows total</p>}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search rows…"
              className="bg-ink-700 border border-ink-600 rounded-lg pl-8 pr-3 py-1.5 text-sm text-mist-100 focus:border-scan-500 outline-none w-48"
            />
          </div>
          <button type="submit" className="text-xs bg-scan-500 text-ink-950 font-medium px-3 py-1.5 rounded-lg hover:bg-scan-400">
            Search
          </button>
        </form>
      </div>

      {error && <p className="text-quality-bad text-sm text-center py-10">{error}</p>}

      {!error && (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-700">
                {(data?.columns || []).map((col) => (
                  <th key={col} className="px-4 py-3 font-medium whitespace-nowrap">
                    <button onClick={() => handleSort(col)} className="flex items-center gap-1 hover:text-mist-100">
                      {col} <ArrowUpDown size={11} className={sortBy === col ? 'text-scan-400' : ''} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={data?.columns?.length || 1} className="px-4 py-10 text-center text-mist-500">Loading rows…</td></tr>
              ) : (data?.rows || []).length === 0 ? (
                <tr><td colSpan={data?.columns?.length || 1} className="px-4 py-10 text-center text-mist-500">No matching rows.</td></tr>
              ) : (
                data.rows.map((row, i) => (
                  <tr key={i} className="border-t border-ink-700 hover:bg-ink-700/30">
                    {data.columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 font-mono text-xs text-mist-300 whitespace-nowrap max-w-[220px] truncate">
                        {row[col] === null || row[col] === undefined ? <span className="text-mist-700 italic">null</span> : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-700">
          <p className="text-xs text-mist-500">Page {data.page} of {data.total_pages}</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-ink-600 text-mist-300 disabled:opacity-40 hover:border-scan-500/50"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-ink-600 text-mist-300 disabled:opacity-40 hover:border-scan-500/50"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
