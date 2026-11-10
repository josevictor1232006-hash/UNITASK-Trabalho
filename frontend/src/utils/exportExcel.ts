/** Exporta CSV UTF-8 com BOM (abre no Excel). Separador `;` para locale pt-BR. */

type Cell = string | number | boolean | null | undefined

function escapeCell(value: Cell): string {
  const text = value == null ? '' : String(value)
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function exportToExcel(
  filename: string,
  headers: string[],
  rows: Cell[][],
): void {
  const sep = ';'
  const lines = [
    headers.map(escapeCell).join(sep),
    ...rows.map((row) => headers.map((_, i) => escapeCell(row[i])).join(sep)),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`
  anchor.href = url
  anchor.download = safeName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function stampFilename(prefix: string): string {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  return `${prefix}_${stamp}.csv`
}
