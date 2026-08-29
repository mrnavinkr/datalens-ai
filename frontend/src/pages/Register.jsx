import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/client'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/app')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="glass-panel rounded-2xl p-7">
          <h1 className="font-display font-semibold text-xl text-mist-100 mb-1">Create your account</h1>
          <p className="text-sm text-mist-500 mb-6">Start analyzing your datasets in minutes.</p>

          {error && (
            <div className="mb-4 text-sm text-quality-bad bg-quality-bad/10 border border-quality-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-mist-300 mb-1.5" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-mist-100 focus:border-scan-500 outline-none transition-colors"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mist-300 mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-mist-100 focus:border-scan-500 outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-mist-300 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2.5 text-sm text-mist-100 focus:border-scan-500 outline-none transition-colors"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-scan-500 text-ink-950 font-medium py-2.5 rounded-lg hover:bg-scan-400 disabled:opacity-60 transition-colors"
            >
              <UserPlus size={16} />
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-mist-500 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-scan-400 hover:text-scan-300">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
