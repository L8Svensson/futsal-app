import { useState } from 'react'
import { AppStoreProvider, useAppStore } from './store/AppStore'
import { WeekList } from './components/WeekList'
import { PlayerManager } from './components/PlayerManager'
import { SummaryTable } from './components/SummaryTable'
import { ImportExportBar } from './components/ImportExportBar'
import { LoginScreen, SignOutButton } from './components/LoginGate'

type Tab = 'weeks' | 'players' | 'summary'

const TABS: { id: Tab; label: string }[] = [
  { id: 'weeks', label: 'Weeks & matches' },
  { id: 'players', label: 'Players' },
  { id: 'summary', label: 'Call-up summary' },
]

function SaveButton() {
  const { saveStatus, saveNow } = useAppStore()
  const label = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Save failed' : 'Save'

  return (
    <button
      type="button"
      onClick={saveNow}
      disabled={saveStatus === 'saving'}
      title="Changes save automatically; this re-confirms everything is saved."
      className={`rounded px-3 py-1.5 text-sm font-medium ${
        saveStatus === 'error'
          ? 'bg-red-600 text-white'
          : saveStatus === 'saved'
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 text-white hover:bg-slate-700'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  )
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('weeks')
  const { loading, loadError, session } = useAppStore()

  if (!session) return <LoginScreen />
  if (loading) return <p className="p-6 text-slate-500">Loading…</p>
  if (loadError) return <p className="p-6 text-red-600">{loadError}</p>

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Futsal Match Call-ups</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton />
          <ImportExportBar />
          <SignOutButton />
        </div>
      </header>

      <nav className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'weeks' && <WeekList />}
        {tab === 'players' && <PlayerManager />}
        {tab === 'summary' && <SummaryTable />}
      </main>
    </div>
  )
}

function App() {
  return (
    <AppStoreProvider>
      <AppShell />
    </AppStoreProvider>
  )
}

export default App
