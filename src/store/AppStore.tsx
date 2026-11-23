import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { seedData } from '../data/seedData'
import type { AppData, MatchInfo, Player, Week } from '../types'

const EDIT_PASSWORD_SESSION_KEY = 'futsal-edit-password'

interface AppStoreValue {
  data: AppData
  loading: boolean
  loadError: string | null
  isEditUnlocked: boolean
  unlockEditing: (password: string) => Promise<boolean>
  lockEditing: () => void
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
  return { id: nextId('m'), day: '', date: '', time: '', homeTeam: '', awayTeam: '', venue: '', squad: [], coaches: [] }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({ players: [], weeks: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editPassword, setEditPassword] = useState<string | null>(() => sessionStorage.getItem(EDIT_PASSWORD_SESSION_KEY))
  const dataRef = useRef(data)
  dataRef.current = data

  // Initial load + realtime subscription so every open tab stays in sync.
  useEffect(() => {
    if (!supabase) {
      setLoadError('Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
      setLoading(false)
      return
    }

    let cancelled = false
    const client = supabase
    client
      .from('app_state')
      .select('data')
      .eq('id', 1)
      .single()
      .then(({ data: row, error }) => {
        if (cancelled) return
        if (error) setLoadError(error.message)
        else setData((row?.data as AppData) ?? { players: [], weeks: [] })
        setLoading(false)
      })

    const channel = client
      .channel('app_state_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.1' }, (payload) => {
        setData(payload.new.data as AppData)
      })
      .subscribe()

    return () => {
      cancelled = true
      client.removeChannel(channel)
    }
  }, [])

  const unlockEditing = useCallback(async (password: string) => {
    if (!supabase) return false
    const { data: ok, error } = await supabase.rpc('check_edit_password', { pw: password })
    if (error || !ok) return false
    sessionStorage.setItem(EDIT_PASSWORD_SESSION_KEY, password)
    setEditPassword(password)
    return true
  }, [])

  const lockEditing = useCallback(() => {
    sessionStorage.removeItem(EDIT_PASSWORD_SESSION_KEY)
    setEditPassword(null)
  }, [])

  // Optimistically applies `next` locally, then persists to Supabase; rolls
  // back and surfaces an alert if the write is rejected (e.g. bad/missing password).
  const persist = useCallback(
    (next: AppData) => {
      const previous = dataRef.current
      setData(next)
      if (!supabase) return
      if (!editPassword) {
        setData(previous)
        window.alert('Editing is locked. Unlock it with the shared password first.')
        return
      }
      supabase.rpc('update_app_data', { payload: next, pw: editPassword }).then(({ error }) => {
        if (error) {
          setData(previous)
          window.alert(`Could not save: ${error.message}`)
        }
      })
    },
    [editPassword],
  )

  const addPlayer = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      persist({ ...dataRef.current, players: [...dataRef.current.players, { id: nextId('p'), name: trimmed } satisfies Player] })
    },
    [persist],
  )

  const renamePlayer = useCallback(
    (id: string, name: string) => {
      persist({ ...dataRef.current, players: dataRef.current.players.map((p) => (p.id === id ? { ...p, name } : p)) })
    },
    [persist],
  )

  const removePlayer = useCallback(
    (id: string) => {
      persist({
        players: dataRef.current.players.filter((p) => p.id !== id),
        weeks: dataRef.current.weeks.map((week) => ({
          ...week,
          matches: week.matches.map((match) => ({ ...match, squad: match.squad.filter((playerId) => playerId !== id) })),
        })),
      })
    },
    [persist],
  )

  const addWeek = useCallback(
    (label: string) => {
      const trimmed = label.trim()
      if (!trimmed) return
      persist({ ...dataRef.current, weeks: [...dataRef.current.weeks, { id: nextId('w'), label: trimmed, matches: [] } satisfies Week] })
    },
    [persist],
  )

  const removeWeek = useCallback(
    (weekId: string) => {
      persist({ ...dataRef.current, weeks: dataRef.current.weeks.filter((w) => w.id !== weekId) })
    },
    [persist],
  )

  const addMatch = useCallback(
    (weekId: string) => {
      persist({
        ...dataRef.current,
        weeks: dataRef.current.weeks.map((week) =>
          week.id === weekId && week.matches.length < 2 ? { ...week, matches: [...week.matches, emptyMatch()] } : week,
        ),
      })
    },
    [persist],
  )

  const updateMatch = useCallback(
    (weekId: string, matchId: string, patch: Partial<MatchInfo>) => {
      persist({
        ...dataRef.current,
        weeks: dataRef.current.weeks.map((week) =>
          week.id !== weekId
            ? week
            : { ...week, matches: week.matches.map((match) => (match.id === matchId ? { ...match, ...patch } : match)) },
        ),
      })
    },
    [persist],
  )

  const removeMatch = useCallback(
    (weekId: string, matchId: string) => {
      persist({
        ...dataRef.current,
        weeks: dataRef.current.weeks.map((week) =>
          week.id !== weekId ? week : { ...week, matches: week.matches.filter((m) => m.id !== matchId) },
        ),
      })
    },
    [persist],
  )

  const replaceAll = useCallback((next: AppData) => persist(next), [persist])
  const resetToSeed = useCallback(() => persist(seedData), [persist])

  const value = useMemo<AppStoreValue>(
    () => ({
      data,
      loading,
      loadError,
      isEditUnlocked: editPassword !== null,
      unlockEditing,
      lockEditing,
      addPlayer,
      renamePlayer,
      removePlayer,
      addWeek,
      removeWeek,
      addMatch,
      updateMatch,
      removeMatch,
      replaceAll,
      resetToSeed,
    }),
    [
      data,
      loading,
      loadError,
      editPassword,
      unlockEditing,
      lockEditing,
      addPlayer,
      renamePlayer,
      removePlayer,
      addWeek,
      removeWeek,
      addMatch,
      updateMatch,
      removeMatch,
      replaceAll,
      resetToSeed,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within an AppStoreProvider')
  return ctx
}

export { isSupabaseConfigured }
