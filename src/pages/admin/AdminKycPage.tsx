import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, type Column } from '../../ui'
import { AdminAlert, AdminDetailCard, AdminPage, AdminTab, AdminTableCard, AdminTabs, AdminWorkspace } from './admin-ui'

type Doc = { id: number; type: string; status: string }
type Profile = {
  id: number
  status: string
  city?: string
  upi_vpa?: string
  pan_number?: string
  aadhaar_number?: string
  bank_account_name?: string
  bank_account_number?: string
  bank_ifsc?: string
  bank_name?: string
  rating_avg?: number
  user?: { name: string; phone: string }
  skills?: Array<{ category?: { name: string } }>
  documents?: Doc[]
}

export function AdminKycPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<Profile[]>([])
  const [tab, setTab] = useState('pending_kyc')
  const [picked, setPicked] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  async function load() {
    const data = await api<Profile[]>('/admin/kyc')
    setRows(data)
    setPicked((cur) => data.find((p) => p.id === cur?.id) || data[0] || null)
  }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  const filtered = useMemo(() => rows.filter((p) => tab === 'all' || p.status === tab), [rows, tab])
  const skills = (p: Profile) => p.skills?.map((s) => s.category?.name).filter(Boolean).join(', ') || ''

  const columns: Column<Profile>[] = [
    { key: 'name', header: t('cols.worker'), sortValue: (p) => p.user?.name || '', csv: (p) => p.user?.name, render: (p) => <strong>{p.user?.name}</strong> },
    { key: 'phone', header: t('cols.phone'), sortValue: (p) => p.user?.phone || '', csv: (p) => p.user?.phone, render: (p) => p.user?.phone || '—' },
    { key: 'city', header: t('cols.city'), sortValue: (p) => p.city || '', csv: (p) => p.city, render: (p) => p.city || '—' },
    { key: 'pan', header: 'PAN', sortValue: (p) => p.pan_number || '', csv: (p) => p.pan_number, render: (p) => p.pan_number || '—' },
    { key: 'skills', header: t('cols.skills'), sortValue: skills, csv: skills, render: (p) => skills(p) || '—' },
    { key: 'status', header: t('cols.status'), sortValue: (p) => p.status, csv: (p) => p.status, render: (p) => <StatusBadge value={p.status} /> },
  ]

  async function act(fn: () => Promise<unknown>) {
    if (!picked) return
    setBusy(true)
    setError('')
    try { await fn(); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed') }
    finally { setBusy(false) }
  }

  if (!ready) return <Loader />

  const tabs = [
    ['pending_kyc', t('tabs.pending')],
    ['active', t('tabs.active')],
    ['suspended', t('tabs.suspended')],
    ['all', t('tabs.all')],
  ] as const

  return (
    <AdminPage>
      <PageHeader title={t('kyc.title')} subtitle={t('kyc.subtitle')} />
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
              rows={filtered}
              columns={columns}
              rowKey={(p) => p.id}
              filename="tasknear-kyc"
              searchPlaceholder={t('kyc.search')}
              selectedKey={picked?.id}
              onSelect={setPicked}
              empty={t('kyc.empty')}
            />
          </AdminTableCard>
        )}
        detail={(
          <div className="side-panel">
            <AdminDetailCard
              kicker={t('kyc.review')}
              title={picked?.user?.name}
              empty={t('common.selectRow')}
              actions={picked ? (
                <>
                  {picked.status !== 'active' && <button className="accent" disabled={busy} onClick={() => act(() => api(`/admin/kyc/profiles/${picked.id}/approve`, { method: 'POST' }))}>{t('kyc.approve')}</button>}
                  {picked.status === 'pending_kyc' && <button className="ghost" disabled={busy} onClick={() => act(() => api(`/admin/kyc/profiles/${picked.id}/reject`, { method: 'POST', body: JSON.stringify({ review_note: 'Need clearer document' }) }))}>{t('kyc.reject')}</button>}
                  {picked.status === 'active' && <button className="danger" disabled={busy} onClick={() => act(() => api(`/admin/workers/${picked.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'suspended' }) }))}>{t('kyc.suspend')}</button>}
                  {picked.status === 'suspended' && <button className="accent" disabled={busy} onClick={() => act(() => api(`/admin/workers/${picked.id}/status`, { method: 'POST', body: JSON.stringify({ status: 'active' }) }))}>{t('kyc.reactivate')}</button>}
                </>
              ) : undefined}
            >
              {picked ? (
                <>
                  <div className="kv">
                    <div className="kv-row"><span>{t('cols.phone')}</span><strong>{picked.user?.phone}</strong></div>
                    <div className="kv-row"><span>{t('cols.city')}</span><strong>{picked.city || '—'}</strong></div>
                    <div className="kv-row"><span>PAN</span><strong>{picked.pan_number || '—'}</strong></div>
                    <div className="kv-row"><span>Aadhaar</span><strong>{picked.aadhaar_number || '—'}</strong></div>
                    <div className="kv-row"><span>UPI</span><strong>{picked.upi_vpa || '—'}</strong></div>
                    <div className="kv-row"><span>Bank</span><strong>{picked.bank_name || '—'}</strong></div>
                    <div className="kv-row"><span>Account</span><strong>{picked.bank_account_number || '—'}</strong></div>
                    <div className="kv-row"><span>IFSC</span><strong>{picked.bank_ifsc || '—'}</strong></div>
                    <div className="kv-row"><span>Holder</span><strong>{picked.bank_account_name || '—'}</strong></div>
                    <div className="kv-row"><span>{t('cols.skills')}</span><strong>{skills(picked) || '—'}</strong></div>
                    <div className="kv-row"><span>{t('cols.status')}</span><StatusBadge value={picked.status} /></div>
                  </div>
                  <div className="admin-section">
                    <div className="card-kicker">Documents</div>
                    {(picked.documents || []).map((d) => (
                      <div className="worker-row" key={d.id}>
                        <strong>{d.type}</strong>
                        <StatusBadge value={d.status} />
                      </div>
                    ))}
                    {(picked.documents || []).length === 0 && <p className="admin-form-hint">No documents uploaded.</p>}
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
