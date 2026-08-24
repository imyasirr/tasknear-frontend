import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

type Booking = {
  slug: string
  status: string
  guest_count: number
  advance_inr: number
  total_inr: number
  booked_by_partner?: boolean
  starts_at?: string
  ends_at?: string
  venue?: { id?: number; name?: string; city?: string }
  slot?: { starts_at?: string; ends_at?: string }
  customer?: { name?: string; phone?: string }
}

type VenueRow = { id: number; name: string; status: string }
type DayInfo = {
  date: string
  status: 'booked' | 'free'
  bookings: Array<{
    slug: string
    status: string
    guest_count: number
    starts_at?: string
    ends_at?: string
    customer_name?: string
    customer_phone?: string
    booked_by_partner?: boolean
  }>
}
type Calendar = { year: number; month: number; days: Record<string, DayInfo> }

function monthLabel(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function VenuePartnerHome() {
  const { t, locale } = useI18n()
  const [rows, setRows] = useState<Booking[]>([])
  const [venues, setVenues] = useState<VenueRow[]>([])
  const [venueId, setVenueId] = useState<number | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [calendar, setCalendar] = useState<Calendar | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [showBook, setShowBook] = useState(false)
  const [form, setForm] = useState({
    starts_at: '',
    ends_at: '',
    guest_count: 100,
    customer_name: '',
    customer_phone: '',
    notes: '',
    total_inr: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadBookings() {
    setRows(await api<Booking[]>('/venue-partner/bookings'))
  }

  useEffect(() => {
    api<VenueRow[]>('/venue-partner/venues').then((list) => {
      setVenues(list)
      if (list[0] && !venueId) setVenueId(list[0].id)
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!venueId) return
    api<Calendar>(`/venue-partner/venues/${venueId}/calendar?year=${year}&month=${month}`)
      .then(setCalendar)
      .catch(() => setCalendar(null))
  }, [venueId, year, month, rows])

  const ready = useLivePoll(loadBookings, 8000)
  const pickedDay = useMemo(() => {
    if (!picked || !calendar?.days) return null
    const dayNum = String(Number(picked.slice(-2)))
    return calendar.days[dayNum] || Object.values(calendar.days).find((d) => d.date === picked) || null
  }, [picked, calendar])

  const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month])
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month])

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
    setPicked(null)
  }

  async function partnerBook() {
    if (!venueId) return
    setBusy(true)
    setError('')
    try {
      await api('/venue-partner/bookings', {
        method: 'POST',
        body: JSON.stringify({
          venue_id: venueId,
          starts_at: form.starts_at,
          ends_at: form.ends_at,
          guest_count: form.guest_count,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          notes: form.notes || null,
          total_inr: form.total_inr ? Number(form.total_inr) : null,
        }),
      })
      setShowBook(false)
      setForm({ starts_at: '', ends_at: '', guest_count: 100, customer_name: '', customer_phone: '', notes: '', total_inr: '' })
      await loadBookings()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page venue-page">
      <PageHeader
        title={t('venue.bookingsTitle')}
        subtitle={t('venue.bookingsSub')}
        actions={<button className="accent" onClick={() => setShowBook((v) => !v)}>{t('venue.bookOnBehalf')}</button>}
      />
      {error && <p className="err">{error}</p>}

      {showBook && (
        <div className="card venue-card" style={{ marginBottom: 18 }}>
          <div className="card-kicker">{t('venue.bookOnBehalf')}</div>
          <p className="meta" style={{ marginBottom: 12 }}>{t('venue.bookOnBehalfHint')}</p>
          <div className="form-grid">
            <div className="field">
              <label>{t('venue.venue')}</label>
              <select value={venueId ?? ''} onChange={(e) => setVenueId(+e.target.value)}>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="field"><label>{t('venue.clientName')}</label><input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div className="field"><label>{t('venue.clientPhone')}</label><input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
            <div className="field"><label>{t('venue.guests')}</label><input type="number" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: +e.target.value })} /></div>
            <div className="field"><label>{t('venue.slotStart')}</label><input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div className="field"><label>{t('venue.slotEnd')}</label><input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            <div className="field"><label>{t('venue.totalOptional')}</label><input type="number" value={form.total_inr} onChange={(e) => setForm({ ...form, total_inr: e.target.value })} placeholder={t('venue.autoPrice')} /></div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>{t('venue.notes')}</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="accent" style={{ marginTop: 12 }} disabled={busy || !form.starts_at || !form.ends_at || !form.customer_name || form.customer_phone.length < 10} onClick={() => void partnerBook()}>
            {t('venue.confirmManualBook')}
          </button>
        </div>
      )}

      <div className="venue-partner-layout">
        <div className="venue-partner-main">
          {rows.length === 0 ? (
            <div className="card venue-empty-card">
              <strong>{t('venue.noBookings')}</strong>
              <p>{t('venue.noBookingsHint')}</p>
              <div className="btn-row">
                <button type="button" className="accent" onClick={() => setShowBook(true)}>{t('venue.bookOnBehalf')}</button>
                <Link to="/venue/listings">{t('venue.listingsTitle')}</Link>
              </div>
            </div>
          ) : (
            rows.map((b) => (
              <Link
                className="card venue-booking-row"
                key={b.slug}
                to={`/venue/bookings/${b.slug}`}
              >
                <div>
                  <strong>{b.venue?.name}</strong>
                  <div className="meta">
                    <span>{when(b.starts_at || b.slot?.starts_at)} → {when(b.ends_at || b.slot?.ends_at)} · {b.guest_count} {t('venue.guests')}</span>
                  </div>
                  <div className="meta">
                    <span>
                      {b.customer?.name} · {b.customer?.phone}
                      {b.booked_by_partner ? ` · ${t('venue.manualTag')}` : ''}
                    </span>
                  </div>
                </div>
                <div className="venue-booking-right">
                  <StatusBadge value={b.status} />
                  <div><strong>{rupee(b.advance_inr || b.total_inr)}</strong></div>
                </div>
              </Link>
            ))
          )}
        </div>

        <aside className="card venue-calendar-card">
          <div className="card-kicker">{t('venue.calendar')}</div>
          <div className="field" style={{ marginBottom: 10 }}>
            <select value={venueId ?? ''} onChange={(e) => { setVenueId(+e.target.value); setPicked(null) }}>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="venue-cal-nav">
            <button type="button" onClick={() => shiftMonth(-1)}>‹</button>
            <strong>{monthLabel(year, month, locale)}</strong>
            <button type="button" onClick={() => shiftMonth(1)}>›</button>
          </div>
          <div className="venue-cal-legend">
            <span><i className="dot free" /> {t('venue.free')}</span>
            <span><i className="dot booked" /> {t('venue.booked')}</span>
          </div>
          <div className="venue-cal-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="venue-cal-grid">
            {Array.from({ length: firstWeekday }).map((_, i) => <span key={`e${i}`} className="venue-cal-empty" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const info = calendar?.days?.[String(day)]
              const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const status = info?.status || 'free'
              return (
                <button
                  type="button"
                  key={date}
                  className={`venue-cal-day ${status}${picked === date ? ' selected' : ''}`}
                  onClick={() => setPicked(date)}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {picked && (
            <div className="venue-cal-detail">
              <strong>{picked}</strong>
              {!pickedDay || pickedDay.bookings.length === 0 ? (
                <p className="meta">{t('venue.dayFree')}</p>
              ) : (
                pickedDay.bookings.map((b) => (
                  <Link key={b.slug} to={`/venue/bookings/${b.slug}`} className="venue-cal-booking">
                    <div><strong>{b.customer_name || t('venue.booking')}</strong></div>
                    <div className="meta">{when(b.starts_at)} → {when(b.ends_at)}</div>
                    <div className="meta">{b.guest_count} {t('venue.guests')} · {b.status}{b.booked_by_partner ? ` · ${t('venue.manualTag')}` : ''}</div>
                  </Link>
                ))
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
