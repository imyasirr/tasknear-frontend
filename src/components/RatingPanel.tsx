import { useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'
import { StatusBadge } from '../ui'

export type MyRating = {
  ratee_id: number
  assignment_id?: number | null
  stars: number
  comment?: string | null
}

export type RateTarget = {
  rateeId: number
  assignmentId?: number
  name: string
  label?: string
}

export function RatingPanel({
  serviceRequestId,
  targets,
  existing,
  onRated,
}: {
  serviceRequestId: number
  targets: RateTarget[]
  existing?: MyRating[]
  onRated?: () => void
}) {
  const { t } = useI18n()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<number, { stars: number; comment: string }>>({})

  if (!targets.length) return null

  function ratingFor(rateeId: number) {
    return existing?.find((r) => r.ratee_id === rateeId)
  }

  async function submit(target: RateTarget) {
    const draft = drafts[target.rateeId] || { stars: 5, comment: '' }
    setBusyId(target.rateeId)
    setError('')
    try {
      await api('/ratings', {
        method: 'POST',
        body: JSON.stringify({
          service_request_id: serviceRequestId,
          assignment_id: target.assignmentId ?? null,
          ratee_id: target.rateeId,
          stars: draft.stars,
          comment: draft.comment || null,
        }),
      })
      onRated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('client.rateFail'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="card rating-panel">
      <div className="card-kicker">{t('client.rateTitle')}</div>
      <p className="rating-lead">{t('client.rateLead')}</p>
      {error && <p className="err">{error}</p>}
      <div className="rating-list">
        {targets.map((target) => {
          const saved = ratingFor(target.rateeId)
          const draft = drafts[target.rateeId] || { stars: saved?.stars || 5, comment: saved?.comment || '' }
          return (
            <div className="rating-row" key={target.rateeId}>
              <div className="rating-head">
                <div>
                  <strong>{target.name}</strong>
                  {target.label && <div className="meta">{target.label}</div>}
                </div>
                {saved && <StatusBadge value="rated" />}
              </div>
              <div className="star-row" role="group" aria-label={t('client.rateStars')}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn${draft.stars >= n ? ' on' : ''}`}
                    disabled={!!saved}
                    onClick={() => setDrafts((prev) => ({
                      ...prev,
                      [target.rateeId]: { ...draft, stars: n },
                    }))}
                    aria-label={`${n}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                placeholder={t('client.rateComment')}
                value={draft.comment}
                disabled={!!saved}
                onChange={(e) => setDrafts((prev) => ({
                  ...prev,
                  [target.rateeId]: { ...draft, comment: e.target.value },
                }))}
              />
              {!saved && (
                <button
                  type="button"
                  className="accent"
                  disabled={busyId === target.rateeId}
                  onClick={() => void submit(target)}
                >
                  {busyId === target.rateeId ? t('common.saving') : t('client.rateSubmit')}
                </button>
              )}
              {saved && <p className="meta ok-line">{t('client.rateThanks')}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
