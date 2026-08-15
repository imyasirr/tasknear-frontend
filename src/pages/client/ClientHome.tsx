import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { eventPath, taskPath } from '../../lib/paths'
import { Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

type Row = {
  id: number
  slug?: string
  status: string
  city: string
  budget_inr: number
  scheduled_start?: string
  event_detail?: { title: string; venue_name?: string }
  task_detail?: { title: string }
  vendor_company?: { name?: string } | null
  vendor_ring?: { ringing?: boolean } | null
}

export function ClientHome() {
  const { t } = useI18n()
  const [events, setEvents] = useState<Row[]>([])
  const [tasks, setTasks] = useState<Row[]>([])
  const [error, setError] = useState('')

  const ready = useLivePoll(async () => {
    try {
      const [e, t] = await Promise.all([api<Row[]>('/events'), api<Row[]>('/tasks')])
      setEvents(e)
      setTasks(t)
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
          <>
            <Link to="/app/tasks/new"><button className="ghost">{t('client.postTask')}</button></Link>
            <Link to="/app/events/new"><button className="accent">{t('client.createEvent')}</button></Link>
          </>
        }
      />
      {error && <p className="err">{error}</p>}
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
              <span>{rupee(task.budget_inr)}</span>
            </div>
          </Link>
        ))}
        {tasks.length === 0 && <div className="card empty">{t('client.noTasks')}</div>}
      </div>
    </div>
  )
}
