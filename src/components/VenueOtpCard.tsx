import { useI18n } from '../i18n/LocaleContext'
import { whenTime } from '../ui'

export type VenueAttendance = {
  check_in_otp?: string | null
  check_out_otp?: string | null
  check_in_at?: string | null
  check_out_at?: string | null
  checked_in?: boolean
  checked_out?: boolean
}

export function VenueOtpCard({ attendance }: { attendance?: VenueAttendance | null }) {
  const { t } = useI18n()
  if (!attendance) return null

  const inDone = !!attendance.check_in_at || !!attendance.checked_in
  const outDone = !!attendance.check_out_at || !!attendance.checked_out

  return (
    <div className="card job-action">
      <div className="card-kicker">{t('client.venueOtp')}</div>
      <p style={{ margin: '6px 0 14px' }}>{t('client.venueOtpHint')}</p>
      <div className="otp-grid">
        <OtpSlot
          label={t('job.inOtp')}
          code={attendance.check_in_otp || undefined}
          done={inDone}
          doneLabel={attendance.check_in_at ? t('job.checkedInAt', { time: whenTime(attendance.check_in_at) }) : t('job.checkedIn')}
        />
        <OtpSlot
          label={t('job.outOtp')}
          code={attendance.check_out_otp || undefined}
          done={outDone}
          doneLabel={attendance.check_out_at ? t('job.checkedOutAt', { time: whenTime(attendance.check_out_at) }) : t('job.checkedOut')}
        />
      </div>
    </div>
  )
}

function OtpSlot({
  label,
  code,
  done,
  doneLabel,
}: {
  label: string
  code?: string
  done: boolean
  doneLabel: string
}) {
  return (
    <div className={`otp-slot ${done ? 'done' : ''}`}>
      <div className="card-kicker">{label}</div>
      {done ? <div className="otp-done">{doneLabel}</div> : <div className="otp-hero">{code || '————'}</div>}
    </div>
  )
}
