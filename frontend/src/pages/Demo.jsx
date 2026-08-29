import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Rows3, Columns3, TriangleAlert, Copy, CircleCheck } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import Footer from '../components/Footer.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'
import StatCard from '../components/StatCard.jsx'
import { getDemoAnalysis } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

export default function Demo() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDemoAnalysis()
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load the demo analysis.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-ink-900">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/"><Logo /></Link>
        <Link to="/register" className="text-sm font-medium bg-scan-500 text-ink-950 px-4 py-2 rounded-lg hover:bg-scan-400 transition-colors">
          Analyze your own data
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-mist-500 hover:text-mist-100 text-sm mb-5">
          <ArrowLeft size={14} /> Back home
        </Link>

        {loading && <p className="text-mist-500 text-sm text-center py-20">Loading demo analysis…</p>}
        {error && <p className="text-quality-bad text-sm text-center py-20">{error}</p>}

        {data && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <span className="inline-block text-xs font-mono tracking-wider text-scan-400 border border-scan-500/30 bg-scan-500/5 rounded-full px-3 py-1 mb-3">
                  DEMO DATASET
                </span>
                <h1 className="font-display font-semibold text-2xl text-mist-100">{data.dataset_name}</h1>
              </div>
              <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-quality-good/10 text-quality-good">
                {data.overview.usability_status}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-around gap-8">
              <ScoreGauge score={data.overview.quality_score} label="Data Quality" />
              <ScoreGauge score={data.overview.usability_score} label="Data Usability" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Rows3} label="Total Rows" value={data.overview.total_rows.toLocaleString()} accent="scan" />
              <StatCard icon={Columns3} label="Total Columns" value={data.overview.total_columns} accent="scan" />
              <StatCard
                icon={TriangleAlert}
                label="Missing Values"
                value={`${data.overview.missing_percentage}%`}
                accent={data.overview.missing_percentage > 10 ? 'bad' : 'warn'}
              />
              <StatCard
                icon={Copy}
                label="Duplicate Rows"
                value={`${data.overview.duplicate_percentage}%`}
                accent={data.overview.duplicate_percentage > 5 ? 'bad' : 'warn'}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="font-display font-medium text-mist-100 mb-4 flex items-center gap-2">
                  <CircleCheck size={17} className="text-quality-good" /> Strengths
                </h2>
                <ul className="space-y-2.5">
                  {data.health.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-mist-300 flex gap-2"><span className="text-quality-good mt-0.5">✓</span> {s}</li>
                  ))}
                </ul>
              </div>
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="font-display font-medium text-mist-100 mb-4 flex items-center gap-2">
                  <TriangleAlert size={17} className="text-quality-warn" /> Problems
                </h2>
                <ul className="space-y-2.5">
                  {data.health.problems.map((p, i) => (
                    <li key={i} className="text-sm text-mist-300 flex gap-2"><span className="text-quality-warn mt-0.5">⚠</span> {p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mt-10">
              <p className="text-mist-300 mb-4">Want this for your own dataset?</p>
              <Link to="/register" className="inline-block bg-scan-500 text-ink-950 font-medium px-6 py-3 rounded-lg hover:bg-scan-400 transition-colors">
                Create a free account
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
