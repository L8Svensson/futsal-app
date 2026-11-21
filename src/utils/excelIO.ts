import * as XLSX from 'xlsx'
import { buildSummaryRows, parseMatchkallelserRows, toMatchkallelserRows } from './matchkallelserParser'
import type { AppData } from '../types'

export async function importAppDataFromFile(file: File): Promise<AppData> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames.includes('Matchkallelser') ? 'Matchkallelser' : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]
  return parseMatchkallelserRows(rows)
}

export function exportAppDataToFile(data: AppData, filename = 'Futsal_Matchkallelser.xlsx') {
  const workbook = XLSX.utils.book_new()
  const matchSheet = XLSX.utils.aoa_to_sheet(toMatchkallelserRows(data) as unknown[][])
  XLSX.utils.book_append_sheet(workbook, matchSheet, 'Matchkallelser')
  const summarySheet = XLSX.utils.aoa_to_sheet(buildSummaryRows(data) as unknown[][])
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  XLSX.writeFile(workbook, filename)
}
