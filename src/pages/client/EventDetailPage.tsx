import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { JobFacts } from '../../components/JobFacts'
import { ClientRepostCard } from '../../components/ClientRepostCard'
import { JobLayout, PayCard, RolePackage } from '../../components/JobLayout'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { VenueOtpCard, type VenueAttendance } from '../../components/VenueOtpCard'
import { VendorStatus, type VendorCompany, type VendorRing } from '../../components/VendorStatus'
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
  vendor_company?: VendorCompany
  vendor_ring?: VendorRing
  vendor_attendance?: VenueAttendance | null
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
  const payment = event.payments?.[0]
  const ringing = event.status === 'matching' || event.status === 'filling'
  const live = ['matching', 'filling', 'confirmed', 'in_progress'].includes(event.status)
  const showOtp = ['confirmed', 'in_progress', 'completed'].includes(event.status)

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
                <button className="accent" onClick={async () => {
                  try {
                    await api(`/payments/${payment.id}/dev-pay`, { method: 'POST' })
                    await load()
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Payment failed')
                  }
                }}>Mark deposit paid</button>
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
          {showOtp && <VenueOtpCard attendance={event.vendor_attendance} />}
          {error && <p className="err">{error}</p>}
        </>
      }
      main={<RolePackage shifts={event.event_detail?.shifts} waiting={!event.vendor_company && ringing} />}
      side={
        <>
          <VendorStatus company={event.vendor_company} ring={event.vendor_ring} />
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
