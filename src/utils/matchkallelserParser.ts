import type { AppData, MatchInfo, Player, Week } from '../types'

const MATCH_TITLE_RE = /^(\S+)\s+(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s+(.+?)\s-\s(.+)$/
const COACH_MARKER = 'Tränare:'

function parseMatchTitle(title: string | null): Pick<MatchInfo, 'day' | 'date' | 'time' | 'homeTeam' | 'awayTeam'> | null {
  if (!title) return null
  const match = MATCH_TITLE_RE.exec(title.trim())
  if (!match) return null
  const [, day, date, time, homeTeam, awayTeam] = match
  return { day, date, time, homeTeam, awayTeam }
}

function asTrimmedString(cell: unknown): string | null {
  if (typeof cell !== 'string') return null
  const trimmed = cell.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Parses the "Matchkallelser" sheet (array-of-arrays, `header: 1` layout) into
 * players + weeks. Blocks are delimited purely by "Vecka N" week headers (col 0),
 * so blank-row spacing and column widths between blocks can vary — only the
 * literal "Tränare:" marker and "Vecka" headers are load-bearing:
 *   1. "Vecka N" week header (col 0)
 *   2. match titles for match 1 (col 0) and match 2 (col 4)
 *   3. venues for match 1 (col 0) and match 2 (col 4)
 *   4. squad rows: col 0 = match1 squad, col 4 = match2 squad — until, per
 *      side, a "Tränare:" marker is seen in either the name column or the
 *      next column over, after which further values in the next column over
 *      are coach names (the marker itself may share a row with the last
 *      squad name, sit alone, or lead a row together with the first coach
 *      name — all three occur in practice).
 */
export function parseMatchkallelserRows(rows: unknown[][]): AppData {
  const playersByName = new Map<string, Player>()
  let playerCounter = 0
  let matchCounter = 0
  let weekCounter = 0

  const getOrCreatePlayer = (rawName: unknown): string | null => {
    const name = asTrimmedString(rawName)
    if (!name) return null
    let player = playersByName.get(name)
    if (!player) {
      playerCounter += 1
      player = { id: `p${playerCounter}`, name }
      playersByName.set(name, player)
    }
    return player.id
  }

  // Parses one match's squad/coaches from the rows between the venue row and
  // the next week header, given that match's name/coach columns.
  const parseSide = (blockRows: unknown[][], nameCol: number, coachCol: number) => {
    const squad: string[] = []
    const coaches: string[] = []
    let seenCoachMarker = false

    for (const row of blockRows) {
      const nameVal = asTrimmedString(row[nameCol])
      const coachVal = asTrimmedString(row[coachCol])
      const markerHere = nameVal === COACH_MARKER || coachVal === COACH_MARKER

      if (!seenCoachMarker && nameVal && nameVal !== COACH_MARKER) {
        const playerId = getOrCreatePlayer(nameVal)
        if (playerId) squad.push(playerId)
      }
      if (markerHere) seenCoachMarker = true
      if (seenCoachMarker && coachVal && coachVal !== COACH_MARKER) {
        coaches.push(coachVal)
      }
    }

    return { squad, coaches }
  }

  const weeks: Week[] = []
  let i = 0
  while (i < rows.length) {
    const weekHeader = asTrimmedString(rows[i]?.[0])
    if (!weekHeader || !weekHeader.startsWith('Vecka')) {
      i += 1
      continue
    }
    weekCounter += 1
    i += 1

    const titleRow = rows[i] ?? []
    i += 1
    const venueRow = rows[i] ?? []
    i += 1

    const title1 = parseMatchTitle(titleRow[0] as string | null)
    const title2 = parseMatchTitle(titleRow[4] as string | null)
    const venue1 = (venueRow[0] as string | null) ?? ''
    const venue2 = (venueRow[4] as string | null) ?? ''

    const blockStart = i
    while (i < rows.length && !(asTrimmedString(rows[i]?.[0])?.startsWith('Vecka') ?? false)) {
      i += 1
    }
    const blockRows = rows.slice(blockStart, i)

    const side1 = parseSide(blockRows, 0, 1)
    const side2 = parseSide(blockRows, 4, 5)

    const matches: MatchInfo[] = []
    if (title1) {
      matchCounter += 1
      matches.push({ id: `m${matchCounter}`, ...title1, venue: venue1, ...side1 })
    }
    if (title2) {
      matchCounter += 1
      matches.push({ id: `m${matchCounter}`, ...title2, venue: venue2, ...side2 })
    }

    weeks.push({ id: `w${weekCounter}`, label: weekHeader, matches })
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
      null,
      null,
      match2?.venue ?? null,
      null,
      null,
      null,
    ])

    const squadRowCount = Math.max(match1?.squad.length ?? 0, match2?.squad.length ?? 0)
    for (let r = 0; r < squadRowCount; r += 1) {
      rows.push([
        match1?.squad[r] ? name(match1.squad[r]) : null,
        null,
        null,
        null,
        match2?.squad[r] ? name(match2.squad[r]) : null,
        null,
        null,
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
