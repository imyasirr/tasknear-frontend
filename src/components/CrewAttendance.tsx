import { useI18n } from '../i18n/LocaleContext'
import { StatusBadge, whenTime } from '../ui'

export type CrewRow = {
  id: number
  status: string
  worker?: { name?: string; phone?: string } | null
  attendance?: {
    check_in_otp?: string
    check_out_otp?: string
    check_in_at?: string | null
    check_out_at?: string | null
  } | null
}

export function CrewAttendance({ crew, invited }: { crew: CrewRow; invited?: boolean }) {
  const { t } = useI18n()
  if (invited || crew.status === 'invited') {
    return (
      <div className="crew-card">
        <div>
          <strong>{t('client.nearbyWorker')}</strong>
          <div className="meta"><StatusBadge value="invited" /><span>{t('client.waitingAccept')}</span></div>
        </div>
      </div>
    )
  }

  const inAt = crew.attendance?.check_in_at
  const outAt = crew.attendance?.check_out_at
  const inOtp = crew.attendance?.check_in_otp
  const outOtp = crew.attendance?.check_out_otp

  return (
    <div className="crew-card">
      <div className="crew-head">
        <div>
          <strong>{crew.worker?.name || t('client.nearbyWorker')}</strong>
          {crew.worker?.phone && (
            <div className="meta"><a href={`tel:${crew.worker.phone}`}>{crew.worker.phone}</a></div>
          )}
        </div>
        <StatusBadge value={crew.status} />
      </div>
      <div className="otp-grid">
        <OtpSlot
          label={t('job.inOtp')}
          code={inOtp}
          done={!!inAt || crew.status === 'checked_in' || crew.status === 'checked_out'}
          doneLabel={inAt ? t('job.checkedInAt', { time: whenTime(inAt) }) : t('job.checkedIn')}
        />
        <OtpSlot
          label={t('job.outOtp')}
          code={outOtp}
          done={!!outAt || crew.status === 'checked_out'}
          doneLabel={outAt ? t('job.checkedOutAt', { time: whenTime(outAt) }) : t('job.checkedOut')}
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
