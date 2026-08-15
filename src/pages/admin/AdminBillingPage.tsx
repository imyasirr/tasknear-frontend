import { useState } from 'react'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, rupee, when, type Column } from '../../ui'

type Feature = { id: number; slug: string; name: string; description?: string }
type Plan = {
  id: number
  name: string
  name_hi?: string
  tagline?: string
  price_inr: number
  duration_days: number
  is_active: boolean
  sort: number
  features?: Feature[]
}
type Sub = {
  id: number
  status: string
  amount_inr: number
  starts_at?: string
  ends_at?: string
  user?: { name: string; phone: string }
  plan?: { name: string }
}

const emptyPlan = { name: '', name_hi: '', tagline: '', price_inr: 999, duration_days: 30, is_active: true, feature_ids: [] as number[] }

export function AdminBillingPage() {
  const { t } = useI18n()
  const [bps, setBps] = useState(1500)
  const [features, setFeatures] = useState<Feature[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [subs, setSubs] = useState<Sub[]>([])
  const [form, setForm] = useState(emptyPlan)
  const [editing, setEditing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [billing, planRows, subRows] = await Promise.all([
      api<{ commission_bps: number; features: Feature[] }>('/admin/billing'),
      api<Plan[]>('/admin/subscription-plans'),
      api<Sub[]>('/admin/subscriptions'),
    ])
    setBps(billing.commission_bps)
    setFeatures(billing.features)
    setPlans(planRows)
    setSubs(subRows)
  }
  const ready = useLivePoll(load, 10000)
  if (!ready) return <Loader label={t('common.loading')} />

  const columns: Column<Sub>[] = [
    { key: 'user', header: t('cols.client'), sortValue: (s) => s.user?.name || '', csv: (s) => s.user?.name, render: (s) => <><strong>{s.user?.name}</strong><div className="meta"><span>{s.user?.phone}</span></div></> },
    { key: 'plan', header: t('plans.plan'), sortValue: (s) => s.plan?.name || '', csv: (s) => s.plan?.name, render: (s) => s.plan?.name || '—' },
    { key: 'amount', header: t('cols.amount'), className: 'num', sortValue: (s) => s.amount_inr, csv: (s) => s.amount_inr, render: (s) => rupee(s.amount_inr) },
    { key: 'until', header: t('plans.until'), sortValue: (s) => s.ends_at || '', csv: (s) => s.ends_at, render: (s) => when(s.ends_at) },
    { key: 'status', header: t('cols.status'), sortValue: (s) => s.status, csv: (s) => s.status, render: (s) => <StatusBadge value={s.status} /> },
  ]

  function toggleFeature(id: number) {
    setForm((cur) => ({
      ...cur,
      feature_ids: cur.feature_ids.includes(id) ? cur.feature_ids.filter((x) => x !== id) : [...cur.feature_ids, id],
    }))
  }

  return (
    <div className="page">
      <PageHeader title={t('billing.title')} subtitle={t('billing.subtitle')} />
      {error && <p className="err">{error}</p>}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-kicker">{t('billing.fee')}</div>
        <p style={{ marginBottom: 12 }}>{t('billing.feeHint')}</p>
        <div className="form-grid">
          <div className="field">
            <label>{t('billing.percent')}</label>
            <input type="number" min={0} max={50} step={0.5} value={bps / 100} onChange={(e) => setBps(Math.round(Number(e.target.value) * 100))} />
          </div>
        </div>
        <p>{t('billing.preview', { pct: (bps / 100).toFixed(bps % 100 === 0 ? 0 : 1), fee: rupee(Math.round(900 * bps / 10000)), total: rupee(900 + Math.round(900 * bps / 10000)) })}</p>
        <button style={{ marginTop: 12 }} disabled={busy} onClick={async () => {
          setBusy(true)
          try {
            await api('/admin/billing', { method: 'PUT', body: JSON.stringify({ commission_bps: bps }) })
            await load()
          } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
          finally { setBusy(false) }
        }}>{t('common.save')}</button>
      </div>

      <div className="split even" style={{ marginBottom: 22 }}>
        <div>
          {plans.map((p) => (
            <button type="button" key={p.id} className="card earn-row" onClick={() => {
              setEditing(p.id)
              setForm({
                name: p.name,
                name_hi: p.name_hi || '',
                tagline: p.tagline || '',
                price_inr: p.price_inr,
                duration_days: p.duration_days,
                is_active: p.is_active,
                feature_ids: (p.features || []).map((f) => f.id),
              })
            }}>
              <div className="btn-row" style={{ justifyContent: 'space-between' }}>
                <strong>{p.name}</strong>
                <StatusBadge value={p.is_active ? 'active' : 'pending'} />
              </div>
              <div className="meta">
                <span>{rupee(p.price_inr)}</span>
                <span>{p.duration_days}d</span>
                <span>{(p.features || []).map((f) => f.name).join(' · ')}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="side-panel card">
          <div className="card-kicker">{editing ? t('billing.editPlan') : t('billing.newPlan')}</div>
          <div className="field"><label>{t('billing.planName')}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Hindi</label><input value={form.name_hi} onChange={(e) => setForm({ ...form, name_hi: e.target.value })} /></div>
          <div className="field"><label>{t('billing.tagline')}</label><input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
          <div className="form-grid">
            <div className="field"><label>{t('cols.amount')}</label><input type="number" value={form.price_inr} onChange={(e) => setForm({ ...form, price_inr: Number(e.target.value) })} /></div>
            <div className="field"><label>{t('billing.days')}</label><input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} /></div>
          </div>
          <div className="field">
            <label>{t('billing.features')}</label>
            {features.map((f) => (
              <label key={f.id} className="skill-chip">
                <input type="checkbox" checked={form.feature_ids.includes(f.id)} onChange={() => toggleFeature(f.id)} />
                <span><strong>{f.name}</strong><div className="meta"><span>{f.slug}</span></div></span>
              </label>
            ))}
          </div>
          <div className="btn-row">
            <button disabled={busy || !form.name} onClick={async () => {
              setBusy(true)
              try {
                if (editing) await api(`/admin/subscription-plans/${editing}`, { method: 'PUT', body: JSON.stringify(form) })
                else await api('/admin/subscription-plans', { method: 'POST', body: JSON.stringify(form) })
                setEditing(null)
                setForm(emptyPlan)
                await load()
              } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') }
              finally { setBusy(false) }
            }}>{t('common.save')}</button>
            {editing && <button className="ghost" onClick={() => { setEditing(null); setForm(emptyPlan) }}>{t('common.cancel')}</button>}
          </div>
        </div>
      </div>

      <div className="card flush">
        <DataTable rows={subs} columns={columns} rowKey={(s) => s.id} filename="tasknear-subscriptions" empty={t('billing.noSubs')} searchPlaceholder={t('billing.searchSubs')} />
      </div>
    </div>
  )
}
