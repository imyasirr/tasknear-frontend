import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge } from '../../ui'

type Category = { id: number; name: string; name_hi: string }
type City = { id: number; name: string }
type Profile = {
  status?: string
  company_name?: string
  bio?: string
  city?: string
  gstin?: string
  upi_vpa?: string
  skills?: Array<{ category_id: number }>
}

export function CatererProfilePage() {
  const { t } = useI18n()
  const { refresh } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [gstin, setGstin] = useState('')
  const [upi, setUpi] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [status, setStatus] = useState('active')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      api<City[]>('/cities'),
      api<Category[]>('/categories'),
      api<Profile | null>('/caterer/profile'),
    ]).then(([cityRows, cats, profile]) => {
      setCities(cityRows)
      setCategories(cats)
      if (!profile) return
      setStatus(profile.status || 'active')
      setCompany(profile.company_name || '')
      setBio(profile.bio || '')
      setCity(profile.city || cityRows[0]?.name || 'Lucknow')
      setGstin(profile.gstin || '')
      setUpi(profile.upi_vpa || '')
      setSelected((profile.skills || []).map((s) => s.category_id))
    }).catch((e) => setError(e.message)).finally(() => setReady(true))
  }, [])

  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/caterer/profile', {
        method: 'POST',
        body: JSON.stringify({ company_name: company, bio, city, gstin, upi_vpa: upi }),
      })
      if (selected.length) {
        await api('/caterer/skills', { method: 'POST', body: JSON.stringify({ category_ids: selected }) })
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
      <PageHeader title={t('caterer.profileTitle')} subtitle={t('caterer.profileSub')} actions={<StatusBadge value={status} />} />
      {error && <p className="err">{error}</p>}
      {message && <div className="alert ok">{message}</div>}
      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>{t('caterer.company')}</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('settings.city')}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('caterer.gstin')}</label>
            <input value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('caterer.upi')}</label>
            <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="company@okaxis" />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>{t('caterer.bio')}</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="card-kicker" style={{ marginTop: 18 }}>{t('caterer.roles')}</div>
        <div className="btn-row" style={{ flexWrap: 'wrap', marginTop: 8 }}>
          {categories.map((cat) => {
            const on = selected.includes(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                className={on ? 'accent' : 'ghost'}
                onClick={() => setSelected((cur) => on ? cur.filter((id) => id !== cat.id) : [...cur, cat.id])}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <button className="accent" disabled={busy || !company} onClick={() => void save()}>
            {busy ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
