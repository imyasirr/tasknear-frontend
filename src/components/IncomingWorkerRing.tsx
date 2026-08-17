import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../lib/categories'
import { rupee, StatusBadge, when } from '../ui'

export type WorkerAssignment = {
  id: number
  status: string
  expires_at?: string | null
  service_request?: {
    slug?: string
    city?: string
    budget_inr?: number
    required_workers?: number
    scheduled_start?: string
    event_detail?: { title?: string; venue_name?: string; shifts?: Array<{ category?: CategoryRow; headcount?: number }> }
    task_detail?: { title?: string; category?: CategoryRow }
  }
  shift?: { category?: CategoryRow; headcount?: number; rate_per_worker_inr?: number }
}

function secondsLeft(iso?: string | null) {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000))
}

function canAccept(row: WorkerAssignment) {
  if (row.status !== 'invited') return false
  if (!row.expires_at) return true
  return new Date(row.expires_at).getTime() > Date.now()
}

export function IncomingWorkerRing({
  jobs,
  onChange,
  compact,
}: {
  jobs: WorkerAssignment[]
  onChange: () => Promise<void>
  compact?: boolean
}) {
  const { t, locale } = useI18n()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const incoming = jobs.filter(canAccept)
  const [, tick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (incoming.length === 0) return null

  async function act(id: number, path: string) {
    setBusy(id)
    setError('')
    try {
      await api(path, { method: 'POST' })
      await onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('worker.taken'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={compact ? undefined : { marginBottom: 18 }}>
      {error && <p className="err">{error}</p>}
      {incoming.map((job) => {
        const left = secondsLeft(job.expires_at)
        const req = job.service_request
        const title = req?.event_detail?.title || req?.task_detail?.title || 'Job'
        const role = job.shift?.category || req?.task_detail?.category
        return (
          <div className={`card ring-card ${compact ? 'job-action' : ''}`} key={job.id} style={compact ? undefined : { marginBottom: 12 }}>
            <div className="card-kicker">{t('worker.incoming')}</div>
            <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              {!compact && <h2>{title}</h2>}
              <div className="ring-timer">{left > 0 ? t('worker.seconds', { n: left }) : t('worker.openToday')}</div>
            </div>
            {!compact && <p style={{ margin: '8px 0 12px' }}>{t('worker.incomingSub')}</p>}
            {!compact && (
              <div className="meta">
                <StatusBadge value={job.status} />
                {role && <span>{categoryLabel(role, locale)}</span>}
                {req?.budget_inr ? <span>{rupee(req.budget_inr)}</span> : null}
                <span>{req?.city}</span>
                {req?.scheduled_start && <span>{when(req.scheduled_start)}</span>}
              </div>
            )}
            <div className="btn-row" style={{ marginTop: 16 }}>
              <button className="accent" disabled={busy === job.id} onClick={() => act(job.id, `/worker/jobs/${job.id}/accept`)}>
                {t('worker.accept')}
              </button>
              <button className="ghost" disabled={busy === job.id} onClick={() => act(job.id, `/worker/jobs/${job.id}/decline`)}>
                {t('worker.decline')}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
