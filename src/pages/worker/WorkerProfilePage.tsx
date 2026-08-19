import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/LocaleContext'
import { KycUpload } from '../../components/KycUpload'
import { categoryLabel, type CategoryRow } from '../../lib/categories'
import { Loader, PageHeader, StatusBadge } from '../../ui'

type City = { id: number; name: string }
type WorkerDoc = { id: number; type: 'aadhaar' | 'pan' | 'selfie' | 'bank'; status: string; review_note?: string | null }

export function WorkerProfilePage() {
  const { t, locale } = useI18n()
  const { refresh } = useAuth()
  const [cities, setCities] = useState<City[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [documents, setDocuments] = useState<WorkerDoc[]>([])
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [upi, setUpi] = useState('')
  const [pan, setPan] = useState('')
  const [aadhaar, setAadhaar] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [status, setStatus] = useState('pending_kyc')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  async function loadProfile() {
    const profile = await api<{
      bio?: string
      city?: string
      upi_vpa?: string
      pan_number?: string
      aadhaar_number?: string
      status?: string
      skills?: Array<{ category_id: number }>
      documents?: WorkerDoc[]
    } | null>('/worker/profile')
    if (!profile) return
    setStatus(profile.status || 'pending_kyc')
    setBio(profile.bio || '')
    setCity(profile.city || 'Lucknow')
    setUpi(profile.upi_vpa || '')
    setPan(profile.pan_number || '')
    setAadhaar(profile.aadhaar_number || '')
    setSelected((profile.skills || []).map((s) => s.category_id))
    setDocuments(profile.documents || [])
  }

  useEffect(() => {
    Promise.all([
      api<City[]>('/cities'),
      api<CategoryRow[]>('/categories'),
      loadProfile(),
    ]).then(([cityRows, cats]) => {
      setCities(cityRows)
      setCategories(cats)
    }).catch((e) => setError(e.message)).finally(() => setReady(true))
  }, [])

  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/worker/profile', {
        method: 'POST',
        body: JSON.stringify({
          bio,
          city,
          upi_vpa: upi,
          pan_number: pan || null,
          aadhaar_number: aadhaar || null,
        }),
      })
      if (selected.length) {
        await api('/worker/skills', { method: 'POST', body: JSON.stringify({ category_ids: selected }) })
      }
      await refresh()
      await loadProfile()
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
      <PageHeader title={t('worker.kycTitle')} subtitle={t('worker.kycSub')} actions={<StatusBadge value={status} />} />
      {error && <p className="err">{error}</p>}
      {message && <div className="alert ok">{message}</div>}

      <div className="card">
        <div className="card-kicker">{t('worker.identity')}</div>
        <div className="form-grid">
          <div className="field">
            <label>{t('settings.city')}</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>{t('worker.upi')}</label>
            <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@upi" />
          </div>
          <div className="field">
            <label>{t('worker.pan')}</label>
            <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} />
          </div>
          <div className="field">
            <label>{t('worker.aadhaar')}</label>
            <input value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" />
          </div>
          <div className="field span-2">
            <label>{t('table.about')}</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <KycUpload documents={documents} onUploaded={() => void loadProfile()} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-kicker">{t('worker.skills')}</div>
        <div className="grid two pick-grid">
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
        <button disabled={busy} className="accent" style={{ marginTop: 16 }} onClick={() => void save()}>
          {busy ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )
}
