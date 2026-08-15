import { useState } from 'react'
import { useI18n } from '../i18n/LocaleContext'

export function VenueOtpPad({
  mode,
  busy,
  onSubmit,
}: {
  mode: 'in' | 'out'
  busy?: boolean
  onSubmit: (otp: string) => Promise<void>
}) {
  const { t } = useI18n()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="card job-action">
      <div className="card-kicker">{mode === 'in' ? t('job.inOtp') : t('job.outOtp')}</div>
      <p style={{ margin: '4px 0 14px' }}>
        {mode === 'in' ? t('caterer.askInOtp') : t('caterer.askOutOtp')}
      </p>
      <div className="otp-pad">
        <input
          inputMode="numeric"
          maxLength={4}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          aria-label={t('login.otp')}
        />
      </div>
      {error && <p className="err">{error}</p>}
      <button
        className="accent"
        style={{ marginTop: 14, width: '100%' }}
        disabled={busy || otp.length !== 4}
        onClick={async () => {
          setError('')
          try {
            await onSubmit(otp)
            setOtp('')
          } catch (e) {
            setError(e instanceof Error ? e.message : t('caterer.otpFail'))
          }
        }}
      >
        {mode === 'in' ? t('caterer.checkIn') : t('caterer.checkOut')}
      </button>
    </div>
  )
}
