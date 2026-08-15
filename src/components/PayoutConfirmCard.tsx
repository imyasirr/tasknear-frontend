import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'
import { rupee, StatusBadge, when } from '../ui'

export type WorkerPayout = {
  id: number
  amount_inr: number
  status: string
  upi_vpa?: string | null
  paid_at?: string | null
  confirmed_at?: string | null
  disputed_at?: string | null
  assignment?: {
    id?: number
    shift?: { category?: { name?: string } }
    service_request?: {
      city?: string
      scheduled_start?: string
      event_detail?: { title?: string; venue_name?: string }
      task_detail?: { title?: string }
      requester?: { name?: string; phone?: string }
    }
  }
}

export function awaitingConfirm(status?: string) {
  return status === 'sent' || status === 'pending'
}

export function payoutJobTitle(payout: WorkerPayout, fallback = 'Job') {
  return payout.assignment?.service_request?.event_detail?.title
    || payout.assignment?.service_request?.task_detail?.title
    || fallback
}

export function PayoutConfirmCard({
  payout,
  onChange,
}: {
  payout: WorkerPayout
  onChange: () => Promise<void> | void
}) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [complain, setComplain] = useState(false)
  const title = payoutJobTitle(payout, t('worker.payoutJob'))
  const req = payout.assignment?.service_request
  const waiting = awaitingConfirm(payout.status)
  const got = payout.status === 'confirmed' || payout.status === 'released'
  const jobId = payout.assignment?.id

  async function act(path: string, body?: object) {
    setBusy(true)
    setError('')
    try {
      await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
      setComplain(false)
      setReason('')
      await onChange()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('worker.payoutFail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="card-kicker">{t('worker.thisPayout')}</div>
      <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h2 style={{ margin: 0 }}>{rupee(payout.amount_inr)}</h2>
        <StatusBadge value={payout.status} />
      </div>
      <p style={{ margin: '8px 0 0', fontWeight: 650 }}>{title}</p>
      <div className="kv" style={{ marginTop: 12 }}>
        {payout.assignment?.shift?.category?.name && (
          <div className="kv-row"><span>{t('job.role')}</span><strong>{payout.assignment.shift.category.name}</strong></div>
        )}
        {req?.city && <div className="kv-row"><span>{t('job.city')}</span><strong>{req.city}</strong></div>}
        {req?.event_detail?.venue_name && <div className="kv-row"><span>{t('job.venue')}</span><strong>{req.event_detail.venue_name}</strong></div>}
        {req?.scheduled_start && <div className="kv-row"><span>{t('job.when')}</span><strong>{when(req.scheduled_start)}</strong></div>}
        {req?.requester?.name && (
          <div className="kv-row">
            <span>{t('job.client')}</span>
            <strong>
              {req.requester.name}
              {req.requester.phone && (
                <>
                  <br />
                  <a href={`tel:${req.requester.phone}`}>{req.requester.phone}</a>
                </>
              )}
            </strong>
          </div>
        )}
        <div className="kv-row"><span>{t('worker.upi')}</span><strong>{payout.upi_vpa || '—'}</strong></div>
        <div className="kv-row"><span>{t('worker.sentAt')}</span><strong>{when(payout.paid_at)}</strong></div>
        {payout.confirmed_at && <div className="kv-row"><span>{t('worker.gotAt')}</span><strong>{when(payout.confirmed_at)}</strong></div>}
        {payout.disputed_at && <div className="kv-row"><span>{t('worker.complaintAt')}</span><strong>{when(payout.disputed_at)}</strong></div>}
      </div>

      {got && <div className="alert ok" style={{ marginTop: 14, marginBottom: 0 }}>{t('worker.payoutGot', { amount: rupee(payout.amount_inr) })}</div>}
      {payout.status === 'disputed' && <div className="alert warn" style={{ marginTop: 14, marginBottom: 0 }}>{t('worker.payoutComplaintOpen', { amount: rupee(payout.amount_inr) })}</div>}
      {waiting && !complain && <p style={{ margin: '14px 0 0' }}>{t('worker.payoutAsk', { job: title })}</p>}
      {error && <p className="err">{error}</p>}

      {waiting && !complain && (
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="accent" disabled={busy} onClick={() => act(`/payouts/${payout.id}/confirm`)}>
            {t('worker.payoutYes')}
          </button>
          <button className="ghost" disabled={busy} onClick={() => setComplain(true)}>
            {t('worker.payoutNo')}
          </button>
        </div>
      )}
      {waiting && complain && (
        <div style={{ marginTop: 14 }}>
          <div className="field">
            <label>{t('worker.payoutReason')}</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('worker.payoutReasonPh')} />
          </div>
          <div className="btn-row">
            <button className="danger" disabled={busy} onClick={() => act(`/payouts/${payout.id}/dispute`, { reason })}>
              {t('worker.payoutRaise')}
            </button>
            <button className="ghost" disabled={busy} onClick={() => setComplain(false)}>{t('common.cancel')}</button>
          </div>
        </div>
      )}
      {jobId && (
        <div className="btn-row" style={{ marginTop: 14 }}>
          <Link to={`/worker/jobs/${jobId}`}><button className="ghost">{t('worker.openJob')}</button></Link>
        </div>
      )}
    </div>
  )
}
