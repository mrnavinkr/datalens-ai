export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="26" height="26" rx="7" stroke="#2DD4BF" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="6.5" stroke="#2DD4BF" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="2" fill="#2DD4BF" />
        <path d="M14 4V7.5M14 20.5V24M4 14H7.5M20.5 14H24" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="font-display font-semibold text-lg tracking-tight text-mist-100">
        DataLens <span className="text-scan-400">AI</span>
      </span>
    </div>
  )
}
