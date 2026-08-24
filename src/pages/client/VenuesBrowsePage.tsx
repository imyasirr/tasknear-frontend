import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, rupee } from '../../ui'

type VenueCard = {
  slug: string
  name: string
  city?: string
  venue_type: string
  capacity_min: number
  capacity_max: number
  advance_percent: number
  price_per_day_inr?: number
  cover_url?: string
}

export function VenuesBrowsePage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<VenueCard[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api<VenueCard[]>('/venues').then(setRows).finally(() => setReady(true))
  }, [])

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page venue-page">
      <PageHeader title={t('venue.browseTitle')} subtitle={t('venue.browseSub')} />
      {rows.length === 0 ? (
        <div className="card venue-empty-card">
          <strong>{t('venue.noVenues')}</strong>
          <p>{t('venue.noVenuesHint')}</p>
        </div>
      ) : (
        <div className="venue-listings-grid">
          {rows.map((v) => (
            <Link key={v.slug} to={`/app/venues/${v.slug}`} className="card venue-listing-card">
              <div className="venue-listing-cover">
                {v.cover_url ? <img src={v.cover_url} alt={v.name} /> : <div className="venue-listing-placeholder">{t('venue.noPhotos')}</div>}
              </div>
              <div className="venue-listing-body">
                <strong>{v.name}</strong>
                <p className="meta">{v.city} · {t(`venue.type.${v.venue_type}`)}</p>
                <p className="meta">
                  {v.capacity_min}–{v.capacity_max} {t('venue.guests')}
                  {v.price_per_day_inr ? ` · ${rupee(v.price_per_day_inr)}/${t('venue.day')}` : ''}
                  {' · '}{t('venue.advanceShort', { pct: v.advance_percent })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
