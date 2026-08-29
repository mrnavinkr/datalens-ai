import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getAutoVisualizations, getColumns } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

export default function Statistics() {
  const { id } = useParams()
  const [charts, setCharts] = useState(null)
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getAutoVisualizations(id), getColumns(id)])
      .then(([cRes, colRes]) => { if (!cancelled) { setCharts(cRes.data); setColumns(colRes.data) } })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <p className="text-mist-500 text-sm text-center py-16">Loading statistics…</p>
  if (error) return <p className="text-quality-bad text-sm text-center py-16">{error}</p>

  const numericCols = columns.filter((c) => ['integer', 'float'].includes(c.data_type))
  const categoricalCols = columns.filter((c) => ['categorical', 'text'].includes(c.data_type))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-medium text-mist-100 mb-1">Numerical Distributions</h2>
        <p className="text-sm text-mist-500 mb-4">Shape, spread, and skew for each numeric column.</p>
        <div className="grid md:grid-cols-2 gap-5">
          {numericCols.map((c) => {
            const hist = charts?.numeric?.[c.name]?.histogram
            const data = hist?.bins?.map((b, i) => ({ bin: b, count: hist.counts[i] })) || []
            return (
              <div key={c.name} className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-mist-100 text-sm">{c.name}</h3>
                  <span className="text-xs font-mono text-mist-500">
                    skew {c.skewness != null ? c.skewness.toFixed(2) : '—'}
                  </span>
                </div>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={data}>
                      <XAxis dataKey="bin" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" fill="#2DD4BF" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-mist-500">Not enough data to chart.</p>
                )}
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  {[['Min', c.min_value], ['Median', c.median_value], ['Mean', c.mean_value], ['Max', c.max_value]].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[10px] text-mist-500">{l}</p>
                      <p className="font-mono text-xs text-mist-100">{v != null ? v.toFixed(1) : '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="font-display font-medium text-mist-100 mb-1">Categorical Distributions</h2>
        <p className="text-sm text-mist-500 mb-4">Dominant and rare categories for each categorical column.</p>
        <div className="grid md:grid-cols-2 gap-5">
          {categoricalCols.map((c) => {
            const cat = charts?.categorical?.[c.name]
            const data = cat ? cat.categories.map((name, i) => ({ name, count: cat.counts[i] })) : []
            return (
              <div key={c.name} className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-mist-100 text-sm">{c.name}</h3>
                  {c.high_cardinality && <span className="text-xs text-quality-warn">high cardinality</span>}
                </div>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(120, data.length * 26)}>
                    <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A2740" horizontal={false} />
                      <XAxis type="number" stroke="#8A97AC" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="#8A97AC" fontSize={10} width={90} />
                      <Tooltip contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" fill="#34D399" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-mist-500">Not enough data to chart.</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
