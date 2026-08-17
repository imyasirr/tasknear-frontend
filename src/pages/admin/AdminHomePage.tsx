import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminBookingPath } from '../../lib/paths'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, type Column } from '../../ui'
import { AdminAlert, AdminPage, AdminStatLink, AdminTableCard } from './admin-ui'

type Booking = {
  id: number
  slug?: string
  type: string
  status: string
  city: string
  budget_inr: number
  requester?: { name: string }
  event_detail?: { title: string }
  task_detail?: { title: string }
  vendor_company?: { name?: string } | null
  vendor_ring?: { ringing?: boolean; count?: number } | null
}
type Dash = {
  clients: number
  caterers_active: number
  workers_active: number
  categories: number
  provider_types: number
  events_open: number
  tasks_open: number
  payments_pending: number
  reports_open: number
  recent_bookings: Booking[]
}

export function AdminHomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [dash, setDash] = useState<Dash | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Dash>('/admin/dashboard').then(setDash).catch((e) => setError(e.message))
  }, [])

  if (!dash && !error) return <Loader label={t('common.loading')} />
  if (error && !dash) return <AdminPage><AdminAlert message={error} /></AdminPage>
  if (!dash) return <Loader label={t('common.loading')} />

  const cards = [
    [t('desk.clients'), dash.clients, '/admin/users'],
    [t('desk.caterers'), dash.caterers_active, '/admin/users'],
    [t('desk.workers'), dash.workers_active, '/admin/kyc'],
    [t('desk.providers'), dash.provider_types, '/admin/catalog'],
    [t('desk.skills'), dash.categories, '/admin/catalog'],
    [t('desk.events'), dash.events_open, '/admin/events'],
    [t('desk.tasks'), dash.tasks_open, '/admin/tasks'],
    [t('desk.unpaid'), dash.payments_pending, '/admin/events'],
    [t('desk.reports'), dash.reports_open, '/admin/reports'],
  ] as const

  const bookingCols: Column<Booking>[] = [
    { key: 'title', header: t('cols.booking'), sortValue: (b) => b.event_detail?.title || b.task_detail?.title || '', csv: (b) => b.event_detail?.title || b.task_detail?.title || `${b.type} #${b.id}`, render: (b) => <strong>{b.event_detail?.title || b.task_detail?.title || `${b.type} #${b.id}`}</strong> },
    { key: 'type', header: t('cols.type'), sortValue: (b) => b.type, csv: (b) => b.type, render: (b) => b.type },
    { key: 'client', header: t('cols.client'), sortValue: (b) => b.requester?.name || '', csv: (b) => b.requester?.name, render: (b) => b.requester?.name || '—' },
    { key: 'caterer', header: t('cols.caterer'), sortValue: (b) => b.vendor_company?.name || '', csv: (b) => b.vendor_company?.name || (b.vendor_ring?.ringing ? `${b.vendor_ring.count || 0}` : ''), render: (b) => b.vendor_company?.name || (b.vendor_ring?.ringing ? t('client.vendorRinging', { n: b.vendor_ring.count || 0 }) : '—') },
    { key: 'city', header: t('cols.city'), sortValue: (b) => b.city, csv: (b) => b.city, render: (b) => b.city },
    { key: 'budget', header: t('cols.budget'), className: 'num', sortValue: (b) => b.budget_inr, csv: (b) => b.budget_inr, render: (b) => rupee(b.budget_inr) },
    { key: 'status', header: t('cols.status'), sortValue: (b) => b.status, csv: (b) => b.status, render: (b) => <StatusBadge value={b.status} /> },
  ]

  return (
    <AdminPage>
      <PageHeader title={t('desk.title')} subtitle={t('desk.subtitle')} />
      <AdminAlert message={error} />
      <div className="admin-desk-stats">
        {cards.map(([label, value, to]) => (
          <AdminStatLink key={label} label={label} value={value} to={to} />
        ))}
      </div>
      <AdminTableCard title={t('desk.recent')}>
        <DataTable
          rows={dash.recent_bookings}
          columns={bookingCols}
          rowKey={(b) => b.id}
          filename="tasknear-recent-bookings"
          searchPlaceholder={t('desk.searchBookings')}
          pageSize={8}
          empty={t('desk.noBookings')}
          onSelect={(row) => navigate(adminBookingPath(row))}
        />
      </AdminTableCard>
    </AdminPage>
  )
}
