import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge, rupee } from '../../ui'

type VenueRow = {
  id: number
  slug: string
  name: string
  city?: string
  venue_type: string
  status: string
  capacity_max: number
  price_per_day_inr?: number
  photos?: Array<{ url: string }>
  amenities?: Record<string, number | boolean>
}

export function VenueListingsPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<VenueRow[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api<VenueRow[]>('/venue-partner/venues')
      .then(setRows)
      .finally(() => setReady(true))
  }, [])

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page venue-page">
      <PageHeader
        title={t('venue.listingsTitle')}
        subtitle={t('venue.listingsSub')}
        actions={<Link className="accent" to="/venue/listings/new">{t('venue.addListing')}</Link>}
      />
      {rows.length === 0 ? (
        <p className="empty">{t('venue.noListings')}</p>
      ) : (
        <div className="venue-listings-grid">
          {rows.map((v) => (
            <Link key={v.id} to={`/venue/listings/${v.id}`} className="card venue-listing-card">
              <div className="venue-listing-cover">
                {v.photos?.[0]?.url ? (
                  <img src={v.photos[0].url} alt={v.name} />
                ) : (
                  <div className="venue-listing-placeholder">{t('venue.noPhotos')}</div>
                )}
              </div>
              <div className="venue-listing-body">
                <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong>{v.name}</strong>
                  <StatusBadge value={v.status} />
                </div>
                <p className="meta">{v.city} · {t(`venue.type.${v.venue_type}`)}</p>
                <p className="meta">{v.capacity_max} {t('venue.guests')}{v.price_per_day_inr ? ` · ${rupee(v.price_per_day_inr)}/${t('venue.day')}` : ''}</p>
                {v.status !== 'published' && <p className="meta" style={{ color: '#8a3b2c' }}>{t('venue.draftHint')}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
