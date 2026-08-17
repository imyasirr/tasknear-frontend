import { useState, type ReactNode } from 'react'
import { useI18n } from './i18n/LocaleContext'

export { DataTable, exportCsv } from './components/DataTable'
export type { Column } from './components/DataTable'

export function rupee(n?: number | null) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

export function when(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function whenTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function LiveMark({ label = 'Live' }: { label?: string }) {
  return <span className="live"><i />{label}</span>
}

export function Loader({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <div className="tn-loader">
        <div className="tn-radar" aria-hidden>
          <i className="tn-ring" />
          <i className="tn-ring tn-ring-2" />
          <i className="tn-ring tn-ring-3" />
          <span className="tn-pin" />
        </div>
        <div className="tn-loader-copy">
          <strong>TaskNear</strong>
          <p>{label || t('common.loading')}</p>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ value }: { value?: string | null }) {
  const label = (value || 'unknown').replaceAll('_', ' ')
  return <span className="badge" data-s={value || ''}>{label}</span>
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="btn-row">{actions}</div>}
    </div>
  )
}

export function AvailabilityToggle({
  available,
  onToggle,
  disabled,
  onlineLabel,
  offlineLabel,
}: {
  available: boolean
  onToggle: (next: boolean) => void | Promise<void>
  disabled?: boolean
  onlineLabel?: string
  offlineLabel?: string
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const on = available
  const label = on ? (onlineLabel ?? t('users.available')) : (offlineLabel ?? t('users.offline'))

  async function toggle() {
    if (disabled || busy) return
    setBusy(true)
    try {
      await onToggle(!on)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`avail-toggle${on ? ' on' : ''}${busy ? ' busy' : ''}`}>
      <span className="avail-toggle-label">{label}</span>
      <button
        type="button"
        role="switch"
        className="avail-toggle-switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled || busy}
        onClick={() => void toggle()}
      >
        <span className="avail-toggle-track" aria-hidden>
          <span className="avail-toggle-thumb" />
        </span>
      </button>
    </div>
  )
}
