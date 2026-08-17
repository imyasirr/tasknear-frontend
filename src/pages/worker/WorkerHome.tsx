import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { IncomingWorkerRing, type WorkerAssignment } from '../../components/IncomingWorkerRing'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/LocaleContext'
import { workerJobPath } from '../../lib/paths'
import { AvailabilityToggle, Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

export function WorkerHome() {
  const { t } = useI18n()
  const { user, refresh } = useAuth()
  const [jobs, setJobs] = useState<WorkerAssignment[]>([])
  const profile = user?.worker_profile as { status?: string; is_available?: boolean } | null

  async function load() {
    setJobs(await api<WorkerAssignment[]>('/worker/jobs'))
  }
  const ready = useLivePoll(load, 2000)
  if (!ready) return <Loader label={t('common.loading')} />

  const rest = jobs.filter((j) => j.status !== 'invited' || !j.expires_at || new Date(j.expires_at).getTime() <= Date.now())

  return (
    <div className="page">
      <PageHeader
        title={t('worker.today')}
        subtitle={t('worker.todaySub')}
        actions={
          <AvailabilityToggle
            available={!!profile?.is_available}
            onToggle={async (next) => {
              await api('/worker/availability', { method: 'POST', body: JSON.stringify({ is_available: next }) })
              await refresh()
            }}
          />
        }
      />
      {profile?.status !== 'active' && (
        <div className="alert warn">{t('worker.kycNote')}</div>
      )}
      <IncomingWorkerRing jobs={jobs} onChange={load} />
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="btn-row">
          <StatusBadge value={profile?.status || 'pending_kyc'} />
          <StatusBadge value={profile?.is_available ? 'active' : 'pending'} />
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <Link to="/worker/profile"><button className="ghost">{t('worker.updateKyc')}</button></Link>
        </div>
      </div>
      <div className="grid two">
        {rest.map((job) => {
          const req = job.service_request
          const title = req?.event_detail?.title || req?.task_detail?.title || 'Job'
          return (
            <Link key={job.id} to={workerJobPath(job.id)} className="card">
              <StatusBadge value={job.status} />
              <h2 style={{ marginTop: 10 }}>{title}</h2>
              <div className="meta">
                {req?.budget_inr ? <span>{rupee(req.budget_inr)}</span> : null}
                <span>{req?.city}</span>
                {req?.scheduled_start && <span>{when(req.scheduled_start)}</span>}
              </div>
            </Link>
          )
        })}
        {rest.length === 0 && jobs.every((j) => j.status !== 'invited') && <div className="card empty">{t('worker.noJobs')}</div>}
      </div>
    </div>
  )
}
