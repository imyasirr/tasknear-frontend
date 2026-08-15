import type { ReactNode } from 'react'
import { useI18n } from '../i18n/LocaleContext'
import { rupee } from '../ui'

export function JobLayout({
  header,
  action,
  main,
  side,
}: {
  header: ReactNode
  action?: ReactNode
  main?: ReactNode
  side: ReactNode
}) {
  return (
    <div className="page job-page">
      {header}
      <div className="job-layout">
        <div className="job-main">
          {action}
          {main}
        </div>
        <aside className="job-side">{side}</aside>
      </div>
    </div>
  )
}

export function RolePackage({
  shifts,
  headcount,
  waiting,
}: {
  shifts?: Array<{ id?: number; headcount?: number; rate_per_worker_inr?: number; category?: { name?: string } }>
  headcount?: number
  waiting?: boolean
}) {
  const { t } = useI18n()
  const rows = shifts?.length
    ? shifts
    : [{ id: 0, headcount: headcount || 1, category: { name: t('client.crew') } }]

  return (
    <div className="card">
      <div className="card-kicker">{t('caterer.roles')}</div>
      <div className="role-list">
        {rows.map((shift, i) => (
          <div className="role-row" key={shift.id ?? i}>
            <div>
              <strong>{shift.category?.name || t('client.crew')}</strong>
              <div className="meta"><span>{shift.headcount || 1} {t('client.headcount').toLowerCase()}</span></div>
            </div>
            {shift.rate_per_worker_inr ? <strong>{rupee(shift.rate_per_worker_inr)}</strong> : null}
          </div>
        ))}
      </div>
      {waiting && <p className="empty" style={{ padding: '16px 0 0' }}>{t('client.waitingAccept')}</p>}
    </div>
  )
}

export function PayCard({
  labor,
  fee,
  total,
  waived,
  note,
}: {
  labor: number
  fee?: number
  total: number
  waived?: boolean
  note?: string
}) {
  const { t } = useI18n()
  return (
    <div className="card">
      <div className="card-kicker">{t('pay.breakdown')}</div>
      <div className="kv">
        <div className="kv-row"><span>{t('pay.crew')}</span><strong>{rupee(labor)}</strong></div>
        <div className="kv-row">
          <span>{waived ? t('pay.feeWaived') : t('pay.fee', { pct: '—' })}</span>
          <strong>{waived ? t('pay.free') : rupee(fee)}</strong>
        </div>
        <div className="kv-row"><span>{t('pay.youPay')}</span><strong>{rupee(total)}</strong></div>
      </div>
      {note && <p className="meta" style={{ marginTop: 10 }}>{note}</p>}
    </div>
  )
}
