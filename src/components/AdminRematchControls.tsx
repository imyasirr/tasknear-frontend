import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'

export function AdminRematchControls({
  bookingKey,
  defaultSeconds,
  disabled,
  onDone,
  onError,
}: {
  bookingKey: string
  defaultSeconds: number
  disabled?: boolean
  onDone: () => Promise<void>
  onError: (message: string) => void
}) {
  const { t } = useI18n()
  const [seconds, setSeconds] = useState(defaultSeconds)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setSeconds(defaultSeconds)
  }, [defaultSeconds])

  return (
    <div className="btn-row" style={{ marginTop: 14, alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
      <div className="field" style={{ margin: 0, minWidth: 140 }}>
        <label>{t('matching.ringSeconds')}</label>
        <input
          type="number"
          min={30}
          max={3600}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />
      </div>
      <button
        className="ghost"
        disabled={disabled || busy}
        onClick={async () => {
          setBusy(true)
          try {
            await api(`/admin/bookings/${bookingKey}/rematch`, {
              method: 'POST',
              body: JSON.stringify({ ring_seconds: seconds }),
            })
            await onDone()
          } catch (e) {
            onError(e instanceof Error ? e.message : 'Rematch failed')
          } finally {
            setBusy(false)
          }
        }}
      >
        {t('events.rematch')}
      </button>
    </div>
  )
}
