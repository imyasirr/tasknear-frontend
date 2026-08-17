import { useI18n } from '../i18n/LocaleContext'
import { ClientOtpSteps, type ClientOtpAttendance } from './ClientOtpSteps'
import { StatusBadge } from '../ui'

export type CrewRow = {
  id: number
  status: string
  worker?: { name?: string; phone?: string } | null
  attendance?: ClientOtpAttendance | null
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

  if (!crew.attendance) return null

  const attendance: ClientOtpAttendance = {
    ...crew.attendance,
    checked_in: !!crew.attendance.check_in_at || crew.status === 'checked_in' || crew.status === 'checked_out',
    checked_out: !!crew.attendance.check_out_at || crew.status === 'checked_out',
  }

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
      <ClientOtpSteps attendance={attendance} />
    </div>
  )
}
