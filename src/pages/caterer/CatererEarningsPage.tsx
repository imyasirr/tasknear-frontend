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
  service_request?: {
    event_detail?: { title?: string }
    task_detail?: { title?: string }
  }
}

export function CatererEarningsPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<Payout[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  async function load() {
    setRows(await api<Payout[]>('/caterer/payouts'))
  }
  const ready = useLivePoll(load, 4000)

  const scheduled = rows.filter((p) => p.status === 'scheduled').reduce((s, p) => s + p.amount_inr, 0)
  const sent = rows.filter((p) => p.status === 'sent' || p.status === 'pending').reduce((s, p) => s + p.amount_inr, 0)
  const confirmed = rows.filter((p) => p.status === 'confirmed' || p.status === 'released').reduce((s, p) => s + p.amount_inr, 0)
  const job = (p: Payout) => p.service_request?.event_detail?.title || p.service_request?.task_detail?.title || '—'

  const columns: Column<Payout>[] = [
    { key: 'job', header: t('worker.payoutJob'), sortValue: job, csv: job, render: job },
    { key: 'amount', header: t('cols.amount'), className: 'num', sortValue: (p) => p.amount_inr, csv: (p) => p.amount_inr, render: (p) => rupee(p.amount_inr) },
    { key: 'upi', header: t('cols.upi'), sortValue: (p) => p.upi_vpa || '', csv: (p) => p.upi_vpa, render: (p) => p.upi_vpa || '—' },
    { key: 'status', header: t('cols.status'), sortValue: (p) => p.status, csv: (p) => p.status, render: (p) => <StatusBadge value={p.status} /> },
  ]

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page">
      <PageHeader title={t('caterer.earnings')} subtitle={t('caterer.earningsSub')} />
      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card"><div className="card-kicker">{t('caterer.settleTomorrow')}</div><div className="stat">{rupee(scheduled)}</div></div>
        <div className="card"><div className="card-kicker">{t('payouts.awaiting')}</div><div className="stat">{rupee(sent)}</div></div>
        <div className="card"><div className="card-kicker">{t('payouts.confirmed')}</div><div className="stat">{rupee(confirmed)}</div></div>
      </div>
      {error && <p className="err">{error}</p>}
      <div className="card flush">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(p) => p.id}
          filename="tasknear-earnings"
          searchPlaceholder={t('payouts.search')}
          empty={t('caterer.payoutEmpty')}
        />
      </div>
      {rows.filter((p) => p.status === 'sent' || p.status === 'pending').map((p) => (
        <div className="card" key={`ask-${p.id}`} style={{ marginTop: 14 }}>
          <div className="card-kicker">{t('caterer.payoutAsk', { job: job(p) })}</div>
          <p style={{ margin: '8px 0' }}>{rupee(p.amount_inr)} · {p.upi_vpa || t('caterer.noUpi')}</p>
          <button
            className="accent"
            disabled={busy === p.id}
            onClick={async () => {
              setBusy(p.id)
              setError('')
              try {
                await api(`/caterer/payouts/${p.id}/confirm`, { method: 'POST' })
                await load()
              } catch (e) {
                setError(e instanceof Error ? e.message : t('caterer.payoutFail'))
              } finally {
                setBusy(null)
              }
            }}
          >
            {t('caterer.payoutYes')}
          </button>
        </div>
      ))}
    </div>
  )
}
