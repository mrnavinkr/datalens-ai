import { useEffect, useState, Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react'
import { getColumns } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

const TYPE_COLORS = {
  integer: 'text-scan-400 bg-scan-500/10',
  float: 'text-scan-400 bg-scan-500/10',
  categorical: 'text-quality-good bg-quality-good/10',
  text: 'text-quality-good bg-quality-good/10',
  boolean: 'text-purple-400 bg-purple-400/10',
  date: 'text-quality-warn bg-quality-warn/10',
  datetime: 'text-quality-warn bg-quality-warn/10',
}

function NumericDetail({ c }) {
  const rows = [
    ['Min', c.min_value], ['Max', c.max_value], ['Mean', c.mean_value], ['Median', c.median_value],
    ['Std Dev', c.std_value], ['Variance', c.variance_value], ['Q1', c.q1_value], ['Q3', c.q3_value],
    ['IQR', c.iqr_value], ['Zero Count', c.zero_count], ['Negative Count', c.negative_count],
    ['Outlier Count', c.outlier_count], ['Skewness', c.skewness],
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="bg-ink-700/50 rounded-lg px-3 py-2">
          <p className="text-[11px] text-mist-500">{label}</p>
          <p className="font-mono text-sm text-mist-100">{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 3 }) : '—'}</p>
        </div>
      ))}
    </div>
  )
}

function CategoricalDetail({ c }) {
  const entries = c.top_categories ? Object.entries(c.top_categories) : []
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-ink-700/50 rounded-lg px-3 py-2">
          <p className="text-[11px] text-mist-500">Most Frequent</p>
          <p className="font-mono text-sm text-mist-100 truncate">{c.most_frequent_value ?? '—'}</p>
        </div>
        <div className="bg-ink-700/50 rounded-lg px-3 py-2">
          <p className="text-[11px] text-mist-500">Frequency</p>
          <p className="font-mono text-sm text-mist-100">{c.most_frequent_freq?.toLocaleString() ?? '—'}</p>
        </div>
        {c.high_cardinality && (
          <div className="bg-quality-warn/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <TriangleAlert size={14} className="text-quality-warn shrink-0" />
            <p className="text-xs text-quality-warn">High cardinality — likely an identifier</p>
          </div>
        )}
      </div>
      {entries.length > 0 && (
        <div>
          <p className="text-[11px] text-mist-500 mb-2">Top categories</p>
          <div className="space-y-1.5">
            {entries.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate text-mist-300">{label}</span>
                <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                  <div className="h-full bg-scan-500" style={{ width: `${(count / entries[0][1]) * 100}%` }} />
                </div>
                <span className="font-mono text-mist-500 w-14 text-right">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DateDetail({ c }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="bg-ink-700/50 rounded-lg px-3 py-2">
        <p className="text-[11px] text-mist-500">Min Date</p>
        <p className="font-mono text-sm text-mist-100">{c.min_date ?? '—'}</p>
      </div>
      <div className="bg-ink-700/50 rounded-lg px-3 py-2">
        <p className="text-[11px] text-mist-500">Max Date</p>
        <p className="font-mono text-sm text-mist-100">{c.max_date ?? '—'}</p>
      </div>
      <div className="bg-ink-700/50 rounded-lg px-3 py-2">
        <p className="text-[11px] text-mist-500">Invalid Dates</p>
        <p className="font-mono text-sm text-mist-100">{c.invalid_date_count ?? 0}</p>
      </div>
    </div>
  )
}

export default function ColumnAnalysis() {
  const { id } = useParams()
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    let cancelled = false
    getColumns(id)
      .then((res) => { if (!cancelled) setColumns(res.data) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <p className="text-mist-500 text-sm text-center py-16">Loading column analysis…</p>
  if (error) return <p className="text-quality-bad text-sm text-center py-16">{error}</p>

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-700">
        <h2 className="font-display font-medium text-mist-100">Column-by-Column Analysis</h2>
        <p className="text-sm text-mist-500 mt-0.5">Click a column to see its full statistics.</p>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-mist-500 text-xs uppercase tracking-wide border-b border-ink-700">
              <th className="px-5 py-3 font-medium"></th>
              <th className="px-5 py-3 font-medium">Column</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Null %</th>
              <th className="px-5 py-3 font-medium">Unique %</th>
              <th className="px-5 py-3 font-medium">Non-Null</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <Fragment key={c.id}>
                <tr
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  className="border-t border-ink-700 hover:bg-ink-700/30 cursor-pointer"
                >
                  <td className="px-5 py-3 text-mist-500">
                    {expanded === c.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </td>
                  <td className="px-5 py-3 font-medium text-mist-100">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${TYPE_COLORS[c.data_type] || ''}`}>{c.data_type}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-mist-300">{c.null_percentage}%</td>
                  <td className="px-5 py-3 font-mono text-mist-300">{c.unique_percentage}%</td>
                  <td className="px-5 py-3 font-mono text-mist-300">{c.non_null_count.toLocaleString()}</td>
                </tr>
                {expanded === c.id && (
                  <tr className="border-t border-ink-700 bg-ink-700/20">
                    <td colSpan={6} className="px-5 py-4">
                      {['integer', 'float'].includes(c.data_type) && <NumericDetail c={c} />}
                      {['categorical', 'text'].includes(c.data_type) && <CategoricalDetail c={c} />}
                      {['date', 'datetime'].includes(c.data_type) && <DateDetail c={c} />}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
