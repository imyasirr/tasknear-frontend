import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { eventPath, taskPath } from '../../lib/paths'
import { providerLabel, type ProviderTypeRow } from '../../lib/providerTypes'
import { Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

type Row = {
  id: number
  slug?: string
  status: string
  city: string
  budget_inr: number
  provider_type?: string
  scheduled_start?: string
  event_detail?: { title: string; venue_name?: string }
  task_detail?: { title: string; category?: CategoryRow }
  vendor_company?: { name?: string } | null
  vendor_ring?: { ringing?: boolean } | null
}

type VenueBooking = {
  slug: string
  status: string
  guest_count: number
  total_inr: number
  advance_inr: number
  starts_at?: string
  ends_at?: string
  venue?: { name?: string; city?: string }
  slot?: { starts_at?: string; ends_at?: string }
}

function providerName(providers: ProviderTypeRow[], slug: string | undefined, locale: string): string | null {
  if (!slug) return null
  const row = providers.find((p) => p.slug === slug)
  return row ? providerLabel(row, locale) : slug
}

export function ClientHome() {
  const { t, locale } = useI18n()
  const [events, setEvents] = useState<Row[]>([])
  const [tasks, setTasks] = useState<Row[]>([])
  const [venues, setVenues] = useState<VenueBooking[]>([])
  const [providers, setProviders] = useState<ProviderTypeRow[]>([])
  const [error, setError] = useState('')

  const ready = useLivePoll(async () => {
    try {
      const [e, taskRows, venueRows, providerRows] = await Promise.all([
        api<Row[]>('/events'),
        api<Row[]>('/tasks'),
        api<VenueBooking[]>('/venue-bookings/mine'),
        api<ProviderTypeRow[]>('/provider-types'),
      ])
      setEvents(e)
      setTasks(taskRows)
      setVenues(venueRows)
      setProviders(providerRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }, 3000)

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div>
      <PageHeader
        title={t('client.bookings')}
        subtitle={t('client.bookingsSub')}
        actions={
          <div className="btn-row">
            <Link to="/app/venues"><button type="button">{t('nav.venues')}</button></Link>
            <Link to="/app/post"><button className="accent">{t('client.postJob')}</button></Link>
          </div>
        }
      />
      {error && <p className="err">{error}</p>}

      <div className="card-kicker">{t('nav.venues')}</div>
      <div className="grid two" style={{ marginBottom: 28 }}>
        {venues.map((v) => (
          <Link key={v.slug} to={`/app/venue-bookings/${v.slug}`} className="card">
            <StatusBadge value={v.status} />
            <h2 style={{ marginTop: 10 }}>{v.venue?.name || t('venue.booking')}</h2>
            <div className="meta">
              {v.venue?.city && <span>{v.venue.city}</span>}
              <span>{when(v.starts_at || v.slot?.starts_at)} → {when(v.ends_at || v.slot?.ends_at)}</span>
              <span>{v.guest_count} {t('venue.guests')}</span>
              <span>{rupee(v.advance_inr || v.total_inr)}</span>
            </div>
          </Link>
        ))}
        {venues.length === 0 && (
          <div className="card empty">
            {t('venue.noClientBookings')}{' '}
            <Link to="/app/venues">{t('venue.browseTitle')}</Link>
          </div>
        )}
      </div>

      <div className="card-kicker">{t('client.events')}</div>
      <div className="grid two" style={{ marginBottom: 28 }}>
        {events.map((event) => (
          <Link key={event.id} to={eventPath(event)} className="card">
            <StatusBadge value={event.status} />
            <h2 style={{ marginTop: 10 }}>{event.event_detail?.title}</h2>
            <div className="meta">
              <span>{event.city}</span>
              <span>{event.event_detail?.venue_name || 'Venue TBD'}</span>
              <span>{rupee(event.budget_inr)}</span>
              {event.scheduled_start && <span>{when(event.scheduled_start)}</span>}
              {providerName(providers, event.provider_type, locale) && (
                <span>{providerName(providers, event.provider_type, locale)}</span>
              )}
              {event.vendor_company?.name && <span>{event.vendor_company.name}</span>}
              {event.vendor_ring?.ringing && <span>{t('nav.caterer')}</span>}
            </div>
          </Link>
        ))}
        {events.length === 0 && <div className="card empty">{t('client.noEvents')}</div>}
      </div>
      <div className="card-kicker">{t('client.tasks')}</div>
      <div className="grid two">
        {tasks.map((task) => (
          <Link key={task.id} to={taskPath(task)} className="card">
            <StatusBadge value={task.status} />
            <h2 style={{ marginTop: 10 }}>{task.task_detail?.title}</h2>
            <div className="meta">
              <span>{task.city}</span>
              {task.task_detail?.category && <span>{categoryLabel(task.task_detail.category, locale)}</span>}
              {providerName(providers, task.provider_type, locale) && (
                <span>{providerName(providers, task.provider_type, locale)}</span>
              )}
              <span>{rupee(task.budget_inr)}</span>
            </div>
          </Link>
        ))}
        {tasks.length === 0 && <div className="card empty">{t('client.noTasks')}</div>}
      </div>
    </div>
  )
}
