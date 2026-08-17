import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/home'
import { useI18n } from '../i18n/LocaleContext'
import { Loader } from '../ui'

type DemoAccount = {
  phone: string
  name: string
  hint: string
  tag: 'Admin' | 'Client' | 'Caterer' | 'Agency' | 'Worker' | 'Driver' | 'Home pro'
}

const ACCOUNTS: DemoAccount[] = [
  { phone: '9999999999', name: 'Ops admin', hint: 'Events, users, billing', tag: 'Admin' },
  { phone: '9000000001', name: 'Ayesha Khan', hint: 'Pro plan · events', tag: 'Client' },
  { phone: '9000000002', name: 'Vikram Singh', hint: 'No plan · task', tag: 'Client' },
  { phone: '9222222221', name: 'Royal Kitchen Co', hint: 'On site tonight', tag: 'Caterer' },
  { phone: '9222222222', name: 'Banquet Hands', hint: 'Wedding + fridge ring', tag: 'Caterer' },
  { phone: '9222222231', name: 'Lucknow Manpower Co', hint: 'Daily-wage teams', tag: 'Agency' },
  { phone: '9111111111', name: 'Rahul Verma', hint: 'Loader · driver', tag: 'Worker' },
  { phone: '9111111114', name: 'Vikash Yadav', hint: 'Tempo runs', tag: 'Driver' },
]

const DEMO_FILTERS = ['All', 'Client', 'Caterer', 'Agency', 'Worker', 'Driver', 'Admin'] as const

function roleClass(tag: DemoAccount['tag']): string {
  return tag.toLowerCase().replace(' ', '-')
}

export function LoginPage() {
  const { user, loading, requestOtp, login, loginWithPassword } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'otp' | 'password'>('otp')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('password')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [otpReady, setOtpReady] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [demoFilter, setDemoFilter] = useState<(typeof DEMO_FILTERS)[number]>('All')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setOtpReady(false)
    setDevOtp(null)
    setCode('')
  }, [phone, mode])

  const filteredAccounts = useMemo(
    () => (demoFilter === 'All' ? ACCOUNTS : ACCOUNTS.filter((a) => a.tag === demoFilter)),
    [demoFilter],
  )

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
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError(t('login.phoneInvalid'))
      return
    }

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
    <div className="auth-page">
        <header className="auth-header">
          <h1>{t('login.welcome')}</h1>
          <p>{t('login.subtitle')}</p>
        </header>

        <div className="auth-mode-tabs" role="tablist" aria-label={t('login.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'otp'}
            className={mode === 'otp' ? 'on' : ''}
            onClick={() => setMode('otp')}
          >
            {t('login.tabOtp')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'password'}
            className={mode === 'password' ? 'on' : ''}
            onClick={() => setMode('password')}
          >
            {t('login.tabPassword')}
          </button>
        </div>

        <div className="auth-card card">
          <p className="auth-card-lead">
            {mode === 'otp' ? t('login.hint') : t('login.passwordHint')}
          </p>

          {devOtp && mode === 'otp' && (
            <div className="auth-dev-otp">
              <span className="auth-dev-label">{t('login.devOtpLabel')}</span>
              <strong className="auth-dev-code">{devOtp}</strong>
              <span className="auth-dev-note">{t('login.devOtpNote')}</span>
            </div>
          )}

          {mode === 'otp' && otpReady && (
            <div className="auth-step-note">{t('login.otpStep')}</div>
          )}

          <div className="auth-fields">
            <div className="field">
              <label htmlFor="login-phone">{t('login.phone')}</label>
              <div className="phone-field">
                <span className="phone-prefix" aria-hidden>+91</span>
                <input
                  id="login-phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9000000001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

            {mode === 'otp' ? (
              <div className="field">
                <label htmlFor="login-otp">{t('login.otp')}</label>
                <input
                  id="login-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="auth-otp-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={otpReady ? '000000' : '••••••'}
                  disabled={!otpReady && !devOtp}
                />
              </div>
            ) : (
              <div className="field">
                <label htmlFor="login-password">{t('login.password')}</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && <p className="err auth-error">{error}</p>}

          <button
            type="button"
            className="accent auth-submit"
            disabled={busy || phone.length < 10 || (mode === 'otp' && otpReady && code.length < 4)}
            onClick={() => void submit()}
          >
            {mode === 'password' ? (busy ? t('login.signingIn') : t('login.continue')) : otpButtonLabel}
          </button>
        </div>

        <section className="auth-demo">
          <button
            type="button"
            className="auth-demo-toggle"
            aria-expanded={demoOpen}
            onClick={() => setDemoOpen((v) => !v)}
          >
            <span>
              <strong>{t('login.demo')}</strong>
              <small>{t('login.demoSub')}</small>
            </span>
            <span className="auth-demo-chevron">{demoOpen ? '▾' : '▸'}</span>
          </button>

          {demoOpen && (
            <div className="auth-demo-body">
              <div className="auth-demo-filters">
                {DEMO_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`auth-demo-filter${demoFilter === filter ? ' on' : ''}`}
                    onClick={() => setDemoFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="demo-list">
                {filteredAccounts.map((a) => (
                  <button
                    key={a.phone}
                    type="button"
                    className="demo-row"
                    disabled={busy}
                    onClick={() => void quickEnter(a.phone)}
                  >
                    <span className={`demo-role demo-role-${roleClass(a.tag)}`}>{a.tag}</span>
                    <span className="demo-row-main">
                      <strong>{a.name}</strong>
                      <small>{a.hint}</small>
                    </span>
                    <span className="demo-phone">{a.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
    </div>
  )
}
