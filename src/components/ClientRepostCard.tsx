import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'

function toInputValue(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function shiftDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return toInputValue(d.toISOString())
}

export function ClientRepostCard({
  kind,
  slug,
  scheduledStart,
  scheduledEnd,
  onDone,
  onError,
}: {
  kind: 'events' | 'tasks'
  slug: string
  scheduledStart?: string
  scheduledEnd?: string
  onDone: () => Promise<void>
  onError: (message: string) => void
}) {
  const { t } = useI18n()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const base = scheduledStart || new Date().toISOString()
    setStart(shiftDays(base, 1))
    setEnd(shiftDays(scheduledEnd || base, 1))
  }, [scheduledStart, scheduledEnd])

  return (
    <div className="alert warn">
      <strong>{t('client.unmatchedTitle')}</strong>
      <p style={{ margin: '8px 0 12px' }}>{t('client.unmatchedHint')}</p>
      <div className="form-grid">
        <div className="field">
          <label>{t('client.taskStart')}</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('client.taskEnd')}</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <button
        className="accent"
        style={{ marginTop: 12 }}
        disabled={busy || !start}
        onClick={async () => {
          setBusy(true)
          try {
            await api(`/${kind}/${slug}/repost`, {
              method: 'POST',
              body: JSON.stringify({ scheduled_start: start, scheduled_end: end || start }),
            })
            await onDone()
          } catch (e) {
            onError(e instanceof Error ? e.message : t('client.repostFail'))
          } finally {
            setBusy(false)
          }
        }}
      >
        {t('client.repost')}
      </button>
    </div>
  )
}
