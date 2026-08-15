import { useI18n } from '../i18n/LocaleContext'
import { rupee, when } from '../ui'

export type JobFactsData = {
  slug?: string
  city?: string
  address?: string
  notes?: string
  scheduled_start?: string
  scheduled_end?: string
  budget_inr?: number
  event_detail?: {
    title?: string
    venue_name?: string
    guest_count?: number
    dress_code?: string
    meal_included?: boolean
  }
  task_detail?: {
    title?: string
    description?: string
    pickup_address?: string
    drop_address?: string
    duration_minutes?: number
    rate_per_worker_inr?: number
  }
  requester?: { name?: string; phone?: string }
}

export function JobFacts({
  job,
  role,
  rate,
  start,
  end,
  showClient = false,
}: {
  job?: JobFactsData | null
  role?: string
  rate?: number | null
  start?: string | null
  end?: string | null
  showClient?: boolean
}) {
  const { t } = useI18n()
  if (!job) return null
  const ev = job.event_detail
  const task = job.task_detail
  const from = start || job.scheduled_start
  const to = end || job.scheduled_end
  const pay = rate || task?.rate_per_worker_inr

  return (
    <div className="kv">
      {role && <div className="kv-row"><span>{t('job.role')}</span><strong>{role}</strong></div>}
      {pay ? <div className="kv-row"><span>{t('job.rate')}</span><strong>{rupee(pay)}</strong></div> : null}
      <div className="kv-row"><span>{t('job.when')}</span><strong>{when(from)}{to ? ` → ${when(to)}` : ''}</strong></div>
      {job.city && <div className="kv-row"><span>{t('job.city')}</span><strong>{job.city}</strong></div>}
      {ev?.venue_name && <div className="kv-row"><span>{t('job.venue')}</span><strong>{ev.venue_name}</strong></div>}
      {job.address && <div className="kv-row"><span>{t('job.address')}</span><strong>{job.address}</strong></div>}
      {task?.pickup_address && <div className="kv-row"><span>{t('job.pickup')}</span><strong>{task.pickup_address}</strong></div>}
      {task?.drop_address && <div className="kv-row"><span>{t('job.drop')}</span><strong>{task.drop_address}</strong></div>}
      {ev?.guest_count ? <div className="kv-row"><span>{t('job.guests')}</span><strong>{ev.guest_count}</strong></div> : null}
      {ev?.dress_code && <div className="kv-row"><span>{t('job.dress')}</span><strong>{ev.dress_code}</strong></div>}
      {ev && <div className="kv-row"><span>{t('job.meal')}</span><strong>{ev.meal_included ? t('job.yes') : t('job.no')}</strong></div>}
      {task?.duration_minutes ? <div className="kv-row"><span>{t('job.duration')}</span><strong>{t('job.mins', { n: task.duration_minutes })}</strong></div> : null}
      {showClient && job.requester?.name && (
        <div className="kv-row">
          <span>{t('job.client')}</span>
          <strong>
            {job.requester.name}
            {job.requester.phone && (
              <>
                <br />
                <a href={`tel:${job.requester.phone}`}>{job.requester.phone}</a>
              </>
            )}
          </strong>
        </div>
      )}
      {job.notes && <div className="kv-row"><span>{t('job.notes')}</span><strong>{job.notes}</strong></div>}
      {task?.description && <div className="kv-row"><span>{t('job.notes')}</span><strong>{task.description}</strong></div>}
    </div>
  )
}
