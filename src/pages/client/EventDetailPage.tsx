import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { PayButton } from '../../payments'
import { JobFacts } from '../../components/JobFacts'
import { ClientRepostCard } from '../../components/ClientRepostCard'
import { JobLayout, PayCard, RolePackage } from '../../components/JobLayout'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { CrewAttendance, type CrewRow } from '../../components/CrewAttendance'
import { RatingPanel, type MyRating } from '../../components/RatingPanel'
import { buildRateTargets } from '../../lib/ratingTargets'
import { VenueOtpCard, type VenueAttendance } from '../../components/VenueOtpCard'
import { VendorStatus, type VendorCompany, type VendorRing } from '../../components/VendorStatus'
import { WorkerStatus, type WorkerRing } from '../../components/WorkerStatus'
import { WORKER_ROLES } from '../../lib/providerTypes'
import { LiveMark, Loader, PageHeader, StatusBadge, rupee } from '../../ui'

type Shift = {
  id: number
  headcount: number
  rate_per_worker_inr?: number
  category?: { name: string }
}
type EventDetail = {
  id: number
  status: string
  city: string
  address?: string
  notes?: string
  budget_inr: number
  scheduled_start?: string
  scheduled_end?: string
  event_detail?: {
    title: string
    venue_name?: string
    guest_count?: number
    dress_code?: string
    meal_included?: boolean
    shifts?: Shift[]
  }
  payments?: Array<{ id: number; amount_inr: number; labor_inr?: number; commission_inr?: number; fee_waived?: boolean; status: string }>
  provider_type?: string
  vendor_company?: VendorCompany
  vendor_ring?: VendorRing
  worker_ring?: WorkerRing
  vendor_attendance?: VenueAttendance | null
  client_crew?: CrewRow[]
  my_ratings?: MyRating[]
}

export function EventDetailPage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [error, setError] = useState('')

  async function load() {
    if (!slug) return
    try {
      setEvent(await api<EventDetail>(`/events/${slug}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }
  const ready = useLivePoll(load, 2000, [slug])

  if (!ready) return <Loader label={t('common.loading')} />
  if (!event) return <p className="err">{error || t('common.empty')}</p>
  const isWorkerJob = event.provider_type ? (WORKER_ROLES as readonly string[]).includes(event.provider_type) : false
  const payment = event.payments?.[0]
  const ringing = event.status === 'matching' || event.status === 'filling'
  const live = ['matching', 'filling', 'confirmed', 'in_progress'].includes(event.status)
  const showOtp = ['confirmed', 'in_progress', 'completed'].includes(event.status)
  const showRating = ['completed', 'settled'].includes(event.status)
  const rateTargets = buildRateTargets(event, {
    caterer: t('nav.caterer'),
    worker: t('nav.worker'),
    nearbyWorker: t('client.nearbyWorker'),
  })

  return (
    <JobLayout
      header={
        <PageHeader
          title={event.event_detail?.title || 'Event'}
          subtitle={`${event.city}${event.event_detail?.venue_name ? ` · ${event.event_detail.venue_name}` : ''} · ${rupee(event.budget_inr)}`}
          actions={<>{live && <LiveMark label={t('job.live')} />}<StatusBadge value={event.status} /></>}
        />
      }
      action={
        <>
          {payment && payment.status !== 'paid' && (
            <div className="alert warn">
              <strong>{t('client.payToRing', { amount: rupee(payment.amount_inr) })}</strong>
              <div className="btn-row" style={{ marginTop: 10 }}>
                <PayButton
                  target={{ kind: 'booking', paymentId: payment.id, amountInr: payment.amount_inr }}
                  onSuccess={load}
                  onError={(msg) => setError(msg)}
                />
              </div>
            </div>
          )}
          {payment && payment.status === 'paid' && ringing && (
            <div className="alert warn">{t('client.paidRing', { amount: rupee(payment.amount_inr) })}</div>
          )}
          {payment && payment.status === 'paid' && event.status === 'confirmed' && (
            <div className="alert ok">{t('client.shareOtp', { amount: rupee(payment.amount_inr) })}</div>
          )}
          {event.status === 'in_progress' && <div className="alert ok">{t('client.workerOnSite')}</div>}
          {event.status === 'completed' && <div className="alert ok">{t('client.allDone', { n: 1 })}</div>}
          {showRating && rateTargets.length > 0 && (
            <RatingPanel
              serviceRequestId={event.id}
              targets={rateTargets}
              existing={event.my_ratings}
              onRated={load}
            />
          )}
          {event.status === 'unmatched' && payment?.status === 'paid' && slug && (
            <ClientRepostCard
              kind="events"
              slug={slug}
              scheduledStart={event.scheduled_start}
              scheduledEnd={event.scheduled_end}
              onDone={load}
              onError={setError}
            />
          )}
          {showOtp && event.vendor_attendance && (
            <VenueOtpCard attendance={event.vendor_attendance} worker={isWorkerJob} />
          )}
          {showOtp && isWorkerJob && !event.vendor_attendance && (event.client_crew?.length ?? 0) > 1 && (
            <div className="card job-action">
              <div className="card-kicker">{t('client.venueOtp')}</div>
              <p style={{ margin: '6px 0 14px' }}>{t('client.venueOtpHintWorker')}</p>
              <div className="crew-list">
                {event.client_crew!.map((crew) => (
                  <CrewAttendance key={crew.id} crew={crew} />
                ))}
              </div>
            </div>
          )}
          {showOtp && isWorkerJob && !event.vendor_attendance && !(event.client_crew?.length) && (
            <div className="card job-action">
              <div className="card-kicker">{t('client.venueOtp')}</div>
              <p style={{ margin: '6px 0 0' }}>{t('client.waitingWorkerOtp')}</p>
            </div>
          )}
          {showOtp && !isWorkerJob && !event.vendor_attendance && (
            <div className="card job-action">
              <div className="card-kicker">{t('client.venueOtp')}</div>
              <p style={{ margin: '6px 0 0' }}>{t('client.waitingAccept')}</p>
            </div>
          )}
          {error && <p className="err">{error}</p>}
        </>
      }
      main={<RolePackage shifts={event.event_detail?.shifts} waiting={!event.vendor_company && ringing} />}
      side={
        <>
          <VendorStatus company={event.vendor_company} ring={isWorkerJob ? null : event.vendor_ring} />
          <WorkerStatus ring={isWorkerJob ? event.worker_ring : null} />
          {payment && (
            <PayCard
              labor={payment.labor_inr || event.budget_inr}
              fee={payment.commission_inr}
              total={payment.amount_inr}
              waived={payment.fee_waived}
              note={payment.status === 'paid' ? t('client.settleT1') : undefined}
            />
          )}
          <div className="card">
            <div className="card-kicker">{t('job.details')}</div>
            <JobFacts job={event} start={event.scheduled_start} end={event.scheduled_end} />
          </div>
        </>
      }
    />
  )
}
