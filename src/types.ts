export interface Player {
  id: string
  name: string
}

export const COACH_NAMES = ['Lotta', 'Nina', 'Jonas', 'Peter', 'Mattias'] as const

export interface MatchInfo {
  id: string
  day: string
  date: string
  time: string
  homeTeam: string
  awayTeam: string
  venue: string
  altVenue?: string
  /** Player ids called up for this match. */
  squad: string[]
  /** Names from COACH_NAMES picked for this match. */
  coaches: string[]
}

export interface Week {
  id: string
  label: string
  matches: MatchInfo[]
}

export interface AppData {
  players: Player[]
  weeks: Week[]
}
