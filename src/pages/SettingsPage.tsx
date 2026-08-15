import { useState } from 'react'
import { api } from '../api/client'
import { useAuth, type User } from '../auth/AuthContext'
import { Avatar } from '../components/Avatar'
import { useI18n } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/messages'
import { PageHeader } from '../ui'

export function SettingsPage() {
  const { user, refresh } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [name, setName] = useState(user?.name || '')
  const [city, setCity] = useState(user?.city || '')
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function saveProfile() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api<User>('/me', { method: 'PUT', body: JSON.stringify({ name, city }) })
      await refresh()
      setMessage(t('settings.saved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settings.saved'))
    } finally {
      setBusy(false)
    }
  }

  async function savePassword() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/me/password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, password, password_confirmation: confirm }),
      })
      setCurrent('')
      setPassword('')
      setConfirm('')
      await refresh()
      setMessage(t('settings.passSaved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settings.passSaved'))
    } finally {
      setBusy(false)
    }
  }

  async function savePhoto(file: File) {
    setBusy(true)
    setError('')
    setMessage('')
    const body = new FormData()
    body.append('avatar', file)
    try {
      await api<User>('/me/avatar', { method: 'POST', body })
      await refresh()
      setMessage(t('settings.photoSaved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('settings.photoSaved'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />
      {error && <p className="err">{error}</p>}
      {message && <div className="alert ok">{message}</div>}
      <div className="split even">
        <div className="card">
          <div className="card-kicker">{t('settings.profile')}</div>
          <div className="photo-row">
            <Avatar name={user?.name} src={user?.avatar_url} size={84} />
            <div>
              <h2>{t('settings.photo')}</h2>
              <p>{t('settings.photoHint')}</p>
              <label className="ghost" style={{ display: 'inline-block', marginTop: 10 }}>
                {t('settings.upload')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void savePhoto(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: 18 }}>
            <div className="field">
              <label>{t('settings.name')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('settings.city')}</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('settings.phone')}</label>
              <input value={user?.phone || ''} disabled />
            </div>
          </div>
          <button disabled={busy} onClick={() => void saveProfile()}>{busy ? t('common.saving') : t('common.save')}</button>
        </div>
        <div className="side-panel">
          <div className="card">
            <div className="card-kicker">{t('settings.language')}</div>
            <p style={{ marginBottom: 14 }}>{t('settings.languageHint')}</p>
            <div className="lang-switch">
              {(['en', 'hi'] as Locale[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={locale === code ? 'on' : ''}
                  onClick={() => void setLocale(code)}
                >
                  {code === 'en' ? t('settings.english') : t('settings.hindi')}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-kicker">{t('settings.password')}</div>
            <p style={{ marginBottom: 14 }}>{user?.password_set ? t('settings.passwordHint') : t('settings.firstPassword')}</p>
            {user?.password_set && (
              <div className="field">
                <label>{t('settings.current')}</label>
                <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label>{t('settings.newPass')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('settings.confirm')}</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button disabled={busy || !password} onClick={() => void savePassword()}>{t('settings.updatePassword')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
