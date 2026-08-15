import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'

type Payout = {
  id: number
  amount_inr: number
  status: string
  upi_vpa?: string
  paid_at?: string
  due_at?: string
  confirmed_at?: string
  disputed_at?: string
  worker?: { name: string; phone: string; caterer_profile?: { company_name?: string } }
  service_request?: {
    event_detail?: { title?: string }
    task_detail?: { title?: string }
    requester?: { name?: string }
  }
  assignment?: {
    shift?: { category?: { name: string } }
    service_request?: {
      event_detail?: { title?: string }
      task_detail?: { title?: string }
      requester?: { name?: string }
    }
  }
}

export function AdminPayoutsPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<Payout[]>([])
  const [tab, setTab] = useState('all')
  const [picked, setPicked] = useState<Payout | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  async function load() {
    const data = await api<Payout[]>('/admin/payouts')
    setRows(data)
    setPicked((cur) => data.find((p) => p.id === cur?.id) || data[0] || null)
  }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  const list = useMemo(() => rows.filter((p) => tab === 'all' || p.status === tab), [rows, tab])
  const scheduled = rows.filter((p) => p.status === 'scheduled').reduce((s, p) => s + p.amount_inr, 0)
  const sent = rows.filter((p) => p.status === 'sent' || p.status === 'pending').reduce((s, p) => s + p.amount_inr, 0)
  const confirmed = rows.filter((p) => p.status === 'confirmed' || p.status === 'released').reduce((s, p) => s + p.amount_inr, 0)
  const job = (p: Payout) => p.service_request?.event_detail?.title || p.service_request?.task_detail?.title || p.assignment?.service_request?.event_detail?.title || p.assignment?.service_request?.task_detail?.title || '—'
  const company = (p: Payout) => p.worker?.caterer_profile?.company_name || p.worker?.name || '—'
  const client = (p: Payout) => p.service_request?.requester?.name || p.assignment?.service_request?.requester?.name || '—'

  const columns: Column<Payout>[] = [
    { key: 'company', header: t('cols.caterer'), sortValue: company, csv: (p) => `${company(p)} ${p.worker?.phone || ''}`.trim(), render: (p) => <><strong>{company(p)}</strong><div className="meta"><span>{p.worker?.phone}</span></div></> },
    { key: 'job', header: t('cols.task'), sortValue: job, csv: job, render: job },
    { key: 'upi', header: t('cols.upi'), sortValue: (p) => p.upi_vpa || '', csv: (p) => p.upi_vpa, render: (p) => p.upi_vpa || '—' },
    { key: 'amount', header: t('cols.amount'), className: 'num', sortValue: (p) => p.amount_inr, csv: (p) => p.amount_inr, render: (p) => rupee(p.amount_inr) },
    { key: 'status', header: t('cols.status'), sortValue: (p) => p.status, csv: (p) => p.status, render: (p) => <StatusBadge value={p.status} /> },
  ]

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('payouts.title')} subtitle={t('payouts.subtitle')} />
      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card"><div className="card-kicker">{t('payouts.scheduled')}</div><div className="stat">{rupee(scheduled)}</div></div>
        <div className="card"><div className="card-kicker">{t('payouts.awaiting')}</div><div className="stat">{rupee(sent)}</div></div>
        <div className="card"><div className="card-kicker">{t('payouts.confirmed')}</div><div className="stat">{rupee(confirmed)}</div></div>
      </div>
      <div className="tabs">
        {[['all', t('tabs.all')], ['scheduled', t('tabs.scheduled')], ['sent', t('tabs.sent')], ['confirmed', t('tabs.confirmed')]].map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
      <div className="split">
        <div className="card flush">
          <DataTable
            rows={list}
            columns={columns}
            rowKey={(p) => p.id}
            filename="tasknear-payouts"
            searchPlaceholder={t('payouts.search')}
            selectedKey={picked?.id}
            onSelect={setPicked}
            empty={t('payouts.empty')}
          />
        </div>
        <div className="side-panel card">
          <div className="card-kicker">{t('payouts.transfer')}</div>
          {picked ? (
            <>
              <h2>{rupee(picked.amount_inr)}</h2>
              <div className="kv">
                <div className="kv-row"><span>{t('cols.caterer')}</span><strong>{company(picked)}</strong></div>
                <div className="kv-row"><span>{t('cols.phone')}</span><strong>{picked.worker?.phone || '—'}</strong></div>
                <div className="kv-row"><span>{t('cols.client')}</span><strong>{client(picked)}</strong></div>
                <div className="kv-row"><span>{t('cols.task')}</span><strong>{job(picked)}</strong></div>
                <div className="kv-row"><span>UPI</span><strong>{picked.upi_vpa || 'No VPA'}</strong></div>
                <div className="kv-row"><span>{t('cols.status')}</span><StatusBadge value={picked.status} /></div>
              </div>
              <div className="btn-row" style={{ marginTop: 16 }}>
                {picked.status === 'scheduled' && (
                  <button disabled={busy} onClick={async () => {
                    setBusy(true)
                    try { await api(`/admin/payouts/${picked.id}/send`, { method: 'POST' }); await load() }
                    catch (e) { setError(e instanceof Error ? e.message : 'Update failed') }
                    finally { setBusy(false) }
                  }}>{t('payouts.markSent')}</button>
                )}
                {(picked.status === 'sent' || picked.status === 'pending') && (
                  <button disabled={busy} onClick={async () => {
                    setBusy(true)
                    try { await api(`/admin/payouts/${picked.id}/release`, { method: 'POST' }); await load() }
                    catch (e) { setError(e instanceof Error ? e.message : 'Update failed') }
                    finally { setBusy(false) }
                  }}>{t('payouts.markGot')}</button>
                )}
              </div>
            </>
          ) : <p>{t('payouts.empty')}</p>}
        </div>
      </div>
    </div>
  )
}
