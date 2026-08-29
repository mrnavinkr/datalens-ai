import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getColumns } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

export default function DataHealth() {
  const { id } = useParams()
  const { health, overview } = useOutletContext()
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getColumns(id)
      .then((res) => { if (!cancelled) setColumns(res.data) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const missingData = columns
    .filter((c) => c.null_percentage > 0)
    .sort((a, b) => b.null_percentage - a.null_percentage)
    .slice(0, 12)
    .map((c) => ({ name: c.name, missing: c.null_percentage }))

  const scoreRows = [
    ['Completeness', health.completeness_score, 'How many values are present vs. missing.'],
    ['Validity', health.validity_score, 'How many values are well-formed (valid dates, no empty strings).'],
    ['Consistency', health.consistency_score, 'How uniformly categories are spelled and formatted.'],
    ['Uniqueness', health.uniqueness_score, 'How few duplicate rows exist in the dataset.'],
  ]

  return (
    <div className="space-y-8">
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="font-display font-medium text-mist-100 mb-1">Overall Data Quality</h2>
        <p className="text-sm text-mist-500 mb-5">
          Calculated from your dataset's actual statistics — completeness, validity, consistency, and uniqueness.
        </p>
        <div className="flex items-center gap-4 mb-6">
          <span className="font-mono text-4xl font-semibold text-scan-400">{Math.round(health.quality_score)}</span>
          <span className="text-mist-500">/ 100</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {scoreRows.map(([label, score, desc]) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-mist-300">{label}</span>
                <span className="text-sm font-mono text-mist-100">{Math.round(score)}%</span>
              </div>
              <div className="h-2 bg-ink-700 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-scan-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
              </div>
              <p className="text-xs text-mist-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display font-medium text-mist-100 mb-1">Completeness</h2>
          <p className="text-sm text-mist-500 mb-4">
            {health.total_missing_values.toLocaleString()} missing values ({health.missing_percentage}%) across{' '}
            {health.incomplete_rows.toLocaleString()} incomplete rows out of {overview.total_rows.toLocaleString()}.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display font-medium text-mist-100 mb-1">Duplicates</h2>
          <p className="text-sm text-mist-500 mb-4">
            {health.duplicate_rows.toLocaleString()} fully duplicated rows ({health.duplicate_percentage}% of the dataset).
            The original file was never modified.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="font-display font-medium text-mist-100 mb-1">Missing Values by Column</h2>
        <p className="text-sm text-mist-500 mb-5">Top columns by missing-value percentage.</p>
        {loading ? (
          <p className="text-sm text-mist-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-quality-bad">{error}</p>
        ) : missingData.length === 0 ? (
          <p className="text-sm text-quality-good">No missing values detected in any column. ✓</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, missingData.length * 34)}>
            <BarChart data={missingData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2740" horizontal={false} />
              <XAxis type="number" unit="%" stroke="#8A97AC" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#8A97AC" fontSize={11} width={120} />
              <Tooltip
                contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`, 'Missing']}
              />
              <Bar dataKey="missing" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
