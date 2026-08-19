import { useState } from 'react'
import { api } from '../../api/client'
import { PayButton } from '../../payments'
import { useAuth } from '../../auth/AuthContext'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge, rupee, when } from '../../ui'

type Feature = { id: number; slug: string; name: string; name_hi?: string; description?: string }
type Plan = {
  id: number
  name: string
  name_hi?: string
  tagline?: string
  price_inr: number
  duration_days: number
  features?: Feature[]
}
type Sub = {
  id: number
  status: string
  starts_at?: string
  ends_at?: string
  amount_inr: number
  plan?: Plan
}

export function PlansPage() {
  const { t, locale } = useI18n()
  const { refresh } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [active, setActive] = useState<Sub | null>(null)
  const [history, setHistory] = useState<Sub[]>([])
  const [error, setError] = useState('')

  async function load() {
    const [list, mine] = await Promise.all([
      api<Plan[]>('/subscription-plans'),
      api<{ active: Sub | null; history: Sub[] }>('/me/subscription'),
    ])
    setPlans(list)
    setActive(mine.active)
    setHistory(mine.history || [])
  }
  const ready = useLivePoll(load, 8000)
  if (!ready) return <Loader label={t('common.loading')} />

  const fname = (f: Feature) => (locale === 'hi' && f.name_hi ? f.name_hi : f.name)
  const pname = (p?: Plan) => (locale === 'hi' && p?.name_hi ? p.name_hi : p?.name) || '—'

  return (
    <div className="page">
      <PageHeader title={t('plans.title')} subtitle={t('plans.subtitle')} />
      {active && (
        <div className="alert ok">
          {t('plans.activeNow', { plan: pname(active.plan), until: when(active.ends_at) })}
        </div>
      )}
      {error && <p className="err">{error}</p>}
      <div className="grid three" style={{ marginBottom: 22 }}>
        {plans.map((plan) => {
          const on = active?.plan?.id === plan.id && active.status === 'active'
          return (
            <div className={`card ${on ? 'plan-on' : ''}`} key={plan.id}>
              <div className="btn-row" style={{ justifyContent: 'space-between' }}>
                <div className="card-kicker">{pname(plan)}</div>
                {on && <StatusBadge value="active" />}
              </div>
              <div className="stat">{rupee(plan.price_inr)}</div>
              <p style={{ margin: '6px 0 12px' }}>{t('plans.forDays', { n: plan.duration_days })}</p>
              <p>{plan.tagline}</p>
              <ul className="plan-features">
                {(plan.features || []).map((f) => (
                  <li key={f.id}>
                    <strong>{fname(f)}</strong>
                    {f.description && <div className="meta"><span>{f.description}</span></div>}
                  </li>
                ))}
              </ul>
              <PayButton
                className="accent"
                label={on ? t('plans.renew') : t('plans.buy')}
                target={{ kind: 'subscription', planId: plan.id, amountInr: plan.price_inr, description: pname(plan) }}
                onSuccess={async () => {
                  setError('')
                  await load()
                  await refresh()
                }}
                onError={(msg) => setError(msg)}
              />
            </div>
          )
        })}
      </div>
      {history.length > 0 && (
        <div className="card">
          <div className="card-kicker">{t('plans.history')}</div>
          {history.map((s) => (
            <div className="worker-row" key={s.id}>
              <div>
                <strong>{pname(s.plan)}</strong>
                <div className="meta"><span>{when(s.starts_at)} → {when(s.ends_at)}</span></div>
              </div>
              <StatusBadge value={s.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
