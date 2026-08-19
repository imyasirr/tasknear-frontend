import { useState } from 'react'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'

type Payout = {
  id: number
  amount_inr: number
  status: string
  upi_vpa?: string
  due_at?: string
  paid_at?: string
  confirmed_at?: string
  assignment?: {
    service_request?: {
      event_detail?: { title?: string }
      task_detail?: { title?: string }
    }
  }
}

type EarningsPayload = {
  pending_inr: number
  paid_inr: number
  disputed_inr: number
  payouts: Payout[]
}

export function WorkerEarningsPage() {
  const { t } = useI18n()
  const [data, setData] = useState<EarningsPayload | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [disputeId, setDisputeId] = useState<number | null>(null)
  const [disputeReason, setDisputeReason] = useState('')

  async function load() {
    setData(await api<EarningsPayload>('/worker/earnings'))
  }
  const ready = useLivePoll(load, 4000)

  const rows = data?.payouts || []
  const job = (p: Payout) =>
    p.assignment?.service_request?.event_detail?.title
    || p.assignment?.service_request?.task_detail?.title
    || '—'

  const columns: Column<Payout>[] = [
    { key: 'job', header: t('worker.payoutJob'), sortValue: job, csv: job, render: job },
    { key: 'amount', header: t('cols.amount'), className: 'num', sortValue: (p) => p.amount_inr, csv: (p) => p.amount_inr, render: (p) => rupee(p.amount_inr) },
    { key: 'upi', header: t('cols.upi'), sortValue: (p) => p.upi_vpa || '', csv: (p) => p.upi_vpa, render: (p) => p.upi_vpa || '—' },
    { key: 'status', header: t('cols.status'), sortValue: (p) => p.status, csv: (p) => p.status, render: (p) => <StatusBadge value={p.status} /> },
  ]

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page">
      <PageHeader title={t('worker.earnings')} subtitle={t('worker.earningsSub')} />
      <div className="grid three earnings-stats">
        <div className="card"><div className="card-kicker">{t('worker.payoutAwaiting')}</div><div className="stat">{rupee(data?.pending_inr || 0)}</div></div>
        <div className="card"><div className="card-kicker">{t('worker.totalEarned')}</div><div className="stat">{rupee(data?.paid_inr || 0)}</div></div>
        <div className="card"><div className="card-kicker">{t('worker.payoutDisputed')}</div><div className="stat">{rupee(data?.disputed_inr || 0)}</div></div>
      </div>
      {error && <p className="err">{error}</p>}
      <div className="card flush">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(p) => p.id}
          filename="tasknear-worker-earnings"
          searchPlaceholder={t('payouts.search')}
          empty={t('worker.payoutEmpty')}
        />
      </div>
      {rows.filter((p) => p.status === 'sent' || p.status === 'pending').map((p) => (
        <div className="card payout-action-card" key={`ask-${p.id}`}>
          <div className="card-kicker">{t('worker.payoutAsk', { job: job(p) })}</div>
          <p style={{ margin: '8px 0' }}>{rupee(p.amount_inr)} · {p.upi_vpa || t('worker.noUpi')}</p>
          <div className="btn-row">
            <button
              className="accent"
              disabled={busy === p.id}
              onClick={async () => {
                setBusy(p.id)
                setError('')
                try {
                  await api(`/worker/payouts/${p.id}/confirm`, { method: 'POST' })
                  await load()
                } catch (e) {
                  setError(e instanceof Error ? e.message : t('worker.payoutFail'))
                } finally {
                  setBusy(null)
                }
              }}
            >
              {t('worker.payoutYes')}
            </button>
            <button
              type="button"
              disabled={busy === p.id}
              onClick={() => setDisputeId(disputeId === p.id ? null : p.id)}
            >
              {t('worker.payoutNo')}
            </button>
          </div>
          {disputeId === p.id && (
            <div className="dispute-box">
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={t('worker.payoutReasonPh')}
              />
              <button
                className="bad"
                disabled={busy === p.id}
                onClick={async () => {
                  setBusy(p.id)
                  setError('')
                  try {
                    await api(`/worker/payouts/${p.id}/dispute`, {
                      method: 'POST',
                      body: JSON.stringify({ reason: disputeReason }),
                    })
                    setDisputeId(null)
                    setDisputeReason('')
                    await load()
                  } catch (e) {
                    setError(e instanceof Error ? e.message : t('worker.payoutFail'))
                  } finally {
                    setBusy(null)
                  }
                }}
              >
                {t('worker.payoutRaise')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
