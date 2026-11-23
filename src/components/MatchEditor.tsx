import { useAppStore } from '../store/AppStore'
import type { MatchInfo } from '../types'

function parseCoaches(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function MatchEditor({ weekId, match }: { weekId: string; match: MatchInfo }) {
  const { data, updateMatch, removeMatch } = useAppStore()

  const toggleSquadPlayer = (playerId: string) => {
    const next = match.squad.includes(playerId) ? match.squad.filter((id) => id !== playerId) : [...match.squad, playerId]
    updateMatch(weekId, match.id, { squad: next })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          {match.homeTeam || 'Home team'} vs {match.awayTeam || 'Away team'}
        </h3>
        <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => removeMatch(weekId, match.id)}>
          Remove match
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <LabeledInput label="Day" value={match.day} onChange={(v) => updateMatch(weekId, match.id, { day: v })} />
        <LabeledInput label="Date" value={match.date} onChange={(v) => updateMatch(weekId, match.id, { date: v })} />
        <LabeledInput label="Time" value={match.time} onChange={(v) => updateMatch(weekId, match.id, { time: v })} />
        <LabeledInput label="Venue" value={match.venue} onChange={(v) => updateMatch(weekId, match.id, { venue: v })} />
        <LabeledInput label="Home team" value={match.homeTeam} onChange={(v) => updateMatch(weekId, match.id, { homeTeam: v })} />
        <LabeledInput label="Away team" value={match.awayTeam} onChange={(v) => updateMatch(weekId, match.id, { awayTeam: v })} />
        <LabeledInput label="Alt venue" value={match.altVenue ?? ''} onChange={(v) => updateMatch(weekId, match.id, { altVenue: v || undefined })} />
        <LabeledInput
          label="Coaches (comma separated)"
          value={match.coaches.join(', ')}
          onChange={(v) => updateMatch(weekId, match.id, { coaches: parseCoaches(v) })}
        />
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs font-medium uppercase text-slate-500">Squad ({match.squad.length})</p>
        <div className="flex flex-wrap gap-1">
          {data.players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => toggleSquadPlayer(player.id)}
              className={`rounded-full px-2 py-1 text-xs ${
                match.squad.includes(player.id) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {player.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      <input
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-800"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
