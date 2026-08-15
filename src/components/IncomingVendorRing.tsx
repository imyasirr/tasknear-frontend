import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'
import { rupee, StatusBadge, when } from '../ui'
import type { JobFactsData } from './JobFacts'

export type VendorOffer = {
  id: number
  status: string
  urgent_until?: string | null
  expires_at?: string | null
  service_request?: JobFactsData & {
    slug?: string
    required_workers?: number
    event_detail?: JobFactsData['event_detail'] & {
      shifts?: Array<{ category?: { name: string }; headcount?: number; rate_per_worker_inr?: number }>
    }
  }
}

function secondsLeft(iso?: string | null) {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000))
}

function canAccept(offer: VendorOffer) {
  if (offer.status !== 'invited') return false
  if (!offer.expires_at) return true
  return new Date(offer.expires_at).getTime() > Date.now()
}

function playRing(on: boolean) {
  if (!on || typeof window === 'undefined' || !window.AudioContext) return () => {}
  const ctx = new AudioContext()
  let stopped = false
  const beep = () => {
    if (stopped) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 760
    gain.gain.value = 0.05
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
  }
  beep()
  const id = window.setInterval(beep, 1400)
  return () => {
    stopped = true
    window.clearInterval(id)
    void ctx.close()
  }
}

export function IncomingVendorRing({
  offers,
  onChange,
  compact,
}: {
  offers: VendorOffer[]
  onChange: () => Promise<void>
  compact?: boolean
}) {
  const { t } = useI18n()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const incoming = offers.filter(canAccept)
  const [, tick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => playRing(incoming.some((o) => secondsLeft(o.urgent_until) > 0)), [incoming])

  if (incoming.length === 0) return null

  async function act(id: number, path: string) {
    setBusy(id)
    setError('')
    try {
      await api(path, { method: 'POST' })
      await onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('caterer.taken'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={compact ? undefined : { marginBottom: 18 }}>
      {error && <p className="err">{error}</p>}
      {incoming.map((offer) => {
        const urgent = secondsLeft(offer.urgent_until)
        const title = offer.service_request?.event_detail?.title || offer.service_request?.task_detail?.title || 'Job'
        const roles = (offer.service_request?.event_detail?.shifts || [])
          .map((s) => `${s.headcount || 1} ${s.category?.name || 'crew'}`)
          .join(' · ')
        return (
          <div className={`card ring-card ${compact ? 'job-action' : ''}`} key={offer.id} style={compact ? undefined : { marginBottom: 12 }}>
            <div className="card-kicker">{t('caterer.incoming')}</div>
            <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              {!compact && <h2>{title}</h2>}
              {compact && <p style={{ margin: 0 }}>{t('caterer.incomingSub')}</p>}
              <div className="ring-timer">
                {urgent > 0 ? t('caterer.seconds', { n: urgent }) : t('caterer.openToday')}
              </div>
            </div>
            {!compact && <p style={{ margin: '8px 0 12px' }}>{t('caterer.incomingSub')}</p>}
            {!compact && (
              <div className="meta">
                <StatusBadge value={offer.status} />
                {roles && <span>{roles}</span>}
                {offer.service_request?.budget_inr ? <span>{rupee(offer.service_request.budget_inr)}</span> : null}
                <span>{offer.service_request?.city}</span>
                {offer.service_request?.event_detail?.venue_name && <span>{offer.service_request.event_detail.venue_name}</span>}
                {offer.service_request?.scheduled_start && <span>{when(offer.service_request.scheduled_start)}</span>}
              </div>
            )}
            <div className="btn-row" style={{ marginTop: 16 }}>
              <button className="accent" disabled={busy === offer.id} onClick={() => act(offer.id, `/caterer/offers/${offer.id}/accept`)}>
                {t('caterer.accept')}
              </button>
              <button className="ghost" disabled={busy === offer.id} onClick={() => act(offer.id, `/caterer/offers/${offer.id}/decline`)}>
                {t('caterer.decline')}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
