// One-off script: reads the real Futsal Excel file and writes src/data/seedData.ts
// Run with: npx tsx scripts/generateSeed.ts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import xlsx from 'xlsx'
import { parseMatchkallelserRows } from '../src/utils/matchkallelserParser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SOURCE_FILE = 'C:\\Lotta\\Fotboll\\Futsal_9_Player_Updated.xlsx'

const wb = xlsx.readFile(SOURCE_FILE)
const sheet = wb.Sheets['Matchkallelser']
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]

const data = parseMatchkallelserRows(rows)

const outPath = path.join(__dirname, '..', 'src', 'data', 'seedData.ts')
const contents = `// Generated from Futsal_9_Player_Updated.xlsx by scripts/generateSeed.ts — do not hand-edit.
import type { AppData } from '../types'

export const seedData: AppData = ${JSON.stringify(data, null, 2)}
`
fs.writeFileSync(outPath, contents, 'utf8')
console.log(`Wrote ${data.players.length} players and ${data.weeks.length} weeks to ${outPath}`)
