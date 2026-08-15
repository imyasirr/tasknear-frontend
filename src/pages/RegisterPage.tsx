import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/home'
import { useI18n } from '../i18n/LocaleContext'
import { AuthShell } from '../layouts/AuthShell'
import { Loader } from '../ui'

type City = { id: number; name: string }

export function RegisterPage() {
  const { user, loading, register } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [cities, setCities] = useState<City[]>([])
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Lucknow')
  const [role, setRole] = useState<'customer' | 'caterer'>('customer')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<City[]>('/cities').then((rows) => {
      setCities(rows)
      if (rows[0] && !rows.some((c) => c.name === city)) setCity(rows[0].name)
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
        role,
        city,
        password,
        company_name: role === 'caterer' ? (company || name) : undefined,
      })
      navigate(homeFor(signed.roles))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('register.fail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1>{t('register.title')}</h1>
      <p style={{ margin: '0 0 18px' }}>{t('register.hint')}</p>
      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>{t('register.role')}</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'customer' | 'caterer')}>
              <option value="customer">{t('login.client')}</option>
              <option value="caterer">{t('login.caterer')}</option>
            </select>
          </div>
          <div className="field">
            <label>{role === 'caterer' ? t('register.contactName') : t('login.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {role === 'caterer' && (
            <div className="field">
              <label>{t('caterer.company')}</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>{t('login.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))} />
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('register.passwordHint')} />
          </div>
        </div>
        {error && <p className="err">{error}</p>}
        <button
          className="accent"
          style={{ marginTop: 8, width: '100%' }}
          disabled={busy || !name || phone.length < 10 || password.length < 6}
          onClick={() => void submit()}
        >
          {busy ? t('register.creating') : t('register.submit')}
        </button>
        <p className="auth-switch">
          {t('register.haveAccount')} <Link to="/login">{t('register.goLogin')}</Link>
        </p>
      </div>
    </AuthShell>
  )
}
