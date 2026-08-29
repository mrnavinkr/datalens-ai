export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'scan' }) {
  const accentClasses = {
    scan: 'text-scan-400 bg-scan-500/10',
    warn: 'text-quality-warn bg-quality-warn/10',
    bad: 'text-quality-bad bg-quality-bad/10',
    good: 'text-quality-good bg-quality-good/10',
  }

  return (
    <div className="glass-panel rounded-xl p-4 flex items-start gap-3">
      {Icon && (
        <div className={`shrink-0 rounded-lg p-2 ${accentClasses[accent] || accentClasses.scan}`}>
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-mist-500 font-medium truncate">{label}</p>
        <p className="text-xl font-mono font-semibold text-mist-100 mt-0.5">{value}</p>
        {sublabel && <p className="text-xs text-mist-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
