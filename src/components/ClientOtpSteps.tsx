import { useI18n } from '../i18n/LocaleContext'
import { whenTime } from '../ui'

export type ClientOtpAttendance = {
  check_in_otp?: string | null
  check_out_otp?: string | null
  check_in_at?: string | null
  check_out_at?: string | null
  checked_in?: boolean
  checked_out?: boolean
}

function isCheckInDone(attendance: ClientOtpAttendance): boolean {
  return !!attendance.check_in_at || !!attendance.checked_in
}

function isCheckOutDone(attendance: ClientOtpAttendance): boolean {
  return !!attendance.check_out_at || !!attendance.checked_out
}

export function ClientOtpSteps({ attendance }: { attendance: ClientOtpAttendance }) {
  const { t } = useI18n()
  const inDone = isCheckInDone(attendance)
  const outDone = isCheckOutDone(attendance)

  if (outDone) {
    return (
      <div className="otp-steps">
        <div className="otp-step-done">
          {attendance.check_in_at
            ? t('job.checkedInAt', { time: whenTime(attendance.check_in_at) })
            : t('job.checkedIn')}
        </div>
        <div className="otp-step-done">
          {attendance.check_out_at
            ? t('job.checkedOutAt', { time: whenTime(attendance.check_out_at) })
            : t('job.checkedOut')}
        </div>
      </div>
    )
  }

  if (inDone) {
    return (
      <div className="otp-steps">
        <div className="otp-step-done">
          {attendance.check_in_at
            ? t('job.checkedInAt', { time: whenTime(attendance.check_in_at) })
            : t('job.checkedIn')}
        </div>
        <OtpSlot
          label={t('job.outOtp')}
          code={attendance.check_out_otp || undefined}
        />
      </div>
    )
  }

  return (
    <div className="otp-steps">
      <OtpSlot
        label={t('job.inOtp')}
        code={attendance.check_in_otp || undefined}
      />
    </div>
  )
}

function OtpSlot({ label, code }: { label: string; code?: string }) {
  return (
    <div className="otp-slot">
      <div className="card-kicker">{label}</div>
      <div className="otp-hero">{code || '————'}</div>
    </div>
  )
}
