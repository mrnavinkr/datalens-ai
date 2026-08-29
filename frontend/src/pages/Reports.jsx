import { useState } from 'react'
import { FileText, FileSpreadsheet, FileDown, Loader2 } from 'lucide-react'
import { generateReport } from '../api/endpoints'
import client, { getErrorMessage } from '../api/client'
import { useParams } from 'react-router-dom'

const FORMATS = [
  {
    id: 'pdf',
    label: 'PDF Report',
    icon: FileText,
    desc: 'Full narrative report with all sections, ready to share.',
  },
  {
    id: 'xlsx',
    label: 'Excel Summary',
    icon: FileSpreadsheet,
    desc: 'Summary, column statistics, and findings across sheets.',
  },
  {
    id: 'csv',
    label: 'CSV Analysis Summary',
    icon: FileDown,
    desc: 'Flat summary of key stats for further processing.',
  },
]

export default function Reports() {
  const { id } = useParams()

  const [generating, setGenerating] = useState(null)
  const [error, setError] = useState('')
  const [lastGenerated, setLastGenerated] = useState(null)

  const handleGenerate = async (format) => {
    setGenerating(format)
    setError('')

    try {
      const res = await generateReport(id, format)
      setLastGenerated(res.data)

      const reportId = res.data.id
      const downloadPath = `/api/reports/${reportId}/download`

      const response = await client.get(downloadPath, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `datalens-report.${format}`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          'Could not generate or download this report.'
        )
      )
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div>
      <p className="text-sm text-mist-500 mb-6">
        Export the complete analysis — dataset overview, data health, quality
        score, column statistics, missing values, duplicates, correlations,
        and recommendations.
      </p>

      {error && (
        <div className="mb-5 text-sm text-quality-bad bg-quality-bad/10 border border-quality-bad/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        {FORMATS.map(({ id: fmt, label, icon: Icon, desc }) => (
          <div
            key={fmt}
            className="glass-panel rounded-2xl p-6 flex flex-col"
          >
            <div className="w-10 h-10 rounded-lg bg-scan-500/10 text-scan-400 flex items-center justify-center mb-4">
              <Icon size={20} />
            </div>

            <h3 className="font-display font-medium text-mist-100 mb-1.5">
              {label}
            </h3>

            <p className="text-xs text-mist-500 mb-5 flex-1">
              {desc}
            </p>

            <button
              onClick={() => handleGenerate(fmt)}
              disabled={generating === fmt}
              className="w-full flex items-center justify-center gap-2 bg-scan-500 text-ink-950 font-medium py-2.5 rounded-lg hover:bg-scan-400 disabled:opacity-60 transition-colors text-sm"
            >
              {generating === fmt ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate & Download'
              )}
            </button>
          </div>
        ))}
      </div>

      {lastGenerated && (
        <p className="text-xs text-mist-500 mt-5">
          Last generated:{' '}
          {lastGenerated.format?.toUpperCase() || 'REPORT'} report —
          downloaded successfully.
        </p>
      )}
    </div>
  )
}