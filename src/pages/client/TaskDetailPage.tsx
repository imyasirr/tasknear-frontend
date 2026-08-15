import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { JobFacts } from '../../components/JobFacts'
import { ClientRepostCard } from '../../components/ClientRepostCard'
import { JobLayout, PayCard, RolePackage } from '../../components/JobLayout'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { VenueOtpCard, type VenueAttendance } from '../../components/VenueOtpCard'
import { VendorStatus, type VendorCompany, type VendorRing } from '../../components/VendorStatus'
import { LiveMark, Loader, PageHeader, StatusBadge, rupee } from '../../ui'

type Task = {
  id: number
  status: string
  city: string
  address?: string
  notes?: string
  budget_inr: number
  required_workers?: number
  scheduled_start?: string
  scheduled_end?: string
  task_detail?: {
    title: string
    description?: string
    pickup_address?: string
    drop_address?: string
    duration_minutes?: number
    rate_per_worker_inr?: number
  }
  payments?: Array<{ id: number; amount_inr: number; labor_inr?: number; commission_inr?: number; fee_waived?: boolean; status: string }>
  vendor_company?: VendorCompany
  vendor_ring?: VendorRing
  vendor_attendance?: VenueAttendance | null
}

export function TaskDetailPage() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [task, setTask] = useState<Task | null>(null)
  const [error, setError] = useState('')

  async function load() {
    if (!slug) return
    try {
      setTask(await api<Task>(`/tasks/${slug}`))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }
  const ready = useLivePoll(load, 2000, [slug])

  if (!ready) return <Loader label={t('common.loading')} />
  if (!task) return <p className="err">{error || t('common.empty')}</p>
  const payment = task.payments?.[0]
  const ringing = task.status === 'matching' || task.status === 'filling'
  const live = ['matching', 'filling', 'confirmed', 'in_progress'].includes(task.status)
  const showOtp = ['confirmed', 'in_progress', 'completed'].includes(task.status)

  return (
    <JobLayout
      header={
        <PageHeader
          title={task.task_detail?.title || 'Task'}
          subtitle={`${task.city}${task.task_detail?.pickup_address ? ` · ${task.task_detail.pickup_address}` : ''} · ${rupee(task.budget_inr)}`}
          actions={<>{live && <LiveMark label={t('job.live')} />}<StatusBadge value={task.status} /></>}
        />
      }
      action={
        <>
          {payment && payment.status !== 'paid' && (
            <div className="alert warn">
              {t('client.payToRing', { amount: rupee(payment.amount_inr) })}
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="accent" onClick={async () => { await api(`/payments/${payment.id}/dev-pay`, { method: 'POST' }); await load() }}>Mark paid</button>
              </div>
            </div>
          )}
          {payment && payment.status === 'paid' && ringing && (
            <div className="alert warn">{t('client.paidRing', { amount: rupee(payment.amount_inr) })}</div>
          )}
          {payment && payment.status === 'paid' && task.status === 'confirmed' && (
            <div className="alert ok">{t('client.shareOtp', { amount: rupee(payment.amount_inr) })}</div>
          )}
          {task.status === 'in_progress' && <div className="alert ok">{t('client.workerOnSite')}</div>}
          {task.status === 'completed' && <div className="alert ok">{t('client.allDone', { n: task.required_workers || 1 })}</div>}
          {task.status === 'unmatched' && payment?.status === 'paid' && slug && (
            <ClientRepostCard
              kind="tasks"
              slug={slug}
              scheduledStart={task.scheduled_start}
              scheduledEnd={task.scheduled_end}
              onDone={load}
              onError={setError}
            />
          )}
          {showOtp && <VenueOtpCard attendance={task.vendor_attendance} />}
          {error && <p className="err">{error}</p>}
        </>
      }
      main={
        <RolePackage
          headcount={task.required_workers}
          shifts={task.task_detail ? [{ headcount: task.required_workers, rate_per_worker_inr: task.task_detail.rate_per_worker_inr, category: { name: t('client.crew') } }] : undefined}
          waiting={!task.vendor_company && ringing}
        />
      }
      side={
        <>
          <VendorStatus company={task.vendor_company} ring={task.vendor_ring} />
          {payment && (
            <PayCard
              labor={payment.labor_inr || task.budget_inr}
              fee={payment.commission_inr}
              total={payment.amount_inr}
              waived={payment.fee_waived}
              note={payment.status === 'paid' ? t('client.settleT1') : undefined}
            />
          )}
          <div className="card">
            <div className="card-kicker">{t('job.details')}</div>
            <JobFacts job={task} rate={task.task_detail?.rate_per_worker_inr} />
          </div>
        </>
      }
    />
  )
}
