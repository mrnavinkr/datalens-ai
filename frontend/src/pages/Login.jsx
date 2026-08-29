import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not log in. Check your credentials and try again.'))
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
          <h1 className="font-display font-semibold text-xl text-mist-100 mb-1">Welcome back</h1>
          <p className="text-sm text-mist-500 mb-6">Log in to continue to your datasets.</p>

          {error && (
            <div className="mb-4 text-sm text-quality-bad bg-quality-bad/10 border border-quality-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-scan-500 text-ink-950 font-medium py-2.5 rounded-lg hover:bg-scan-400 disabled:opacity-60 transition-colors"
            >
              <LogIn size={16} />
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="text-sm text-mist-500 mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-scan-400 hover:text-scan-300">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
