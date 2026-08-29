/**
 * ScoreGauge — the platform's signature visual: a diagnostic "scan ring"
 * that reads a 0-100 score, like a vital-sign monitor for a dataset.
 * Color shifts from coral (poor) through amber (fair) to teal (excellent).
 */
function scoreColor(score) {
  if (score >= 85) return '#2DD4BF' // scan-500
  if (score >= 70) return '#5EEAD4' // scan-400
  if (score >= 50) return '#F59E0B' // warn
  return '#FB7185' // bad
}

export default function ScoreGauge({ score = 0, label = '', size = 132, strokeWidth = 9 }) {
  const clamped = Math.max(0, Math.min(100, score))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const color = scoreColor(clamped)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1A2740"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-semibold text-2xl text-mist-100">{Math.round(clamped)}</span>
          <span className="font-mono text-[10px] text-mist-500">/ 100</span>
        </div>
      </div>
      {label && <span className="text-sm text-mist-300 font-medium">{label}</span>}
    </div>
  )
}
