import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/home'
import { useI18n } from '../i18n/LocaleContext'
import { providerDescription, providerLabel, type ProviderTypeRow } from '../lib/providerTypes'
import { Loader } from '../ui'

type City = { id: number; name: string }

export function RegisterPage() {
  const { user, loading, register } = useAuth()
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [cities, setCities] = useState<City[]>([])
  const [providers, setProviders] = useState<ProviderTypeRow[]>([])
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [role, setRole] = useState<string>('customer')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedProvider = providers.find((p) => p.slug === role)
  const isVendor = selectedProvider?.match_mode === 'vendor'

  useEffect(() => {
    Promise.all([
      api<City[]>('/cities'),
      api<ProviderTypeRow[]>('/provider-types'),
    ]).then(([cityRows, providerRows]) => {
      setCities(cityRows)
      setProviders(providerRows.filter((p) => p.active))
      if (cityRows[0] && !cityRows.some((c) => c.name === city)) setCity(cityRows[0].name)
    }).catch(() => undefined)
  }, [])

  if (loading) return <Loader label={t('common.loading')} />
  if (user) return <Navigate to={homeFor(user.roles)} replace />

  async function submit() {
    setError('')
    setBusy(true)
    try {
      const signed = await register({
        phone,
        name,
        role: role as 'customer' | 'caterer' | 'worker' | 'agency' | 'driver' | 'home_pro',
        city,
        password,
        company_name: isVendor ? (company || name) : undefined,
      })
      navigate(homeFor(signed.roles))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('register.fail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
        <header className="auth-header">
          <h1>{t('register.title')}</h1>
          <p>{t('register.hintProviders')}</p>
        </header>

        <div className="auth-card card">
          <div className="card-kicker">{t('register.pickType')}</div>
          <div className="auth-type-grid">
            <button
              type="button"
              className={`auth-type-card${role === 'customer' ? ' on' : ''}`}
              onClick={() => setRole('customer')}
            >
              <strong>{t('login.client')}</strong>
              <span>{t('register.clientHint')}</span>
            </button>
            {providers.map((p) => (
              <button
                key={p.slug}
                type="button"
                className={`auth-type-card${role === p.slug ? ' on' : ''}`}
                onClick={() => setRole(p.slug)}
              >
                <strong>{providerLabel(p, locale)}</strong>
                <span>{providerDescription(p, locale)}</span>
              </button>
            ))}
          </div>

          <div className="form-grid">
            <div className="field">
              <label>{isVendor ? t('register.contactName') : t('login.name')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {isVendor && (
              <div className="field">
                <label>{t('caterer.company')}</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label>{t('login.phone')}</label>
              <div className="phone-field">
                <span className="phone-prefix" aria-hidden>+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>
            <div className="field">
              <label>{t('settings.city')}</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                {(cities.length ? cities : [{ id: 0, name: 'Lucknow' }]).map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('register.passwordHint')}
              />
            </div>
          </div>

          {error && <p className="err auth-error">{error}</p>}

          <button
            className="accent auth-submit"
            disabled={busy || !name || phone.length < 10 || password.length < 6}
            onClick={() => void submit()}
          >
            {busy ? t('register.creating') : t('register.submit')}
          </button>
        </div>
    </div>
  )
}
