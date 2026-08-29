import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { uploadDataset } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

const ACCEPTED_EXTENSIONS = ['csv', 'xlsx', 'xls', 'json']
const MAX_SIZE_MB = 100

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

export default function Upload() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle | uploading | analyzing | error
  const [error, setError] = useState('')

  const validateAndSetFile = (selected) => {
    setError('')
    if (!selected) return
    const ext = selected.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file format ".${ext}". Please upload a CSV, XLSX, XLS, or JSON file.`)
      return
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds the ${MAX_SIZE_MB} MB size limit.`)
      return
    }
    setFile(selected)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    validateAndSetFile(e.dataTransfer.files?.[0])
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setError('')
    try {
      const res = await uploadDataset(file, (evt) => {
        const pct = Math.round((evt.loaded * 100) / evt.total)
        setProgress(pct)
        if (pct === 100) setStatus('analyzing')
      })
      navigate(`/app/datasets/${res.data.id}`)
    } catch (err) {
      setStatus('error')
      setError(getErrorMessage(err, 'Upload failed. Please try again.'))
    }
  }

  const reset = () => {
    setFile(null)
    setProgress(0)
    setStatus('idle')
    setError('')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-semibold text-2xl text-mist-100 mb-1">Upload Dataset</h1>
      <p className="text-mist-500 text-sm mb-8">
        CSV, XLSX, XLS, or JSON — up to {MAX_SIZE_MB} MB. Analysis starts automatically after upload.
      </p>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-scan-400 bg-scan-500/5' : 'border-ink-600 hover:border-ink-500'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={(e) => validateAndSetFile(e.target.files?.[0])}
          />
          <div className="w-14 h-14 rounded-full bg-scan-500/10 text-scan-400 flex items-center justify-center mx-auto mb-4">
            <UploadCloud size={26} />
          </div>
          <p className="text-mist-100 font-medium mb-1">Drag and drop your file here</p>
          <p className="text-mist-500 text-sm">or click to browse from your computer</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-scan-500/10 text-scan-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-mist-100 font-medium truncate">{file.name}</p>
                <p className="text-mist-500 text-xs">{formatBytes(file.size)}</p>
              </div>
            </div>
            {status === 'idle' && (
              <button onClick={reset} className="text-mist-500 hover:text-mist-100 shrink-0">
                <X size={18} />
              </button>
            )}
          </div>

          {status === 'uploading' && (
            <div className="mb-5">
              <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full bg-scan-500 transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-mist-500 mt-2">Uploading… {progress}%</p>
            </div>
          )}

          {status === 'analyzing' && (
            <div className="mb-5 flex items-center gap-2 text-sm text-scan-400">
              <Loader2 size={16} className="animate-spin" />
              Running data health check, profiling, and statistical analysis…
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm text-quality-bad bg-quality-bad/10 border border-quality-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {(status === 'idle' || status === 'error') && (
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                className="flex-1 bg-scan-500 text-ink-950 font-medium py-2.5 rounded-lg hover:bg-scan-400 transition-colors"
              >
                Analyze Dataset
              </button>
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-lg border border-ink-600 text-mist-300 hover:border-ink-500 transition-colors"
              >
                Re-upload
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
