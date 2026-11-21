import { useState } from 'react'
import { AppStoreProvider } from './store/AppStore'
import { WeekList } from './components/WeekList'
import { PlayerManager } from './components/PlayerManager'
import { SummaryTable } from './components/SummaryTable'
import { ImportExportBar } from './components/ImportExportBar'

type Tab = 'weeks' | 'players' | 'summary'

const TABS: { id: Tab; label: string }[] = [
  { id: 'weeks', label: 'Weeks & matches' },
  { id: 'players', label: 'Players' },
  { id: 'summary', label: 'Call-up summary' },
]

function App() {
  const [tab, setTab] = useState<Tab>('weeks')

  return (
    <AppStoreProvider>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Futsal Match Call-ups</h1>
          <ImportExportBar />
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
    </AppStoreProvider>
  )
}

export default App
