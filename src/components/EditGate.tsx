import { useState } from 'react'
import { useAppStore } from '../store/AppStore'

export function EditGate() {
  const { isEditUnlocked, unlockEditing, lockEditing } = useAppStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  if (isEditUnlocked) {
    return (
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        onClick={lockEditing}
      >
        🔓 Editing unlocked — lock
      </button>
    )
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setChecking(true)
        setError(null)
        const ok = await unlockEditing(password)
        setChecking(false)
        if (!ok) setError('Wrong password')
        else setPassword('')
      }}
    >
      <input
        type="password"
        placeholder="Edit password"
        className="w-32 rounded border border-slate-300 px-2 py-1.5 text-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={checking || !password}
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
      >
        {checking ? 'Checking…' : '🔒 Unlock editing'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  )
}
