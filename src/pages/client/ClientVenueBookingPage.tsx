import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { PayButton } from '../../payments'
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
  starts_at?: string
  ends_at?: string
  venue?: { name?: string; address?: string; city?: string }
  slot?: { starts_at?: string; ends_at?: string }
  payment?: { id: number; amount_inr: number; status: string }
  partner?: { name?: string; phone?: string; company_name?: string }
}

export function ClientVenueBookingPage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [error, setError] = useState('')

  async function load() {
    if (!slug) return
    setBooking(await api<BookingDetail>(`/venue-bookings/${slug}`))
  }
  const ready = useLivePoll(load, 3000, [slug])
  if (!ready) return <Loader label={t('common.loading')} />
  if (!booking) return <p className="empty">{t('common.empty')}</p>

  const payment = booking.payment

  return (
    <div className="page">
      <PageHeader title={t('venue.booking')} subtitle={booking.venue?.name} actions={<StatusBadge value={booking.status} />} />
      {booking.status === 'confirmed' && <div className="alert ok">{t('venue.bookingConfirmedBoth')}</div>}
      <div className="card">
        <div className="kv">
          <div className="kv-row"><span>{t('venue.when')}</span><strong>{when(booking.starts_at || booking.slot?.starts_at)} → {when(booking.ends_at || booking.slot?.ends_at)}</strong></div>
          <div className="kv-row"><span>{t('venue.guests')}</span><strong>{booking.guest_count}</strong></div>
          <div className="kv-row"><span>{t('venue.total')}</span><strong>{rupee(booking.total_inr)}</strong></div>
          <div className="kv-row"><span>{t('venue.advanceNow')}</span><strong>{rupee(booking.advance_inr)}</strong></div>
          <div className="kv-row"><span>{t('venue.balanceDue')}</span><strong>{rupee(booking.balance_inr)}</strong></div>
        </div>
      </div>
      {payment && payment.status !== 'paid' && (
        <div className="alert warn" style={{ marginTop: 16 }}>
          <p>{t('venue.payAdvance', { amount: rupee(payment.amount_inr) })}</p>
          <PayButton
            target={{ kind: 'booking', paymentId: payment.id, amountInr: payment.amount_inr }}
            onSuccess={load}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}
      {error && <p className="err">{error}</p>}
      {booking.status === 'confirmed' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-kicker">{t('venue.partnerDetails')}</div>
          <p><strong>{booking.partner?.company_name || booking.partner?.name}</strong></p>
          <p className="meta">{booking.partner?.phone}</p>
          <p className="meta">{booking.venue?.address}, {booking.venue?.city}</p>
        </div>
      )}
    </div>
  )
}
