import { useMemo } from 'react'
import { useAppStore } from '../store/AppStore'

export function SummaryTable() {
  const { data } = useAppStore()

  const rows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const week of data.weeks) {
      for (const match of week.matches) {
        for (const playerId of match.squad) {
          counts.set(playerId, (counts.get(playerId) ?? 0) + 1)
        }
      }
    }
    return data.players
      .map((player) => ({ name: player.name, count: counts.get(player.id) ?? 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [data])

  return (
    <table className="w-full max-w-md border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-300 text-left text-slate-500">
          <th className="py-2">Player</th>
          <th className="py-2 text-right">Call-ups</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-slate-100">
            <td className="py-1.5">{row.name}</td>
            <td className="py-1.5 text-right font-medium">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
