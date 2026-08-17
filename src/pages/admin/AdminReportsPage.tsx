import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'
import { AdminAlert, AdminDetailCard, AdminPage, AdminStat, AdminStats, AdminTableCard, AdminWorkspace } from './admin-ui'

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
    <AdminPage>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <AdminStats>
        <AdminStat label={t('reports.total')} value={rows.length} />
        <AdminStat label={t('reports.open')} value={open} />
        <AdminStat label={t('reports.closed')} value={rows.length - open} />
      </AdminStats>
      <AdminAlert message={error} />
      <AdminWorkspace
        table={(
          <AdminTableCard>
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
          </AdminTableCard>
        )}
        detail={(
          <div className="side-panel">
            <AdminDetailCard
              kicker={t('reports.review')}
              title={picked?.reported?.name}
              empty={t('common.selectRow')}
              actions={picked?.status === 'open' ? (
                <>
                  <button className="accent" onClick={async () => { await api(`/admin/reports/${picked.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'resolved' }) }); await load() }}>{t('reports.resolve')}</button>
                  <button className="ghost" onClick={async () => { await api(`/admin/reports/${picked.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'dismissed' }) }); await load() }}>{t('reports.dismiss')}</button>
                </>
              ) : undefined}
            >
              {picked ? (
                <>
                  <p className="admin-form-hint">{picked.reason}</p>
                  <div className="kv">
                    <div className="kv-row"><span>From</span><strong>{picked.reporter?.name}</strong></div>
                    <div className="kv-row"><span>{t('cols.phone')}</span><strong>{picked.reporter?.phone}</strong></div>
                    <div className="kv-row"><span>Job</span><strong>{picked.service_request?.event_detail?.title || picked.service_request?.task_detail?.title || '—'}</strong></div>
                    {picked.payout && (
                      <div className="kv-row"><span>Payout</span><strong>#{picked.payout.id} · {rupee(picked.payout.amount_inr)} · {picked.payout.status}</strong></div>
                    )}
                    <div className="kv-row"><span>{t('cols.when')}</span><strong>{when(picked) || '—'}</strong></div>
                    <div className="kv-row"><span>{t('cols.status')}</span><StatusBadge value={picked.status} /></div>
                  </div>
                </>
              ) : null}
            </AdminDetailCard>
          </div>
        )}
      />
    </AdminPage>
  )
}
