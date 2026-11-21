import { useState } from 'react'
import { useAppStore } from '../store/AppStore'
import { MatchEditor } from './MatchEditor'

export function WeekList() {
  const { data, addWeek, removeWeek, addMatch } = useAppStore()
  const [newLabel, setNewLabel] = useState('')

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addWeek(newLabel)
          setNewLabel('')
        }}
      >
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g. Vecka 10"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Add week
        </button>
      </form>

      {data.weeks.map((week) => (
        <section key={week.id} className="space-y-3 rounded-lg border border-slate-300 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">{week.label}</h2>
            <div className="flex gap-2">
              {week.matches.length < 2 && (
                <button type="button" className="text-xs font-medium text-emerald-700 hover:underline" onClick={() => addMatch(week.id)}>
                  + Add match
                </button>
              )}
              <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => removeWeek(week.id)}>
                Remove week
              </button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {week.matches.map((match) => (
              <MatchEditor key={match.id} weekId={week.id} match={match} />
            ))}
            {week.matches.length === 0 && <p className="text-sm text-slate-400">No matches yet.</p>}
          </div>
        </section>
      ))}
      {data.weeks.length === 0 && <p className="text-sm text-slate-400">No weeks yet. Add one above, or import an Excel file.</p>}
    </div>
  )
}
