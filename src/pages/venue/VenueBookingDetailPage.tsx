import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

type BookingDetail = {
  slug: string
  status: string
  guest_count: number
  total_inr: number
  advance_inr: number
  balance_inr: number
  booked_by_partner?: boolean
  starts_at?: string
  ends_at?: string
  venue?: { name?: string; address?: string; city?: string; cover_url?: string }
  slot?: { starts_at?: string; ends_at?: string }
  customer?: { name?: string; phone?: string }
  partner?: { name?: string; phone?: string; company_name?: string }
}

export function VenueBookingDetailPage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [booking, setBooking] = useState<BookingDetail | null>(null)

  async function load() {
    if (!slug) return
    setBooking(await api<BookingDetail>(`/venue-bookings/${slug}`))
  }
  const ready = useLivePoll(load, 4000, [slug])
  if (!ready) return <Loader label={t('common.loading')} />
  if (!booking) return <p className="empty">{t('common.empty')}</p>

  return (
    <div className="page">
      <PageHeader title={booking.venue?.name || t('venue.booking')} actions={<StatusBadge value={booking.status} />} />
      {booking.status === 'confirmed' && <div className="alert ok">{t('venue.bookingConfirmedBoth')}</div>}
      <div className="card">
        <div className="kv">
          <div className="kv-row"><span>{t('venue.when')}</span><strong>{when(booking.starts_at || booking.slot?.starts_at)} → {when(booking.ends_at || booking.slot?.ends_at)}</strong></div>
          <div className="kv-row"><span>{t('venue.guests')}</span><strong>{booking.guest_count}</strong></div>
          <div className="kv-row"><span>{t('venue.total')}</span><strong>{rupee(booking.total_inr)}</strong></div>
          <div className="kv-row"><span>{t('venue.advancePaid')}</span><strong>{rupee(booking.advance_inr)}</strong></div>
          <div className="kv-row"><span>{t('venue.balanceDue')}</span><strong>{rupee(booking.balance_inr)}</strong></div>
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-kicker">{t('venue.clientDetails')}</div>
          <p><strong>{booking.customer?.name}</strong></p>
          <p className="meta">{booking.customer?.phone}</p>
        </div>
        <div className="card">
          <div className="card-kicker">{t('venue.partnerDetails')}</div>
          <p><strong>{booking.partner?.company_name || booking.partner?.name}</strong></p>
          <p className="meta">{booking.partner?.phone}</p>
        </div>
      </div>
    </div>
  )
}
