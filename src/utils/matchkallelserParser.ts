import type { AppData, MatchInfo, Player, Week } from '../types'

const MATCH_TITLE_RE = /^(\S+)\s+(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s+(.+?)\s-\s(.+)$/

function isBlankRow(row: unknown[] | undefined): boolean {
  if (!row) return true
  return row.every((cell) => cell === null || cell === undefined || cell === '')
}

function parseMatchTitle(title: string | null): Pick<MatchInfo, 'day' | 'date' | 'time' | 'homeTeam' | 'awayTeam'> | null {
  if (!title) return null
  const match = MATCH_TITLE_RE.exec(title.trim())
  if (!match) return null
  const [, day, date, time, homeTeam, awayTeam] = match
  return { day, date, time, homeTeam, awayTeam }
}

/**
 * Parses the "Matchkallelser" sheet (array-of-arrays, `header: 1` layout) into
 * players + weeks. The sheet is laid out as repeating blocks of rows:
 *   1. "Vecka N" week header (col 0)
 *   2. match titles for match 1 (col 0) and match 2 (col 4)
 *   3. venues for match 1 (col 0, optional "Alt:" marker col 2) and match 2 (col 4)
 *   4. one row per squad player: col 0 = match1 squad, col 2 = match1 alt squad,
 *      col 4 = match2 squad, col 6 = match2 alt squad
 *   5. a blank row
 *   6. coach rows: col 0/4 = "Tränare:" (first row only), col 1/5 = coach name
 */
export function parseMatchkallelserRows(rows: unknown[][]): AppData {
  const playersByName = new Map<string, Player>()
  const weeks: Week[] = []
  let playerCounter = 0
  let matchCounter = 0
  let weekCounter = 0

  const getOrCreatePlayer = (rawName: unknown): string | null => {
    if (typeof rawName !== 'string' || rawName.trim() === '') return null
    const name = rawName.trim()
    let player = playersByName.get(name)
    if (!player) {
      playerCounter += 1
      player = { id: `p${playerCounter}`, name }
      playersByName.set(name, player)
    }
    return player.id
  }

  let i = 0
  while (i < rows.length) {
    const weekHeader = rows[i]?.[0]
    if (typeof weekHeader !== 'string' || !weekHeader.startsWith('Vecka')) {
      i += 1
      continue
    }
    weekCounter += 1
    const weekLabel = weekHeader
    i += 1

    const titleRow = rows[i] ?? []
    i += 1
    const venueRow = rows[i] ?? []
    i += 1

    const title1 = parseMatchTitle(titleRow[0] as string | null)
    const title2 = parseMatchTitle(titleRow[4] as string | null)
    const venue1 = (venueRow[0] as string | null) ?? ''
    const venue2 = (venueRow[4] as string | null) ?? ''

    const squad1: string[] = []
    const altSquad1: string[] = []
    const squad2: string[] = []
    const altSquad2: string[] = []

    while (i < rows.length && !isBlankRow(rows[i])) {
      const row = rows[i]
      const p1 = getOrCreatePlayer(row[0])
      if (p1) squad1.push(p1)
      const p1Alt = getOrCreatePlayer(row[2])
      if (p1Alt) altSquad1.push(p1Alt)
      const p2 = getOrCreatePlayer(row[4])
      if (p2) squad2.push(p2)
      const p2Alt = getOrCreatePlayer(row[6])
      if (p2Alt) altSquad2.push(p2Alt)
      i += 1
    }
    i += 1 // skip blank separator row

    const coaches1: string[] = []
    const coaches2: string[] = []
    while (i < rows.length && !(typeof rows[i]?.[0] === 'string' && (rows[i][0] as string).startsWith('Vecka'))) {
      const row = rows[i]
      if (typeof row?.[1] === 'string' && row[1].trim() !== '') coaches1.push(row[1].trim())
      if (typeof row?.[5] === 'string' && row[5].trim() !== '') coaches2.push(row[5].trim())
      i += 1
    }

    const matches: MatchInfo[] = []
    if (title1) {
      matchCounter += 1
      matches.push({
        id: `m${matchCounter}`,
        ...title1,
        venue: venue1,
        altSquad: altSquad1.length > 0 ? altSquad1 : undefined,
        squad: squad1,
        coaches: coaches1,
      })
    }
    if (title2) {
      matchCounter += 1
      matches.push({
        id: `m${matchCounter}`,
        ...title2,
        venue: venue2,
        altSquad: altSquad2.length > 0 ? altSquad2 : undefined,
        squad: squad2,
        coaches: coaches2,
      })
    }

    weeks.push({ id: `w${weekCounter}`, label: weekLabel, matches })
  }

  return {
    players: Array.from(playersByName.values()),
    weeks,
  }
}

/**
 * Builds the row layout consumed by `parseMatchkallelserRows`, so data can be
 * round-tripped back to an .xlsx file in the same shape as the source sheet.
 */
export function toMatchkallelserRows(data: AppData): unknown[][] {
  const nameById = new Map(data.players.map((p) => [p.id, p.name]))
  const name = (id: string) => nameById.get(id) ?? id
  const rows: unknown[][] = []

  for (const week of data.weeks) {
    const [match1, match2] = week.matches
    rows.push([week.label, null, null, null, null, null, null, null])
    rows.push([
      match1 ? `${match1.day} ${match1.date} ${match1.time} ${match1.homeTeam} - ${match1.awayTeam}` : null,
      null,
      null,
      null,
      match2 ? `${match2.day} ${match2.date} ${match2.time} ${match2.homeTeam} - ${match2.awayTeam}` : null,
      null,
      null,
      null,
    ])
    rows.push([
      match1?.venue ?? null,
      null,
      match1?.altSquad?.length ? 'Alt:' : null,
      null,
      match2?.venue ?? null,
      null,
      match2?.altSquad?.length ? 'Alt:' : null,
      null,
    ])

    const squadRowCount = Math.max(
      match1?.squad.length ?? 0,
      match1?.altSquad?.length ?? 0,
      match2?.squad.length ?? 0,
      match2?.altSquad?.length ?? 0,
    )
    for (let r = 0; r < squadRowCount; r += 1) {
      rows.push([
        match1?.squad[r] ? name(match1.squad[r]) : null,
        null,
        match1?.altSquad?.[r] ? name(match1.altSquad[r]) : null,
        null,
        match2?.squad[r] ? name(match2.squad[r]) : null,
        null,
        match2?.altSquad?.[r] ? name(match2.altSquad[r]) : null,
        null,
      ])
    }

    rows.push([null, null, null, null, null, null, null, null])

    const coachRowCount = Math.max(match1?.coaches.length ?? 0, match2?.coaches.length ?? 0)
    for (let r = 0; r < coachRowCount; r += 1) {
      rows.push([
        r === 0 ? 'Tränare:' : null,
        match1?.coaches[r] ?? null,
        null,
        null,
        r === 0 ? 'Tränare:' : null,
        match2?.coaches[r] ?? null,
        null,
        null,
      ])
    }
  }

  return rows
}

export function buildSummaryRows(data: AppData): unknown[][] {
  const counts = new Map<string, number>()
  for (const week of data.weeks) {
    for (const match of week.matches) {
      for (const playerId of match.squad) {
        counts.set(playerId, (counts.get(playerId) ?? 0) + 1)
      }
    }
  }
  const nameById = new Map(data.players.map((p) => [p.id, p.name]))
  const rows: unknown[][] = [['Player', 'Call-ups']]
  const sorted = Array.from(counts.entries()).sort((a, b) =>
    (nameById.get(a[0]) ?? '').localeCompare(nameById.get(b[0]) ?? ''),
  )
  for (const [playerId, count] of sorted) {
    rows.push([nameById.get(playerId) ?? playerId, count])
  }
  return rows
}
