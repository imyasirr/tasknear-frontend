import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { AdminRematchControls } from '../../components/AdminRematchControls'
import { slugOf } from '../../lib/paths'
import { useAdminRingSeconds } from '../../hooks/useAdminRingSeconds'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'

type Booking = {
  id: number
  slug?: string
  type: string
  status: string
  city: string
  budget_inr: number
  required_workers: number
  requester?: { name: string; phone?: string }
  task_detail?: { title: string; pickup_address?: string; drop_address?: string }
  vendor_company?: { name?: string; phone?: string } | null
  vendor_ring?: { ringing?: boolean; count?: number } | null
  vendor_offers?: Array<{ id: number; status: string; company?: string; phone?: string }>
}

export function AdminTasksPage() {
  const { t } = useI18n()
  const { slug } = useParams()
  const navigate = useNavigate()
  const [rows, setRows] = useState<Booking[]>([])
  const [tab, setTab] = useState('open')
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<Booking | null>(null)
  const [ready, setReady] = useState(false)
  const defaultRingSeconds = useAdminRingSeconds()

  async function load() {
    const all = await api<Booking[]>('/admin/bookings')
    const tasks = all.filter((b) => b.type === 'task')
    setRows(tasks)
    setPicked((cur) => {
      const fromUrl = tasks.find((row) => row.slug === slug || String(row.id) === slug)
      return fromUrl || tasks.find((row) => row.id === cur?.id) || tasks[0] || null
    })
  }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  function select(row: Booking) {
    setPicked(row)
    navigate(`/admin/tasks/${slugOf(row)}`, { replace: true })
  }

  const list = useMemo(() => rows.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'open') return !['completed', 'settled', 'cancelled'].includes(b.status)
    return b.status === tab
  }), [rows, tab])

  const columns: Column<Booking>[] = [
    { key: 'task', header: t('cols.task'), sortValue: (row) => row.task_detail?.title || '', csv: (row) => row.task_detail?.title, render: (row) => <><strong>{row.task_detail?.title}</strong><div className="meta"><span>{row.task_detail?.pickup_address || 'Pickup'} → {row.task_detail?.drop_address || 'Drop'}</span></div></> },
    { key: 'client', header: t('cols.client'), sortValue: (row) => row.requester?.name || '', csv: (row) => row.requester?.name, render: (row) => row.requester?.name || '—' },
    { key: 'caterer', header: t('cols.caterer'), sortValue: (row) => row.vendor_company?.name || '', csv: (row) => row.vendor_company?.name || '', render: (row) => row.vendor_company?.name || (row.vendor_ring?.ringing ? `${row.vendor_ring.count || 0}` : '—') },
    { key: 'city', header: t('cols.city'), sortValue: (row) => row.city, csv: (row) => row.city, render: (row) => row.city },
    { key: 'crew', header: t('cols.crew'), sortValue: (row) => row.required_workers, csv: (row) => String(row.required_workers), render: (row) => String(row.required_workers) },
    { key: 'budget', header: t('cols.budget'), className: 'num', sortValue: (row) => row.budget_inr, csv: (row) => row.budget_inr, render: (row) => rupee(row.budget_inr) },
    { key: 'status', header: t('cols.status'), sortValue: (row) => row.status, csv: (row) => row.status, render: (row) => <StatusBadge value={row.status} /> },
  ]

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('tasks.title')} subtitle={t('tasks.subtitle')} />
      <div className="tabs">
        {[['open', t('tabs.open')], ['filling', t('tabs.filling')], ['confirmed', t('tabs.confirmed')], ['completed', t('tabs.done')], ['all', t('tabs.all')]].map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
      <div className="split">
        <div className="card flush">
          <DataTable
            rows={list}
            columns={columns}
            rowKey={(t) => t.id}
            filename="tasknear-tasks"
            searchPlaceholder={t('tasks.search')}
            selectedKey={picked?.id}
            onSelect={select}
            empty={t('tasks.empty')}
          />
        </div>
        <div className="side-panel">
          {picked ? (
            <>
              <div className="card">
                <div className="card-kicker">Selected task</div>
                <h2>{picked.task_detail?.title}</h2>
                <div className="kv">
                  <div className="kv-row"><span>{t('cols.client')}</span><strong>{picked.requester?.name}</strong></div>
                  <div className="kv-row"><span>{t('cols.caterer')}</span><strong>{picked.vendor_company?.name || (picked.vendor_ring?.ringing ? t('client.vendorRinging', { n: picked.vendor_ring.count || 0 }) : '—')}</strong></div>
                  <div className="kv-row"><span>Route</span><strong>{picked.task_detail?.pickup_address} → {picked.task_detail?.drop_address}</strong></div>
                  <div className="kv-row"><span>{t('cols.crew')}</span><strong>{picked.required_workers}</strong></div>
                  <div className="kv-row"><span>{t('cols.budget')}</span><strong>{rupee(picked.budget_inr)}</strong></div>
                </div>
                <AdminRematchControls
                  bookingKey={slugOf(picked)}
                  defaultSeconds={defaultRingSeconds}
                  onDone={load}
                  onError={setError}
                />
              </div>
              {(picked.vendor_offers || []).length > 0 && (
                <div className="card">
                  <div className="card-kicker">{t('tabs.caterers')}</div>
                  {picked.vendor_offers?.map((offer) => (
                    <div className="worker-row" key={offer.id}>
                      <div>
                        <strong>{offer.company || t('nav.caterer')}</strong>
                        <div className="meta"><StatusBadge value={offer.status} /><span>{offer.phone}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card"><p>Select a task from the table.</p></div>
          )}
        </div>
      </div>
    </div>
  )
}
