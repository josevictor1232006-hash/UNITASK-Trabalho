type Cell = string | number | boolean | null | undefined

export async function exportToExcel(
  filename: string,
  headers: string[],
  rows: Cell[][],
  sheetName = 'Relatório',
): Promise<void> {
  const XLSX = await import('xlsx')
  const data = [
    headers,
    ...rows.map((row) => headers.map((_, i) => (row[i] == null ? '' : row[i]))),
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  worksheet['!cols'] = headers.map((header, index) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map((row) => String(row[index] ?? '').length),
      8,
    )
    return { wch: Math.min(maxLen + 2, 40) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(workbook, safeName)
}

export function stampFilename(prefix: string): string {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getDate().toString().padStart(2, '0'),
  ].join('')
  return `${prefix}_${stamp}.xlsx`
}
