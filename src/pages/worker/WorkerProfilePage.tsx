import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/LocaleContext'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { Loader, PageHeader, StatusBadge } from '../../ui'

type City = { id: number; name: string }

export function WorkerProfilePage() {
  const { t, locale } = useI18n()
  const { refresh } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [upi, setUpi] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [status, setStatus] = useState('pending_kyc')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      api<City[]>('/cities'),
      api<CategoryRow[]>('/categories'),
      api<{ bio?: string; city?: string; upi_vpa?: string; status?: string; skills?: Array<{ category_id: number }> } | null>('/worker/profile'),
    ]).then(([cityRows, cats, profile]) => {
      setCities(cityRows)
      setCategories(cats)
      if (!profile) return
      setStatus(profile.status || 'pending_kyc')
      setBio(profile.bio || '')
      setCity(profile.city || cityRows[0]?.name || 'Lucknow')
      setUpi(profile.upi_vpa || '')
      setSelected((profile.skills || []).map((s) => s.category_id))
    }).catch((e) => setError(e.message)).finally(() => setReady(true))
  }, [])

  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/worker/profile', {
        method: 'POST',
        body: JSON.stringify({ bio, city, upi_vpa: upi }),
      })
      if (selected.length) {
        await api('/worker/skills', { method: 'POST', body: JSON.stringify({ category_ids: selected }) })
      }
      await refresh()
      setMessage(t('settings.saved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settings.saved'))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page">
      <PageHeader title={t('worker.updateKyc')} subtitle={t('worker.kycNote')} actions={<StatusBadge value={status} />} />
      {error && <p className="err">{error}</p>}
      {message && <div className="alert ok">{message}</div>}
      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>{t('settings.city')}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('table.upi')}</label>
            <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@upi" />
          </div>
          <div className="field">
            <label>{t('table.about')}</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="card-kicker" style={{ marginTop: 16 }}>{t('table.skills')}</div>
        <div className="grid two" style={{ marginTop: 10 }}>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`card pick-card${selected.includes(c.id) ? ' on' : ''}`}
              onClick={() => setSelected((prev) => prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id])}
            >
              <strong>{categoryLabel(c, locale)}</strong>
            </button>
          ))}
        </div>
        <button disabled={busy} style={{ marginTop: 16 }} onClick={() => void save()}>
          {busy ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )
}
