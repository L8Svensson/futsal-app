import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { seedData } from '../data/seedData'
import type { AppData, MatchInfo, Player, Week } from '../types'

const STORAGE_KEY = 'futsal-app-data'

interface AppStoreValue {
  data: AppData
  addPlayer: (name: string) => void
  renamePlayer: (id: string, name: string) => void
  removePlayer: (id: string) => void
  addWeek: (label: string) => void
  removeWeek: (weekId: string) => void
  addMatch: (weekId: string) => void
  updateMatch: (weekId: string, matchId: string, patch: Partial<MatchInfo>) => void
  removeMatch: (weekId: string, matchId: string) => void
  replaceAll: (data: AppData) => void
  resetToSeed: () => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

let idCounter = Date.now()
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}${idCounter}`
}

function emptyMatch(): MatchInfo {
  return {
    id: nextId('m'),
    day: '',
    date: '',
    time: '',
    homeTeam: '',
    awayTeam: '',
    venue: '',
    squad: [],
    coaches: [],
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorageState<AppData>(STORAGE_KEY, seedData)

  const addPlayer = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setData((prev) => ({ ...prev, players: [...prev.players, { id: nextId('p'), name: trimmed } satisfies Player] }))
    },
    [setData],
  )

  const renamePlayer = useCallback(
    (id: string, name: string) => {
      setData((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
      }))
    },
    [setData],
  )

  const removePlayer = useCallback(
    (id: string) => {
      setData((prev) => ({
        players: prev.players.filter((p) => p.id !== id),
        weeks: prev.weeks.map((week) => ({
          ...week,
          matches: week.matches.map((match) => ({
            ...match,
            squad: match.squad.filter((playerId) => playerId !== id),
            altSquad: match.altSquad?.filter((playerId) => playerId !== id),
          })),
        })),
      }))
    },
    [setData],
  )

  const addWeek = useCallback(
    (label: string) => {
      const trimmed = label.trim()
      if (!trimmed) return
      setData((prev) => ({ ...prev, weeks: [...prev.weeks, { id: nextId('w'), label: trimmed, matches: [] } satisfies Week] }))
    },
    [setData],
  )

  const removeWeek = useCallback(
    (weekId: string) => {
      setData((prev) => ({ ...prev, weeks: prev.weeks.filter((w) => w.id !== weekId) }))
    },
    [setData],
  )

  const addMatch = useCallback(
    (weekId: string) => {
      setData((prev) => ({
        ...prev,
        weeks: prev.weeks.map((week) =>
          week.id === weekId && week.matches.length < 2 ? { ...week, matches: [...week.matches, emptyMatch()] } : week,
        ),
      }))
    },
    [setData],
  )

  const updateMatch = useCallback(
    (weekId: string, matchId: string, patch: Partial<MatchInfo>) => {
      setData((prev) => ({
        ...prev,
        weeks: prev.weeks.map((week) =>
          week.id !== weekId
            ? week
            : {
                ...week,
                matches: week.matches.map((match) => (match.id === matchId ? { ...match, ...patch } : match)),
              },
        ),
      }))
    },
    [setData],
  )

  const removeMatch = useCallback(
    (weekId: string, matchId: string) => {
      setData((prev) => ({
        ...prev,
        weeks: prev.weeks.map((week) =>
          week.id !== weekId ? week : { ...week, matches: week.matches.filter((m) => m.id !== matchId) },
        ),
      }))
    },
    [setData],
  )

  const replaceAll = useCallback(
    (next: AppData) => {
      setData(next)
    },
    [setData],
  )

  const resetToSeed = useCallback(() => {
    setData(seedData)
  }, [setData])

  const value = useMemo<AppStoreValue>(
    () => ({ data, addPlayer, renamePlayer, removePlayer, addWeek, removeWeek, addMatch, updateMatch, removeMatch, replaceAll, resetToSeed }),
    [data, addPlayer, renamePlayer, removePlayer, addWeek, removeWeek, addMatch, updateMatch, removeMatch, replaceAll, resetToSeed],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within an AppStoreProvider')
  return ctx
}
