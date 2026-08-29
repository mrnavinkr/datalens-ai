import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { getColumns, createStudioChart } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

const CHART_TYPES = ['bar', 'line', 'area', 'pie', 'donut', 'histogram', 'scatter', 'box', 'table']
const AGGREGATIONS = ['count', 'sum', 'mean', 'min', 'max']
const PIE_COLORS = ['#2DD4BF', '#34D399', '#F59E0B', '#FB7185', '#60A5FA', '#A78BFA', '#F472B6', '#4ADE80']

export default function VisualizationStudio() {
  const { id } = useParams()
  const [columns, setColumns] = useState([])
  const [chartType, setChartType] = useState('bar')
  const [xAxis, setXAxis] = useState('')
  const [yAxis, setYAxis] = useState('')
  const [aggregation, setAggregation] = useState('count')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getColumns(id).then((res) => {
      setColumns(res.data)
      if (res.data.length > 0) setXAxis(res.data[0].name)
    })
  }, [id])

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await createStudioChart({
        dataset_id: id,
        chart_type: chartType,
        x_axis: xAxis || null,
        y_axis: yAxis || null,
        aggregation,
      })
      setResult(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not build that chart.'))
    } finally {
      setLoading(false)
    }
  }

  const renderChart = () => {
    if (!result) return null
    const { chart_type, data } = result

    if (chart_type === 'histogram' && data?.bins) {
      const chartData = data.bins.map((b, i) => ({ bin: b, count: data.counts[i] }))
      return (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2740" />
            <XAxis dataKey="bin" stroke="#8A97AC" fontSize={10} angle={-30} textAnchor="end" height={60} />
            <YAxis stroke="#8A97AC" fontSize={11} />
            <Tooltip contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if ((chart_type === 'pie' || chart_type === 'donut') && data?.categories) {
      const chartData = data.categories.map((name, i) => ({ name, value: data.counts[i] }))
      return (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Pie
              data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
              outerRadius={110} innerRadius={chart_type === 'donut' ? 60 : 0}
              label={({ name }) => name}
            >
              {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chart_type === 'scatter' && Array.isArray(data)) {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2740" />
            <XAxis type="number" dataKey="x" name={xAxis} stroke="#8A97AC" fontSize={11} />
            <YAxis type="number" dataKey="y" name={yAxis} stroke="#8A97AC" fontSize={11} />
            <Tooltip contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8 }} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill="#2DD4BF" />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    if (chart_type === 'box' && data?.median != null) {
      return (
        <div className="grid grid-cols-5 gap-3 py-8">
          {[['Min', data.min], ['Q1', data.q1], ['Median', data.median], ['Q3', data.q3], ['Max', data.max]].map(([l, v]) => (
            <div key={l} className="text-center bg-ink-700/50 rounded-lg py-4">
              <p className="text-xs text-mist-500 mb-1">{l}</p>
              <p className="font-mono text-lg text-scan-400">{v.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )
    }

    if (['bar', 'line', 'area'].includes(chart_type) && data?.labels) {
      const chartData = data.labels.map((label, i) => ({ label, value: data.values[i] }))
      const Chart = chart_type === 'bar' ? BarChart : chart_type === 'line' ? LineChart : AreaChart
      return (
        <ResponsiveContainer width="100%" height={340}>
          <Chart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2740" />
            <XAxis dataKey="label" stroke="#8A97AC" fontSize={10} angle={-30} textAnchor="end" height={60} />
            <YAxis stroke="#8A97AC" fontSize={11} />
            <Tooltip contentStyle={{ background: '#121B2E', border: '1px solid #243352', borderRadius: 8 }} />
            {chart_type === 'bar' && <Bar dataKey="value" fill="#2DD4BF" radius={[4, 4, 0, 0]} />}
            {chart_type === 'line' && <Line type="monotone" dataKey="value" stroke="#2DD4BF" strokeWidth={2} dot={false} />}
            {chart_type === 'area' && <Area type="monotone" dataKey="value" stroke="#2DD4BF" fill="#2DD4BF" fillOpacity={0.2} />}
          </Chart>
        </ResponsiveContainer>
      )
    }

    if (chart_type === 'table' && Array.isArray(data)) {
      const cols = data.length ? Object.keys(data[0]) : []
      return (
        <div className="overflow-x-auto scrollbar-thin max-h-96">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-mist-500 border-b border-ink-700">
                {cols.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t border-ink-700/50">
                  {cols.map((c) => <td key={c} className="px-3 py-2 font-mono text-mist-300">{String(row[c] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    return <p className="text-sm text-mist-500 text-center py-10">No chart data returned for this configuration.</p>
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="glass-panel rounded-2xl p-5 h-fit space-y-4">
        <h2 className="font-display font-medium text-mist-100 mb-1">Chart Builder</h2>

        <div>
          <label className="block text-xs text-mist-500 mb-1.5">Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-mist-100">
            {CHART_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-mist-500 mb-1.5">X Axis</label>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-mist-100">
            {columns.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {['bar', 'line', 'area', 'scatter'].includes(chartType) && (
          <div>
            <label className="block text-xs text-mist-500 mb-1.5">Y Axis (optional)</label>
            <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-mist-100">
              <option value="">— count of X —</option>
              {columns.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {yAxis && ['bar', 'line', 'area'].includes(chartType) && (
          <div>
            <label className="block text-xs text-mist-500 mb-1.5">Aggregation</label>
            <select value={aggregation} onChange={(e) => setAggregation(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-mist-100">
              {AGGREGATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-scan-500 text-ink-950 font-medium py-2.5 rounded-lg hover:bg-scan-400 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Building…' : 'Generate Chart'}
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-6 min-h-[400px]">
        {error && <p className="text-quality-bad text-sm text-center py-10">{error}</p>}
        {!error && !result && <p className="text-mist-500 text-sm text-center py-20">Configure a chart on the left and click Generate.</p>}
        {!error && result && renderChart()}
      </div>
    </div>
  )
}
