import { useI18n } from '../i18n/LocaleContext'
import { ClientOtpSteps, type ClientOtpAttendance } from './ClientOtpSteps'

export type VenueAttendance = ClientOtpAttendance

export function VenueOtpCard({
  attendance,
  hint,
  worker,
}: {
  attendance?: VenueAttendance | null
  hint?: string
  worker?: boolean
}) {
  const { t } = useI18n()
  if (!attendance) return null

  const phaseHint = hint ?? (() => {
    const inDone = !!attendance.check_in_at || !!attendance.checked_in
    const outDone = !!attendance.check_out_at || !!attendance.checked_out
    if (outDone) return t('client.venueOtpAllDone')
    if (inDone) return worker ? t('client.venueOtpHintCheckOutWorker') : t('client.venueOtpHintCheckOut')
    return worker ? t('client.venueOtpHintCheckInWorker') : t('client.venueOtpHintCheckIn')
  })()

  return (
    <div className="card job-action">
      <div className="card-kicker">{t('client.venueOtp')}</div>
      <p style={{ margin: '6px 0 14px' }}>{phaseHint}</p>
      <ClientOtpSteps attendance={attendance} />
    </div>
  )
}
