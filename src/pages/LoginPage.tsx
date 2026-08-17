import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/home'
import { useI18n } from '../i18n/LocaleContext'
import { AuthShell } from '../layouts/AuthShell'
import { Loader } from '../ui'

const ACCOUNTS = [
  { phone: '9999999999', name: 'Ops admin', hint: 'Events, users, billing', tag: 'Admin' },
  { phone: '9000000001', name: 'Ayesha Khan', hint: 'Pro plan · events', tag: 'Client' },
  { phone: '9000000002', name: 'Vikram Singh', hint: 'No plan · task', tag: 'Client' },
  { phone: '9222222221', name: 'Royal Kitchen Co', hint: 'On site tonight', tag: 'Caterer' },
  { phone: '9222222222', name: 'Banquet Hands', hint: 'Wedding + fridge ring', tag: 'Caterer' },
  { phone: '9222222223', name: 'Gomti Servers', hint: 'Wedding ring', tag: 'Caterer' },
  { phone: '9222222224', name: 'Aliganj Loaders', hint: 'Fridge task ring', tag: 'Caterer' },
  { phone: '9222222225', name: 'Night Owl Catering', hint: 'Offline', tag: 'Caterer' },
]

export function LoginPage() {
  const { user, loading, requestOtp, login, loginWithPassword } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'otp' | 'password'>('otp')
  const [phone, setPhone] = useState('9999999999')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('password')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [otpReady, setOtpReady] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setOtpReady(false)
    setDevOtp(null)
    setCode('')
  }, [phone, mode])

  if (loading) return <Loader label={t('common.loading')} />
  if (user) return <Navigate to={homeFor(user.roles)} replace />

  async function sendOtp(nextPhone = phone) {
    setError('')
    setBusy(true)
    try {
      const otp = await requestOtp(nextPhone, 'login')
      if (otp) {
        setDevOtp(otp)
        setCode(otp)
      }
      setOtpReady(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.fail'))
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(nextPhone = phone) {
    setError('')
    setBusy(true)
    try {
      const signed = await login(nextPhone, code)
      navigate(homeFor(signed.roles))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.fail'))
    } finally {
      setBusy(false)
    }
  }

  async function quickEnter(nextPhone: string) {
    setPhone(nextPhone)
    setError('')
    setBusy(true)
    try {
      const otp = await requestOtp(nextPhone, 'login')
      const verifyCode = otp || code
      if (otp) {
        setDevOtp(otp)
        setCode(otp)
      }
      setOtpReady(true)
      const signed = await login(nextPhone, verifyCode)
      navigate(homeFor(signed.roles))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.fail'))
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (mode === 'password') {
      setError('')
      setBusy(true)
      try {
        const signed = await loginWithPassword(phone, password)
        navigate(homeFor(signed.roles))
      } catch (e) {
        setError(e instanceof Error ? e.message : t('login.fail'))
      } finally {
        setBusy(false)
      }
      return
    }

    if (!otpReady) {
      await sendOtp()
      return
    }

    await verifyOtp()
  }

  const otpButtonLabel = busy
    ? (otpReady ? t('login.signingIn') : t('login.sendingOtp'))
    : (otpReady ? t('login.continue') : t('login.sendOtp'))

  return (
    <AuthShell>
      <h1>{t('login.title')}</h1>
      <p style={{ margin: '0 0 18px' }}>{mode === 'otp' ? t('login.hint') : t('login.passwordHint')}</p>
      <div className="tabs">
        <button className={mode === 'otp' ? 'on' : ''} onClick={() => setMode('otp')}>{t('login.tabOtp')}</button>
        <button className={mode === 'password' ? 'on' : ''} onClick={() => setMode('password')}>{t('login.tabPassword')}</button>
      </div>
      <div className="card" style={{ marginBottom: 22 }}>
        {devOtp && mode === 'otp' && (
          <div className="alert ok" style={{ marginBottom: 12 }}>
            {t('login.devOtp', { otp: devOtp })}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>{t('login.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {mode === 'otp' ? (
            <div className="field">
              <label>{t('login.otp')}</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={otpReady ? '' : '••••••'} />
            </div>
          ) : (
            <div className="field">
              <label>{t('login.password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
        </div>
        {error && <p className="err">{error}</p>}
        <button className="accent" style={{ marginTop: 8, width: '100%' }} disabled={busy} onClick={() => void submit()}>
          {mode === 'password' ? (busy ? t('login.signingIn') : t('login.continue')) : otpButtonLabel}
        </button>
        <p className="auth-switch">
          {t('login.noAccount')} <Link to="/register">{t('login.goRegister')}</Link>
        </p>
      </div>
      <div className="card-kicker">{t('login.demo')}</div>
      <div className="account-grid">
        {ACCOUNTS.map((a) => (
          <button
            key={a.phone}
            className="account"
            disabled={busy}
            onClick={() => void quickEnter(a.phone)}
          >
            <span>
              <span className="account-role">{a.tag}</span>
              <br />
              {a.name}
              <br />
              <small>{a.hint}</small>
            </span>
            <small>{a.phone}</small>
          </button>
        ))}
      </div>
    </AuthShell>
  )
}
