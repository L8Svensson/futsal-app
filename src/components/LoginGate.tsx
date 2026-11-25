import { useState, type FormEvent } from 'react'
import { useAppStore } from '../store/AppStore'

export function LoginScreen() {
  const { signIn } = useAppStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    const ok = await signIn(password)
    setChecking(false)
    if (!ok) setError('Wrong password')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Futsal Match Call-ups</h1>
        <p className="text-sm text-slate-500">Enter the shared password to continue.</p>
        <input
          type="password"
          autoFocus
          placeholder="Password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={checking || !password}
          className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {checking ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}

export function SignOutButton() {
  const { signOut } = useAppStore()
  return (
    <button type="button" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50" onClick={signOut}>
      Log out
    </button>
  )
}
