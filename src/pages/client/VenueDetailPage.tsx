import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, rupee } from '../../ui'

type AmenityLabel = { type?: string; en?: string; hi?: string; value?: number | boolean }
type BookedRange = { starts_at: string; ends_at: string; status: string }
type VenueDetail = {
  id: number
  slug: string
  name: string
  description?: string
  address?: string
  city?: string
  venue_type: string
  capacity_min: number
  capacity_max: number
  advance_percent: number
  price_per_day_inr: number
  amenities?: Record<string, number | boolean> | string[]
  amenity_labels?: Record<string, AmenityLabel>
  photos?: Array<{ url: string }>
  partner?: { company_name?: string }
  booked_ranges?: BookedRange[]
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseYmd(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dayBooked(date: string, ranges: BookedRange[]) {
  const start = parseYmd(date).getTime()
  const end = start + 24 * 60 * 60 * 1000 - 1
  return ranges.some((r) => {
    const rs = new Date(r.starts_at).getTime()
    const re = new Date(r.ends_at).getTime()
    return start < re && end > rs
  })
}

function rangeHasBooked(start: string, end: string, ranges: BookedRange[]) {
  const a = parseYmd(start)
  const b = parseYmd(end)
  const from = a <= b ? a : b
  const to = a <= b ? b : a
  const cur = new Date(from)
  while (cur <= to) {
    if (dayBooked(ymd(cur), ranges)) return true
    cur.setDate(cur.getDate() + 1)
  }
  return false
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0
  const a = parseYmd(start).getTime()
  const b = parseYmd(end).getTime()
  if (b < a) return 0
  return Math.floor((b - a) / (1000 * 60 * 60 * 24)) + 1
}

function monthLabel(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function VenueDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [venue, setVenue] = useState<VenueDetail | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('22:00')
  const [guests, setGuests] = useState(100)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!slug) return
    api<VenueDetail>(`/venues/${slug}`).then((v) => {
      setVenue(v)
      setGuests(v.capacity_min)
    }).finally(() => setReady(true))
  }, [slug])

  const ranges = venue?.booked_ranges || []
  const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month])
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month])
  const today = ymd(new Date())

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    const from = startDate <= endDate ? startDate : endDate
    const to = startDate <= endDate ? endDate : startDate
    return daysBetween(from, to)
  }, [startDate, endDate])

  const orderedStart = startDate && endDate ? (startDate <= endDate ? startDate : endDate) : startDate
  const orderedEnd = startDate && endDate ? (startDate <= endDate ? endDate : startDate) : endDate
  const conflict = orderedStart && orderedEnd ? rangeHasBooked(orderedStart, orderedEnd, ranges) : false
  const total = venue && days ? venue.price_per_day_inr * days : 0
  const advance = venue && total ? Math.max(1, Math.round(total * venue.advance_percent / 100)) : 0

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  function pickDay(date: string) {
    if (date < today) return
    if (dayBooked(date, ranges)) return

    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate('')
      setError('')
      return
    }

    const from = startDate <= date ? startDate : date
    const to = startDate <= date ? date : startDate
    if (rangeHasBooked(from, to, ranges)) {
      setError(t('venue.slotConflict'))
      return
    }
    setEndDate(date)
    setError('')
  }

  function inSelectedRange(date: string) {
    if (!orderedStart) return false
    if (!orderedEnd) return date === orderedStart
    return date >= orderedStart && date <= orderedEnd
  }

  const amenityText = (key: string, row?: AmenityLabel) => {
    const name = locale === 'hi' && row?.hi ? row.hi : (row?.en || key)
    if (row?.type === 'count' || typeof row?.value === 'number') return `${name}: ${row?.value ?? 0}`
    return name
  }

  async function book() {
    if (!venue || !orderedStart || !orderedEnd || conflict) return
    setBusy(true)
    setError('')
    try {
      const starts_at = `${orderedStart}T${startTime}:00`
      const ends_at = `${orderedEnd}T${endTime}:00`
      const booking = await api<{ slug: string }>('/venue-bookings', {
        method: 'POST',
        body: JSON.stringify({
          venue_id: venue.id,
          starts_at,
          ends_at,
          guest_count: guests,
          notes: notes || null,
        }),
      })
      navigate(`/app/venue-bookings/${booking.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loader label={t('common.loading')} />
  if (!venue) return <p className="empty">{t('common.empty')}</p>

  const amenityEntries = Object.entries(venue.amenity_labels || {})

  return (
    <div className="page venue-page">
      <PageHeader
        title={venue.name}
        subtitle={`${venue.city || ''} · ${venue.partner?.company_name || ''} · ${t(`venue.type.${venue.venue_type}`)}`}
      />

      {(venue.photos || []).length > 0 && (
        <div className="venue-gallery venue-gallery-lg" style={{ marginBottom: 18 }}>
          {venue.photos!.map((p, i) => (
            <img key={i} src={p.url} alt="" className="venue-gallery-img" />
          ))}
        </div>
      )}

      <div className="venue-book-layout">
        <div className="card venue-card">
          <div className="card-kicker">{t('venue.about')}</div>
          <p>{venue.description || '—'}</p>
          <p className="meta">{venue.address}</p>
          <div className="kv" style={{ marginTop: 12 }}>
            <div className="kv-row"><span>{t('venue.guests')}</span><strong>{venue.capacity_min}–{venue.capacity_max}</strong></div>
            <div className="kv-row"><span>{t('venue.pricePerDay')}</span><strong>{rupee(venue.price_per_day_inr)}</strong></div>
            <div className="kv-row"><span>{t('venue.advancePercent')}</span><strong>{venue.advance_percent}%</strong></div>
          </div>
          {amenityEntries.length > 0 && (
            <div className="venue-amenity-list">
              {amenityEntries.map(([key, row]) => (
                <span key={key} className="venue-amenity-pill">{amenityText(key, row)}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card venue-card venue-book-card">
          <div className="card-kicker">{t('venue.bookSlot')}</div>
          <p className="meta" style={{ marginBottom: 10 }}>{t('venue.calendarPickHint')}</p>

          <div className="venue-cal-legend" style={{ marginBottom: 8 }}>
            <span><i className="dot free" /> {t('venue.free')}</span>
            <span><i className="dot booked" /> {t('venue.booked')}</span>
            <span><i className="dot selected" /> {t('venue.selected')}</span>
          </div>

          <div className="venue-cal-nav">
            <button type="button" onClick={() => shiftMonth(-1)}>‹</button>
            <strong>{monthLabel(year, month, locale)}</strong>
            <button type="button" onClick={() => shiftMonth(1)}>›</button>
          </div>

          <div className="venue-cal-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="venue-cal-grid">
            {Array.from({ length: firstWeekday }).map((_, i) => <span key={`e${i}`} className="venue-cal-empty" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const booked = dayBooked(date, ranges)
              const past = date < today
              const selected = inSelectedRange(date)
              const disabled = booked || past
              return (
                <button
                  type="button"
                  key={date}
                  disabled={disabled}
                  className={[
                    'venue-cal-day',
                    booked ? 'booked' : 'free',
                    past ? 'past' : '',
                    selected ? 'selected' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pickDay(date)}
                  title={booked ? t('venue.booked') : past ? t('venue.pastDay') : t('venue.free')}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <p className="meta" style={{ marginTop: 10 }}>
            {!startDate && t('venue.pickStartDay')}
            {startDate && !endDate && t('venue.pickEndDay')}
            {orderedStart && orderedEnd && (
              <>{orderedStart} → {orderedEnd} · {days} {t('venue.days')}</>
            )}
          </p>

          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="field">
              <label>{t('venue.startTime')}</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('venue.endTime')}</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('venue.guests')}</label>
              <input type="number" min={venue.capacity_min} max={venue.capacity_max} value={guests} onChange={(e) => setGuests(+e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>{t('venue.notes')}</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {conflict && <div className="alert warn" style={{ marginTop: 12 }}>{t('venue.slotConflict')}</div>}
          {days > 0 && !conflict && (
            <div className="kv" style={{ marginTop: 12 }}>
              <div className="kv-row"><span>{t('venue.days')}</span><strong>{days}</strong></div>
              <div className="kv-row"><span>{t('venue.total')}</span><strong>{rupee(total)}</strong></div>
              <div className="kv-row"><span>{t('venue.advanceNow')}</span><strong>{rupee(advance)}</strong></div>
            </div>
          )}
          {error && <p className="err">{error}</p>}
          <button
            className="accent"
            style={{ marginTop: 12, width: '100%' }}
            disabled={busy || !orderedStart || !orderedEnd || conflict}
            onClick={() => void book()}
          >
            {t('venue.bookNow')}
          </button>
        </div>
      </div>
    </div>
  )
}
