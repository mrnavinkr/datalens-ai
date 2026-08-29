import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Send, Search, HeartPulse, BarChart3, Lightbulb, Target, FileText, Bot, User } from 'lucide-react'
import { sendChatMessage } from '../api/endpoints'
import { getErrorMessage } from '../api/client'

const MODES = [
  { id: 'explorer', label: 'Data Explorer', icon: Search, desc: 'Answers dataset questions' },
  { id: 'health', label: 'Data Health', icon: HeartPulse, desc: 'Missing values, duplicates, quality' },
  { id: 'visualization', label: 'Visualization', icon: BarChart3, desc: 'Suggests useful charts' },
  { id: 'insight', label: 'Insight', icon: Lightbulb, desc: 'Explains statistical patterns' },
  { id: 'recommendation', label: 'Recommendation', icon: Target, desc: 'What to check next' },
  { id: 'report', label: 'Report', icon: FileText, desc: 'Human-readable summary' },
]

const SUGGESTIONS = [
  'Give me a complete summary of this dataset.',
  'Which column has the most missing values?',
  'Is my dataset clean?',
  'What are the biggest problems?',
]

export default function AIDataAnalyst() {
  const { id } = useParams()
  const [mode, setMode] = useState('explorer')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleModeChange = (m) => {
    setMode(m)
    setSessionId(null)
    setMessages([])
    setError('')
  }

  const handleSend = async (text) => {
    const question = (text ?? input).trim()
    if (!question || sending) return
    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: question, id: `local-${Date.now()}` }])
    setSending(true)
    try {
      const res = await sendChatMessage({ dataset_id: id, mode, message: question, session_id: sessionId })
      setSessionId(res.data.session_id)
      setMessages((prev) => [...prev, res.data.reply])
    } catch (err) {
      setError(getErrorMessage(err, 'The AI assistant could not respond. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      <div className="space-y-1.5">
        {MODES.map(({ id: modeId, label, icon: Icon, desc }) => (
          <button
            key={modeId}
            onClick={() => handleModeChange(modeId)}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors ${
              mode === modeId ? 'border-scan-500/50 bg-scan-500/10' : 'border-ink-700 hover:border-ink-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={15} className={mode === modeId ? 'text-scan-400' : 'text-mist-500'} />
              <span className={`text-sm font-medium ${mode === modeId ? 'text-scan-400' : 'text-mist-100'}`}>{label}</span>
            </div>
            <p className="text-xs text-mist-500 mt-0.5 ml-6">{desc}</p>
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-2xl flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {messages.length === 0 && (
            <div>
              <p className="text-mist-500 text-sm mb-4">Ask anything about this dataset — every answer is grounded in the computed analysis.</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs text-mist-300 border border-ink-600 rounded-full px-3 py-1.5 hover:border-scan-500/50 hover:text-scan-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-scan-500/15 text-scan-400 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-scan-500 text-ink-950' : 'bg-ink-700 text-mist-100'
              }`}>
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-ink-700 text-mist-300 flex items-center justify-center shrink-0">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-scan-500/15 text-scan-400 flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-ink-700 rounded-2xl px-4 py-2.5 text-sm text-mist-500">Thinking…</div>
            </div>
          )}

          {error && <p className="text-quality-bad text-xs">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="border-t border-ink-700 p-3 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this dataset…"
            className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3.5 py-2.5 text-sm text-mist-100 focus:border-scan-500 outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-scan-500 text-ink-950 p-2.5 rounded-lg hover:bg-scan-400 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
