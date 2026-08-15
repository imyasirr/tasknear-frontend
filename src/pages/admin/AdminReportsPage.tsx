import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'

type Report = {
  id: number
  reason: string
  status: string
  created_at?: string
  reporter?: { name: string; phone: string }
  reported?: { name: string; phone: string }
  payout?: { id: number; amount_inr: number; status: string } | null
  service_request?: { event_detail?: { title?: string }; task_detail?: { title?: string } } | null
}

export function AdminReportsPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<Report[]>([])
  const [picked, setPicked] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  async function load() {
    const data = await api<Report[]>('/admin/reports')
    setRows(data)
    setPicked((cur) => data.find((r) => r.id === cur?.id) || data[0] || null)
  }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  const open = useMemo(() => rows.filter((r) => r.status === 'open').length, [rows])
  const when = (r: Report) => r.created_at ? new Date(r.created_at).toLocaleString() : ''

  const columns: Column<Report>[] = [
    { key: 'from', header: t('cols.from'), sortValue: (r) => r.reporter?.name || '', csv: (r) => `${r.reporter?.name || ''} ${r.reporter?.phone || ''}`.trim(), render: (r) => <><strong>{r.reporter?.name}</strong><div className="meta"><span>{r.reporter?.phone}</span></div></> },
    { key: 'about', header: t('cols.about'), sortValue: (r) => r.reported?.name || '', csv: (r) => `${r.reported?.name || ''} ${r.reported?.phone || ''}`.trim(), render: (r) => <>{r.reported?.name}<div className="meta"><span>{r.reported?.phone}</span></div></> },
    { key: 'reason', header: t('cols.reason'), sortValue: (r) => r.reason, csv: (r) => r.reason, render: (r) => r.reason },
    { key: 'when', header: t('cols.when'), sortValue: (r) => r.created_at || '', csv: when, render: (r) => when(r) || '—' },
    { key: 'status', header: t('cols.status'), sortValue: (r) => r.status, csv: (r) => r.status, render: (r) => <StatusBadge value={r.status} /> },
  ]

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      {error && <p className="err">{error}</p>}
      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card"><div className="card-kicker">{t('reports.total')}</div><div className="stat">{rows.length}</div></div>
        <div className="card"><div className="card-kicker">{t('reports.open')}</div><div className="stat">{open}</div></div>
        <div className="card"><div className="card-kicker">{t('reports.closed')}</div><div className="stat">{rows.length - open}</div></div>
      </div>
      <div className="split">
        <div className="card flush">
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            filename="tasknear-reports"
            searchPlaceholder={t('reports.search')}
            selectedKey={picked?.id}
            onSelect={setPicked}
            empty={t('reports.empty')}
          />
        </div>
        <div className="side-panel card">
          <div className="card-kicker">{t('reports.review')}</div>
          {picked ? (
            <>
              <h2>{picked.reported?.name}</h2>
              <p style={{ margin: '8px 0 14px' }}>{picked.reason}</p>
              <div className="kv">
                <div className="kv-row"><span>From</span><strong>{picked.reporter?.name}</strong></div>
                <div className="kv-row"><span>Phone</span><strong>{picked.reporter?.phone}</strong></div>
                <div className="kv-row"><span>Job</span><strong>{picked.service_request?.event_detail?.title || picked.service_request?.task_detail?.title || '—'}</strong></div>
                {picked.payout && (
                  <div className="kv-row"><span>Payout</span><strong>#{picked.payout.id} · {rupee(picked.payout.amount_inr)} · {picked.payout.status}</strong></div>
                )}
                <div className="kv-row"><span>When</span><strong>{when(picked) || '—'}</strong></div>
                <div className="kv-row"><span>Status</span><StatusBadge value={picked.status} /></div>
              </div>
              {picked.status === 'open' && (
                <div className="btn-row" style={{ marginTop: 16 }}>
                  <button onClick={async () => { await api(`/admin/reports/${picked.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'resolved' }) }); await load() }}>{t('reports.resolve')}</button>
                  <button className="ghost" onClick={async () => { await api(`/admin/reports/${picked.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'dismissed' }) }); await load() }}>{t('reports.dismiss')}</button>
                </div>
              )}
            </>
          ) : <p>Select a report.</p>}
        </div>
      </div>
    </div>
  )
}
