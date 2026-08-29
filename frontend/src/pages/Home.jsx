import { Link } from 'react-router-dom'
import {
  ScanSearch, HeartPulse, BarChart3, Sigma, Bot, ListChecks, ArrowRight,
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import Footer from '../components/Footer.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'

const FEATURES = [
  { icon: ScanSearch, title: 'Data Profiling', desc: 'Automatic row, column, and type detection the moment you upload — no configuration needed.' },
  { icon: HeartPulse, title: 'Data Health', desc: 'Completeness, validity, consistency, and uniqueness scored from your dataset\u2019s real statistics.' },
  { icon: BarChart3, title: 'Smart Visualizations', desc: 'Distributions, correlations, and outliers charted automatically for every column that matters.' },
  { icon: Sigma, title: 'Statistical Insights', desc: 'Mean, median, skew, IQR, and quartiles computed column-by-column — never estimated.' },
  { icon: Bot, title: 'AI Data Analyst', desc: 'Ask questions about your dataset in plain language and get answers grounded in computed results.' },
  { icon: ListChecks, title: 'Actionable Recommendations', desc: 'A prioritized checklist of exactly what to clean before you move on to analysis.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-ink-900 overflow-x-hidden">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-mist-300 hover:text-mist-100 px-3 py-2 transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-scan-500 text-ink-950 px-4 py-2 rounded-lg hover:bg-scan-400 transition-colors"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-grid-fade pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 relative grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-mono tracking-wider text-scan-400 border border-scan-500/30 bg-scan-500/5 rounded-full px-3 py-1 mb-6">
              AI-POWERED DATA INTELLIGENCE
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.08] text-mist-100 tracking-tight">
              Understand Your Data<br />
              <span className="text-scan-400">Before You Analyze It.</span>
            </h1>
            <p className="mt-6 text-lg text-mist-300 max-w-xl leading-relaxed">
              Upload any dataset and instantly discover its structure, health, quality,
              statistics, patterns, and potential issues — all in one intelligent platform.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="group flex items-center gap-2 bg-scan-500 text-ink-950 font-medium px-6 py-3 rounded-lg hover:bg-scan-400 transition-colors shadow-glow"
              >
                Analyze My Dataset
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/demo"
                className="px-6 py-3 rounded-lg border border-ink-600 text-mist-300 hover:border-scan-500/50 hover:text-mist-100 transition-colors"
              >
                Explore Demo
              </Link>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="glass-panel rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-mist-500 font-mono">Customer_Sales.csv</p>
                <p className="text-sm text-mist-100 font-medium">125,430 rows · 28 columns</p>
              </div>
              <span className="text-xs font-mono text-quality-good bg-quality-good/10 px-2 py-1 rounded-md">GOOD</span>
            </div>
            <div className="flex items-center justify-around py-2">
              <ScoreGauge score={87} label="Quality" size={104} strokeWidth={7} />
              <ScoreGauge score={84} label="Usability" size={104} strokeWidth={7} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-ink-700/60 rounded-lg px-3 py-2 flex justify-between">
                <span className="text-mist-500">Missing</span><span className="text-mist-100">4.82%</span>
              </div>
              <div className="bg-ink-700/60 rounded-lg px-3 py-2 flex justify-between">
                <span className="text-mist-500">Duplicates</span><span className="text-mist-100">1.20%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="font-display text-2xl font-semibold text-mist-100 mb-2">Everything before you write a line of code</h2>
        <p className="text-mist-500 mb-10 max-w-2xl">
          One platform for the complete dataset investigation — profiling, health, statistics,
          visualization, and AI explanation.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel rounded-xl p-5 hover:border-scan-500/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-scan-500/10 text-scan-400 flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-display font-medium text-mist-100 mb-1.5">{title}</h3>
              <p className="text-sm text-mist-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
