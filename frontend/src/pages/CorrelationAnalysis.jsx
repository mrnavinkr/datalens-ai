import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCorrelations } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

function cellColor(value) {
  const abs = Math.abs(value)
  if (value >= 0) {
    const alpha = 0.08 + abs * 0.55
    return `rgba(45, 212, 191, ${alpha})`
  }
  const alpha = 0.08 + abs * 0.55
  return `rgba(251, 113, 133, ${alpha})`
}

export default function CorrelationAnalysis() {
  const { id } = useParams()
  const [corr, setCorr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getCorrelations(id)
      .then((res) => { if (!cancelled) setCorr(res.data) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <p className="text-mist-500 text-sm text-center py-16">Loading correlations…</p>
  if (error) return <p className="text-quality-bad text-sm text-center py-16">{error}</p>

  const cols = Object.keys(corr?.matrix || {})

  if (cols.length < 2) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-mist-300">Not enough numeric columns to compute correlations.</p>
        <p className="text-sm text-mist-500 mt-1">Correlation analysis needs at least two numeric columns.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="font-display font-medium text-mist-100 mb-1">Correlation Heatmap</h2>
        <p className="text-sm text-mist-500 mb-5">Pearson correlation between every pair of numeric columns.</p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-1"></th>
                {cols.map((c) => (
                  <th key={c} className="p-1 text-[10px] text-mist-500 font-normal whitespace-nowrap px-2" style={{ writingMode: 'vertical-rl' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cols.map((rowCol) => (
                <tr key={rowCol}>
                  <td className="p-1 text-[11px] text-mist-500 whitespace-nowrap pr-2 text-right">{rowCol}</td>
                  {cols.map((colCol) => {
                    const value = corr.matrix[rowCol]?.[colCol] ?? 0
                    return (
                      <td key={colCol} className="p-0.5">
                        <div
                          title={`${rowCol} × ${colCol}: ${value}`}
                          className="w-11 h-11 flex items-center justify-center rounded text-[10px] font-mono text-mist-100"
                          style={{ backgroundColor: cellColor(value) }}
                        >
                          {value.toFixed(2)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-display font-medium text-mist-100 mb-4">Strong Positive Correlations</h3>
          {corr.strong_positive.length === 0 ? (
            <p className="text-sm text-mist-500">None found (≥ 0.7).</p>
          ) : (
            <ul className="space-y-2">
              {corr.strong_positive.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-mist-300">{p.a} ↔ {p.b}</span>
                  <span className="font-mono text-quality-good">{p.correlation}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-display font-medium text-mist-100 mb-4">Strong Negative Correlations</h3>
          {corr.strong_negative.length === 0 ? (
            <p className="text-sm text-mist-500">None found (≤ -0.7).</p>
          ) : (
            <ul className="space-y-2">
              {corr.strong_negative.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-mist-300">{p.a} ↔ {p.b}</span>
                  <span className="font-mono text-quality-bad">{p.correlation}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
