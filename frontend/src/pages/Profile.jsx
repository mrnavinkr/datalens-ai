import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../api/endpoints'
import { getErrorMessage } from '../api/client'
import { useTheme } from '../context/ThemeContext.jsx'
import { Sun, Moon } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {}
      if (name !== user?.name) payload.name = name
      if (password) payload.password = password
      await updateProfile(payload)
      setMessage('Profile updated successfully.')
      setPassword('')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display font-semibold text-2xl text-mist-100 mb-6">Profile</h1>

      <div className="glass-panel rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-mist-100">Appearance</p>
          <p className="text-xs text-mist-500 mt-0.5">Switch between light and dark mode.</p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-ink-600 text-mist-300 hover:border-scan-500/50 text-sm"
        >
          {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-4">
        {message && <div className="text-sm text-quality-good bg-quality-good/10 border border-quality-good/30 rounded-lg px-3 py-2">{message}</div>}
        {error && <div className="text-sm text-quality-bad bg-quality-bad/10 border border-quality-bad/30 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="block text-xs font-medium text-mist-300 mb-1.5">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-mist-100 focus:border-scan-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-mist-300 mb-1.5">Email</label>
          <input value={user?.email || ''} disabled className="w-full bg-ink-700/50 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-mist-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-mist-300 mb-1.5">New password (optional)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-mist-100 focus:border-scan-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-scan-500 text-ink-950 font-medium px-5 py-2.5 rounded-lg hover:bg-scan-400 disabled:opacity-60 transition-colors text-sm"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
