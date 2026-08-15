import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { IncomingVendorRing, type VendorOffer } from '../../components/IncomingVendorRing'
import { JobFacts } from '../../components/JobFacts'
import { JobLayout, RolePackage } from '../../components/JobLayout'
import { VenueOtpPad } from '../../components/VenueOtpPad'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { LiveMark, Loader, PageHeader, StatusBadge, rupee } from '../../ui'

type OfferDetail = VendorOffer & {
  service_request?: VendorOffer['service_request'] & {
    status?: string
    vendor_attendance?: {
      checked_in?: boolean
      checked_out?: boolean
      check_in_at?: string | null
      check_out_at?: string | null
    } | null
    payouts?: Array<{ id: number; amount_inr: number; status: string; due_at?: string; upi_vpa?: string }>
  }
}

export function CatererJobPage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [error, setError] = useState('')

  async function load() {
    if (!slug) return
    try {
      setOffer(await api<OfferDetail>(`/caterer/offers/${slug}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }
  const ready = useLivePoll(load, 2000, [slug])

  if (!ready) return <Loader label={t('common.loading')} />
  if (!offer) return <p className="err">{error || t('common.empty')}</p>

  const req = offer.service_request
  const title = req?.event_detail?.title || req?.task_detail?.title || 'Job'
  const live = ['invited', 'accepted'].includes(offer.status)
  const shifts = req?.event_detail?.shifts || []
  const attendance = req?.vendor_attendance
  const payout = req?.payouts?.[0]
  const canCheckIn = offer.status === 'accepted' && !attendance?.checked_in && !attendance?.check_in_at
  const canCheckOut = offer.status === 'accepted' && !!(attendance?.checked_in || attendance?.check_in_at) && !attendance?.checked_out && !attendance?.check_out_at
  const key = slug || String(offer.id)

  return (
    <JobLayout
      header={
        <PageHeader
          title={title}
          subtitle={`${req?.city || ''}${req?.event_detail?.venue_name ? ` · ${req.event_detail.venue_name}` : ''}${req?.budget_inr ? ` · ${rupee(req.budget_inr)}` : ''}`}
          actions={<>{live && <LiveMark label={t('job.live')} />}<StatusBadge value={req?.status || offer.status} /></>}
        />
      }
      action={
        <>
          {offer.status === 'invited' && <IncomingVendorRing offers={[offer]} onChange={load} compact />}
          {canCheckIn && (
            <>
              <div className="alert ok">{t('caterer.youAccepted')}</div>
              <VenueOtpPad
                mode="in"
                onSubmit={async (otp) => {
                  await api(`/caterer/offers/${key}/check-in`, { method: 'POST', body: JSON.stringify({ otp }) })
                  await load()
                }}
              />
            </>
          )}
          {canCheckOut && (
            <>
              <div className="alert ok">{t('caterer.onSite')}</div>
              <VenueOtpPad
                mode="out"
                onSubmit={async (otp) => {
                  await api(`/caterer/offers/${key}/check-out`, { method: 'POST', body: JSON.stringify({ otp }) })
                  await load()
                }}
              />
            </>
          )}
          {payout && (
            <div className="alert ok">
              {payout.status === 'scheduled'
                ? t('caterer.settlePending', { amount: rupee(payout.amount_inr) })
                : t('caterer.settleSent', { amount: rupee(payout.amount_inr) })}
            </div>
          )}
          {offer.status === 'expired' && <div className="alert warn">{t('caterer.offerGone')}</div>}
          {error && <p className="err">{error}</p>}
        </>
      }
      main={<RolePackage shifts={shifts} headcount={req?.required_workers} />}
      side={
        <>
          <div className="card">
            <div className="card-kicker">{t('job.details')}</div>
            <JobFacts job={req} showClient />
          </div>
        </>
      }
    />
  )
}
