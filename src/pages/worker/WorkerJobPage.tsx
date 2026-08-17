import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { IncomingWorkerRing, type WorkerAssignment } from '../../components/IncomingWorkerRing'
import { JobFacts } from '../../components/JobFacts'
import { JobLayout, RolePackage } from '../../components/JobLayout'
import { VenueOtpPad } from '../../components/VenueOtpPad'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge, rupee } from '../../ui'

export function WorkerJobPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const [job, setJob] = useState<WorkerAssignment | null>(null)
  const [error, setError] = useState('')

  async function load() {
    if (!id) return
    try {
      setJob(await api<WorkerAssignment>(`/worker/jobs/${id}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }
  const ready = useLivePoll(load, 2000, [id])
  if (!ready) return <Loader label={t('common.loading')} />
  if (!job) return <p className="err">{error || t('common.empty')}</p>

  const req = job.service_request
  const title = req?.event_detail?.title || req?.task_detail?.title || 'Job'
  const attendance = (job as WorkerAssignment & { attendance?: { check_in_at?: string; check_out_at?: string } }).attendance
  const canCheckIn = ['accepted'].includes(job.status) && !attendance?.check_in_at
  const canCheckOut = ['accepted', 'checked_in'].includes(job.status) && attendance?.check_in_at && !attendance?.check_out_at
  const shifts = req?.event_detail?.shifts || (req?.task_detail ? [{
    headcount: req.required_workers,
    category: req.task_detail.category,
    rate_per_worker_inr: (req.task_detail as { rate_per_worker_inr?: number }).rate_per_worker_inr,
  }] : [])

  return (
    <JobLayout
      header={
        <PageHeader
          title={title}
          subtitle={`${req?.city || ''}${req?.budget_inr ? ` · ${rupee(req.budget_inr)}` : ''}`}
          actions={<StatusBadge value={job.status} />}
        />
      }
      action={
        <>
          {job.status === 'invited' && <IncomingWorkerRing jobs={[job]} onChange={load} compact />}
          {canCheckIn && (
            <VenueOtpPad
              mode="in"
              onSubmit={async (otp) => {
                await api(`/worker/jobs/${id}/check-in`, { method: 'POST', body: JSON.stringify({ otp }) })
                await load()
              }}
            />
          )}
          {canCheckOut && (
            <VenueOtpPad
              mode="out"
              onSubmit={async (otp) => {
                await api(`/worker/jobs/${id}/check-out`, { method: 'POST', body: JSON.stringify({ otp }) })
                await load()
              }}
            />
          )}
          {job.status === 'expired' && <div className="alert warn">{t('worker.offerGone')}</div>}
          {error && <p className="err">{error}</p>}
        </>
      }
      main={<RolePackage shifts={shifts} headcount={req?.required_workers} />}
      side={
        <div className="card">
          <div className="card-kicker">{t('job.details')}</div>
          <JobFacts job={req} showClient />
        </div>
      }
    />
  )
}
