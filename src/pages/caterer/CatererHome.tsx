import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { IncomingVendorRing, type VendorOffer } from '../../components/IncomingVendorRing'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/LocaleContext'
import { catererJobPath } from '../../lib/paths'
import { AvailabilityToggle, LiveMark, Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

export function CatererHome() {
  const { t } = useI18n()
  const { user, refresh } = useAuth()
  const [offers, setOffers] = useState<VendorOffer[]>([])
  const profile = user?.caterer_profile as { status?: string; is_available?: boolean; company_name?: string } | null

  async function load() {
    setOffers(await api<VendorOffer[]>('/caterer/offers'))
  }
  const ready = useLivePoll(load, 2000)
  if (!ready) return <Loader label={t('common.loading')} />

  const rest = offers.filter((o) => o.status !== 'invited')

  return (
    <div className="page">
      <PageHeader
        title={t('caterer.today')}
        subtitle={t('caterer.todaySub')}
        actions={
          <AvailabilityToggle
            available={!!profile?.is_available}
            onToggle={async (next) => {
              await api('/caterer/availability', { method: 'POST', body: JSON.stringify({ is_available: next }) })
              await refresh()
            }}
          />
        }
      />
      <IncomingVendorRing offers={offers} onChange={load} />
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="btn-row">
          <StatusBadge value={profile?.status || 'no profile'} />
          <StatusBadge value={profile?.is_available ? 'active' : 'pending'} />
        </div>
        <p style={{ marginTop: 10 }}>{profile?.company_name || user?.name}</p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <Link to="/caterer/profile"><button className="ghost">{t('caterer.updateProfile')}</button></Link>
        </div>
      </div>
      <div className="grid two">
        {rest.map((offer) => {
          const title = offer.service_request?.event_detail?.title || offer.service_request?.task_detail?.title || 'Job'
          const live = offer.status === 'accepted'
          return (
            <Link key={offer.id} to={catererJobPath(offer.service_request, offer.id)} className="card">
              <div className="btn-row" style={{ justifyContent: 'space-between' }}>
                <StatusBadge value={offer.status} />
                {live && <LiveMark label={t('job.live')} />}
              </div>
              <h2 style={{ marginTop: 10 }}>{title}</h2>
              <div className="meta">
                {offer.service_request?.budget_inr ? <span>{rupee(offer.service_request.budget_inr)}</span> : null}
                <span>{offer.service_request?.city}</span>
                {offer.service_request?.event_detail?.venue_name && <span>{offer.service_request.event_detail.venue_name}</span>}
                {offer.service_request?.scheduled_start && <span>{when(offer.service_request.scheduled_start)}</span>}
              </div>
            </Link>
          )
        })}
        {rest.length === 0 && offers.every((o) => o.status !== 'invited') && <div className="card empty">{t('caterer.noJobs')}</div>}
      </div>
    </div>
  )
}
