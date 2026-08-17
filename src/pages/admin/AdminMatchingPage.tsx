import { useState } from 'react'
import { api } from '../../api/client'
import { useLivePoll } from '../../hooks/useLivePoll'
import { useI18n } from '../../i18n/LocaleContext'
import { Loader, PageHeader } from '../../ui'
import { AdminAlert, AdminFormCard, AdminPage } from './admin-ui'

type MatchingSettings = {
  vendor_offer_seconds: number
  min_ring_seconds: number
  max_ring_seconds: number
}

export function AdminMatchingPage() {
  const { t } = useI18n()
  const [settings, setSettings] = useState<MatchingSettings | null>(null)
  const [seconds, setSeconds] = useState(180)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const row = await api<MatchingSettings>('/admin/matching')
    setSettings(row)
    setSeconds(row.vendor_offer_seconds)
  }

  const ready = useLivePoll(load, 15000)
  if (!ready || !settings) return <Loader label={t('common.loading')} />

  return (
    <AdminPage>
      <PageHeader title={t('matching.title')} subtitle={t('matching.subtitle')} />
      <AdminAlert message={error} />
      <AdminFormCard
        narrow
        kicker={t('matching.ringTimer')}
        hint={t('matching.ringHint')}
        actions={(
          <button
            className="accent"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await api('/admin/matching', {
                  method: 'PUT',
                  body: JSON.stringify({ vendor_offer_seconds: seconds }),
                })
                await load()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Save failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            {t('common.save')}
          </button>
        )}
      >
        <div className="form-grid">
          <div className="field">
            <label>{t('matching.ringSeconds')}</label>
            <input
              type="number"
              min={settings.min_ring_seconds}
              max={settings.max_ring_seconds}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="meta admin-form-hint">
          {t('matching.range', { min: settings.min_ring_seconds, max: settings.max_ring_seconds })}
        </p>
        <p className="admin-form-hint">{t('matching.preview', { n: seconds })}</p>
      </AdminFormCard>
    </AdminPage>
  )
}
