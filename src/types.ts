export interface Player {
  id: string
  name: string
}

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
  /** Player ids in the alternate/reserve squad, if any. */
  altSquad?: string[]
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
