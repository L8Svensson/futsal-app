import { useRef } from 'react'
import { useAppStore } from '../store/AppStore'
import { exportAppDataToFile, importAppDataFromFile } from '../utils/excelIO'

export function ImportExportBar() {
  const { data, replaceAll, resetToSeed } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    const imported = await importAppDataFromFile(file)
    replaceAll(imported)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        onClick={() => fileInputRef.current?.click()}
      >
        Import Excel…
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          void handleImport(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        onClick={() => exportAppDataToFile(data)}
      >
        Export Excel
      </button>
      <button
        type="button"
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        onClick={() => {
          if (window.confirm('Reset all data back to the original imported seed data?')) resetToSeed()
        }}
      >
        Reset to seed data
      </button>
    </div>
  )
}
