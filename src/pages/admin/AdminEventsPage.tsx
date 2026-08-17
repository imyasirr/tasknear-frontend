import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { AdminRematchControls } from '../../components/AdminRematchControls'
import { slugOf } from '../../lib/paths'
import { useAdminRingSeconds } from '../../hooks/useAdminRingSeconds'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'
import { AdminAlert, AdminDetailCard, AdminDetailStack, AdminPage, AdminTab, AdminTableCard, AdminTabs, AdminWorkspace } from './admin-ui'

type Shift = {
  id: number
  headcount: number
  category?: { name: string }
}
type Booking = {
  id: number
  slug?: string
  type: string
  status: string
  city: string
  budget_inr: number
  scheduled_start?: string
  requester?: { name: string; phone: string }
  event_detail?: { title: string; venue_name?: string; shifts?: Shift[] }
  payments?: Array<{ status: string; amount_inr: number }>
  vendor_company?: { name?: string; phone?: string; city?: string } | null
  vendor_ring?: { ringing?: boolean; count?: number; accepted?: boolean } | null
  vendor_offers?: Array<{ id: number; status: string; company?: string; phone?: string }>
  vendor_attendance?: { check_in_otp?: string | null; check_out_otp?: string | null; check_in_at?: string | null; check_out_at?: string | null }
}

export function AdminEventsPage() {
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
    const events = all.filter((b) => b.type === 'event')
    setRows(events)
    setPicked((cur) => {
      const fromUrl = events.find((e) => e.slug === slug || String(e.id) === slug)
      return fromUrl || events.find((e) => e.id === cur?.id) || events[0] || null
    })
  }

  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  function select(row: Booking) {
    setPicked(row)
    navigate(`/admin/events/${slugOf(row)}`, { replace: true })
  }

  const list = useMemo(() => rows.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'open') return !['completed', 'settled', 'cancelled'].includes(b.status)
    return b.status === tab
  }), [rows, tab])

  const crew = (event: Booking) => {
    const needed = (event.event_detail?.shifts || []).reduce((s, sh) => s + sh.headcount, 0)
    return { needed, label: String(needed) }
  }

  const eventColumns: Column<Booking>[] = [
    { key: 'event', header: t('cols.event'), sortValue: (e) => e.event_detail?.title || '', csv: (e) => e.event_detail?.title, render: (e) => <><strong>{e.event_detail?.title}</strong><div className="meta"><span>{e.event_detail?.venue_name || 'Venue TBD'}</span></div></> },
    { key: 'client', header: t('cols.client'), sortValue: (e) => e.requester?.name || '', csv: (e) => e.requester?.name, render: (e) => e.requester?.name || '—' },
    { key: 'caterer', header: t('cols.caterer'), sortValue: (e) => e.vendor_company?.name || '', csv: (e) => e.vendor_company?.name || '', render: (e) => e.vendor_company?.name || (e.vendor_ring?.ringing ? `${e.vendor_ring.count || 0}` : '—') },
    { key: 'city', header: t('cols.city'), sortValue: (e) => e.city, csv: (e) => e.city, render: (e) => e.city },
    { key: 'crew', header: t('cols.crew'), sortValue: (e) => crew(e).needed, csv: (e) => crew(e).label, render: (e) => crew(e).label },
    { key: 'budget', header: t('cols.budget'), className: 'num', sortValue: (e) => e.budget_inr, csv: (e) => e.budget_inr, render: (e) => rupee(e.budget_inr) },
    { key: 'status', header: t('cols.status'), sortValue: (e) => e.status, csv: (e) => e.status, render: (e) => <StatusBadge value={e.status} /> },
  ]

  const tabs = [
    ['open', t('tabs.open')],
    ['filling', t('tabs.filling')],
    ['confirmed', t('tabs.confirmed')],
    ['in_progress', t('tabs.live')],
    ['completed', t('tabs.done')],
    ['all', t('tabs.all')],
  ] as const

  if (!ready) return <Loader />

  return (
    <AdminPage>
      <PageHeader title={t('events.title')} subtitle={t('events.subtitle')} />
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
              columns={eventColumns}
              rowKey={(e) => e.id}
              filename="tasknear-events"
              searchPlaceholder={t('events.search')}
              selectedKey={picked?.id}
              onSelect={select}
              empty={t('events.empty')}
            />
          </AdminTableCard>
        )}
        detail={(
          <AdminDetailStack>
            {picked ? (
              <>
                <AdminDetailCard kicker={t('events.selected')} title={picked.event_detail?.title}>
                  <div className="kv">
                    <div className="kv-row"><span>{t('events.client')}</span><strong>{picked.requester?.name}</strong></div>
                    <div className="kv-row"><span>{t('cols.phone')}</span><strong>{picked.requester?.phone || '—'}</strong></div>
                    <div className="kv-row"><span>{t('events.vendor')}</span><strong>{picked.vendor_company?.name || (picked.vendor_ring?.ringing ? t('client.vendorRinging', { n: picked.vendor_ring.count || 0 }) : '—')}</strong></div>
                    <div className="kv-row"><span>{t('events.venue')}</span><strong>{picked.event_detail?.venue_name || 'TBD'}</strong></div>
                    <div className="kv-row"><span>{t('events.budget')}</span><strong>{rupee(picked.budget_inr)}</strong></div>
                    <div className="kv-row"><span>{t('events.payment')}</span><strong><StatusBadge value={picked.payments?.[0]?.status || 'pending'} /></strong></div>
                  </div>
                  <AdminRematchControls
                    bookingKey={slugOf(picked)}
                    defaultSeconds={defaultRingSeconds}
                    onDone={load}
                    onError={setError}
                  />
                </AdminDetailCard>
                {picked.vendor_attendance && (
                  <AdminDetailCard kicker={t('client.venueOtp')}>
                    <div className="kv">
                      <div className="kv-row"><span>{t('job.inOtp')}</span><strong>{picked.vendor_attendance.check_in_at ? t('job.checkedIn') : (picked.vendor_attendance.check_in_otp || '—')}</strong></div>
                      <div className="kv-row"><span>{t('job.outOtp')}</span><strong>{picked.vendor_attendance.check_out_at ? t('job.checkedOut') : (picked.vendor_attendance.check_out_otp || '—')}</strong></div>
                    </div>
                  </AdminDetailCard>
                )}
                {(picked.vendor_offers || []).length > 0 && (
                  <AdminDetailCard kicker={t('tabs.caterers')}>
                    {picked.vendor_offers?.map((offer) => (
                      <div className="worker-row" key={offer.id}>
                        <div>
                          <strong>{offer.company || t('nav.caterer')}</strong>
                          <div className="meta"><StatusBadge value={offer.status} /><span>{offer.phone}</span></div>
                        </div>
                      </div>
                    ))}
                  </AdminDetailCard>
                )}
                {(picked.event_detail?.shifts || []).map((shift) => (
                  <AdminDetailCard key={shift.id} kicker={shift.category?.name} title={`${shift.headcount} ${t('client.headcount').toLowerCase()}`} />
                ))}
              </>
            ) : (
              <AdminDetailCard empty={t('common.selectRow')} />
            )}
          </AdminDetailStack>
        )}
      />
    </AdminPage>
  )
}
