import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader, StatusBadge } from '../../ui'

type Profile = { company_name?: string; bio?: string; city?: string; gstin?: string; upi_vpa?: string; status?: string }

export function VenuePartnerProfilePage() {
  const { t } = useI18n()
  const { refresh } = useAuth()
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [gstin, setGstin] = useState('')
  const [upi, setUpi] = useState('')
  const [status, setStatus] = useState('active')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api<Profile | null>('/venue-partner/profile').then((p) => {
      if (!p) return
      setCompany(p.company_name || '')
      setBio(p.bio || '')
      setCity(p.city || '')
      setGstin(p.gstin || '')
      setUpi(p.upi_vpa || '')
      setStatus(p.status || 'active')
    }).finally(() => setReady(true))
  }, [])

  if (!ready) return <Loader label={t('common.loading')} />

  return (
    <div className="page">
      <PageHeader title={t('venue.profileTitle')} subtitle={t('venue.profileSub')} actions={<StatusBadge value={status} />} />
      <div className="card form-grid">
        <div className="field"><label>{t('caterer.company')}</label><input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        <div className="field"><label>{t('settings.city')}</label><input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <div className="field"><label>GSTIN</label><input value={gstin} onChange={(e) => setGstin(e.target.value)} /></div>
        <div className="field"><label>UPI</label><input value={upi} onChange={(e) => setUpi(e.target.value)} /></div>
        <div className="field"><label>{t('venue.bio')}</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      </div>
      {error && <p className="err">{error}</p>}
      {msg && <p className="alert ok">{msg}</p>}
      <button
        className="accent"
        onClick={async () => {
          setError('')
          try {
            await api('/venue-partner/profile', {
              method: 'POST',
              body: JSON.stringify({ company_name: company, bio, city, gstin, upi_vpa: upi }),
            })
            await refresh()
            setMsg(t('settings.saved'))
          } catch (e) {
            setError(e instanceof Error ? e.message : t('common.error'))
          }
        }}
      >
        {t('common.save')}
      </button>
    </div>
  )
}
