import { useState } from 'react'
import { useAppStore } from '../store/AppStore'

export function PlayerManager() {
  const { data, addPlayer, renamePlayer, removePlayer } = useAppStore()
  const [newName, setNewName] = useState('')

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addPlayer(newName)
          setNewName('')
        }}
      >
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="New player name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Add player
        </button>
      </form>

      <ul className="divide-y divide-slate-200 rounded border border-slate-200">
        {data.players
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((player) => (
            <li key={player.id} className="flex items-center gap-2 px-3 py-2">
              <input
                className="flex-1 rounded border border-transparent px-2 py-1 text-sm hover:border-slate-300 focus:border-slate-300"
                value={player.name}
                onChange={(e) => renamePlayer(player.id, e.target.value)}
              />
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={() => removePlayer(player.id)}
              >
                Remove
              </button>
            </li>
          ))}
        {data.players.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No players yet.</li>}
      </ul>
    </div>
  )
}
