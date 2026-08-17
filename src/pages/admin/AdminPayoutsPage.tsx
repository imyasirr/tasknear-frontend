import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'
import { AdminAlert, AdminDetailCard, AdminPage, AdminStat, AdminStats, AdminTab, AdminTableCard, AdminTabs, AdminWorkspace } from './admin-ui'

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

  const tabs = [
    ['all', t('tabs.all')],
    ['scheduled', t('tabs.scheduled')],
    ['sent', t('tabs.sent')],
    ['confirmed', t('tabs.confirmed')],
  ] as const

  if (!ready) return <Loader />

  return (
    <AdminPage>
      <PageHeader title={t('payouts.title')} subtitle={t('payouts.subtitle')} />
      <AdminStats>
        <AdminStat label={t('payouts.scheduled')} value={rupee(scheduled)} />
        <AdminStat label={t('payouts.awaiting')} value={rupee(sent)} />
        <AdminStat label={t('payouts.confirmed')} value={rupee(confirmed)} />
      </AdminStats>
      <AdminTabs>
        {tabs.map(([id, label]) => (
          <AdminTab key={id} active={tab === id} onClick={() => setTab(id)}>{label}</AdminTab>
        ))}
      </AdminTabs>
      <AdminAlert message={error} />
      <AdminWorkspace
        table={(
          <AdminTableCard>
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
          </AdminTableCard>
        )}
        detail={(
          <div className="side-panel">
            <AdminDetailCard
              kicker={t('payouts.transfer')}
              title={picked ? rupee(picked.amount_inr) : undefined}
              empty={t('common.selectRow')}
              actions={picked ? (
                <>
                  {picked.status === 'scheduled' && (
                    <button className="accent" disabled={busy} onClick={async () => {
                      setBusy(true)
                      try { await api(`/admin/payouts/${picked.id}/send`, { method: 'POST' }); await load() }
                      catch (e) { setError(e instanceof Error ? e.message : 'Update failed') }
                      finally { setBusy(false) }
                    }}
                    >
                      {t('payouts.markSent')}
                    </button>
                  )}
                  {(picked.status === 'sent' || picked.status === 'pending') && (
                    <button className="accent" disabled={busy} onClick={async () => {
                      setBusy(true)
                      try { await api(`/admin/payouts/${picked.id}/release`, { method: 'POST' }); await load() }
                      catch (e) { setError(e instanceof Error ? e.message : 'Update failed') }
                      finally { setBusy(false) }
                    }}
                    >
                      {t('payouts.markGot')}
                    </button>
                  )}
                </>
              ) : undefined}
            >
              {picked ? (
                <div className="kv">
                  <div className="kv-row"><span>{t('cols.caterer')}</span><strong>{company(picked)}</strong></div>
                  <div className="kv-row"><span>{t('cols.phone')}</span><strong>{picked.worker?.phone || '—'}</strong></div>
                  <div className="kv-row"><span>{t('cols.client')}</span><strong>{client(picked)}</strong></div>
                  <div className="kv-row"><span>{t('cols.task')}</span><strong>{job(picked)}</strong></div>
                  <div className="kv-row"><span>UPI</span><strong>{picked.upi_vpa || 'No VPA'}</strong></div>
                  <div className="kv-row"><span>{t('cols.status')}</span><StatusBadge value={picked.status} /></div>
                </div>
              ) : null}
            </AdminDetailCard>
          </div>
        )}
      />
    </AdminPage>
  )
}
