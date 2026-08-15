import { useMemo, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/LocaleContext'

export type Column<T> = {
  key: string
  header: string
  className?: string
  sortValue?: (row: T) => string | number
  csv?: (row: T) => string | number | null | undefined
  render: (row: T) => ReactNode
}

type Props<T> = {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  filename: string
  empty?: string
  pageSize?: number
  selectedKey?: string | number | null
  onSelect?: (row: T) => void
  searchPlaceholder?: string
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function exportCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const lines = [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function compare(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  filename,
  empty,
  pageSize = 10,
  selectedKey,
  onSelect,
  searchPlaceholder,
}: Props<T>) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const next = !needle ? rows : rows.filter((row) => columns.some((col) => {
      const value = col.csv ? col.csv(row) : col.sortValue?.(row)
      return String(value ?? '').toLowerCase().includes(needle)
    }))
    if (!sortKey) return next
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return next
    return [...next].sort((a, b) => {
      const result = compare(col.sortValue!(a), col.sortValue!(b))
      return sortDir === 'asc' ? result : -result
    })
  }, [rows, columns, q, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pages)
  const start = (safePage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  function toggleSort(key: string) {
    const col = columns.find((c) => c.key === key)
    if (!col?.sortValue) return
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function download() {
    exportCsv(
      filename,
      columns.map((c) => c.header),
      filtered.map((row) => columns.map((col) => col.csv ? col.csv(row) : col.sortValue?.(row) ?? '')),
    )
  }

  return (
    <div className="dt">
      <div className="dt-bar">
        <input
          className="search"
          placeholder={searchPlaceholder || t('common.search')}
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
        <div className="dt-actions">
          <span className="dt-meta">{t('common.rows', { shown: filtered.length, total: rows.length })}</span>
          <button className="ghost" type="button" onClick={download} disabled={filtered.length === 0}>
            {t('common.exportCsv')}
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${col.className || ''} ${col.sortValue ? 'sortable' : ''}`.trim()}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.header}
                  {col.sortValue && (
                    <span className="sort">{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const key = rowKey(row)
              return (
                <tr
                  key={key}
                  className={selectedKey === key ? 'selected' : ''}
                  onClick={onSelect ? () => onSelect(row) : undefined}
                  style={onSelect ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>{col.render(row)}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="empty">{empty || t('common.empty')}</p>}
      {filtered.length > 0 && (
        <div className="dt-foot">
          <span className="dt-meta">
            {t('common.showing', { from: start + 1, to: Math.min(start + pageSize, filtered.length), total: filtered.length })}
          </span>
          <div className="dt-page">
            <button className="ghost" type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>{t('common.prev')}</button>
            <span className="dt-meta">{t('common.page', { page: safePage, pages })}</span>
            <button className="ghost" type="button" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>{t('common.next')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
