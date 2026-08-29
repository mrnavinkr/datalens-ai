import { useOutletContext } from 'react-router-dom'
import {
  Rows3, Columns3, Grid3x3, HardDrive, TriangleAlert, CircleCheck, Sigma, Copy,
} from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

export default function DatasetOverview() {
  const { overview, health } = useOutletContext()

  return (
    <div>
      <div className="glass-panel rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-around gap-8">
        <ScoreGauge score={overview.quality_score} label="Data Quality" />
        <ScoreGauge score={overview.usability_score} label="Data Usability" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Rows3} label="Total Rows" value={overview.total_rows.toLocaleString()} accent="scan" />
        <StatCard icon={Columns3} label="Total Columns" value={overview.total_columns} accent="scan" />
        <StatCard icon={Grid3x3} label="Total Cells" value={overview.total_cells.toLocaleString()} accent="scan" />
        <StatCard icon={HardDrive} label="Memory Usage" value={formatBytes(overview.memory_usage_bytes)} accent="scan" />
        <StatCard icon={Sigma} label="Numeric Columns" value={overview.numeric_columns} accent="good" />
        <StatCard icon={Sigma} label="Categorical Columns" value={overview.categorical_columns} accent="good" />
        <StatCard
          icon={TriangleAlert}
          label="Missing Values"
          value={`${overview.missing_percentage}%`}
          sublabel={`${overview.total_missing_values.toLocaleString()} cells`}
          accent={overview.missing_percentage > 10 ? 'bad' : overview.missing_percentage > 3 ? 'warn' : 'good'}
        />
        <StatCard
          icon={Copy}
          label="Duplicate Rows"
          value={`${overview.duplicate_percentage}%`}
          sublabel={`${overview.duplicate_rows.toLocaleString()} rows`}
          accent={overview.duplicate_percentage > 5 ? 'bad' : overview.duplicate_percentage > 1 ? 'warn' : 'good'}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display font-medium text-mist-100 mb-4 flex items-center gap-2">
            <CircleCheck size={17} className="text-quality-good" /> Strengths
          </h2>
          {health.strengths.length === 0 ? (
            <p className="text-sm text-mist-500">No notable strengths detected.</p>
          ) : (
            <ul className="space-y-2.5">
              {health.strengths.map((s, i) => (
                <li key={i} className="text-sm text-mist-300 flex gap-2">
                  <span className="text-quality-good mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display font-medium text-mist-100 mb-4 flex items-center gap-2">
            <TriangleAlert size={17} className="text-quality-warn" /> Problems
          </h2>
          {health.problems.length === 0 ? (
            <p className="text-sm text-mist-500">No significant problems detected.</p>
          ) : (
            <ul className="space-y-2.5">
              {health.problems.map((p, i) => (
                <li key={i} className="text-sm text-mist-300 flex gap-2">
                  <span className="text-quality-warn mt-0.5">⚠</span> {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {health.key_findings.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <h2 className="font-display font-medium text-mist-100 mb-4">Key Findings</h2>
          <ol className="space-y-2.5">
            {health.key_findings.map((f, i) => (
              <li key={i} className="text-sm text-mist-300 flex gap-3">
                <span className="font-mono text-scan-400 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                {f}
              </li>
            ))}
          </ol>
        </div>
      )}

      {health.recommended_actions.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display font-medium text-mist-100 mb-4">Recommended Actions</h2>
          <ol className="space-y-2.5">
            {health.recommended_actions.map((a, i) => (
              <li key={i} className="text-sm text-mist-300 flex gap-3">
                <span className="font-mono text-scan-400 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
