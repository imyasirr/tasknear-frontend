import { useI18n } from '../i18n/LocaleContext'

export type WorkerRing = {
  ringing?: boolean
  count?: number
  accepted?: number
  needed?: number
} | null

export function WorkerStatus({ ring }: { ring?: WorkerRing }) {
  const { t } = useI18n()

  if (!ring) return null

  if ((ring.accepted || 0) > 0) {
    return (
      <div className="card vendor-card">
        <div className="card-kicker">{t('roles.worker')}</div>
        <p>{t('client.workerAccepted', { filled: ring.accepted || 0, needed: ring.needed || 0 })}</p>
      </div>
    )
  }

  if (ring.ringing) {
    return (
      <div className="card vendor-card">
        <div className="card-kicker">{t('roles.worker')}</div>
        <p>{t('client.workerRinging', { n: ring.count || 0 })}</p>
      </div>
    )
  }

  return null
}
