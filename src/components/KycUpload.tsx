import { useState } from 'react'
import { api } from '../api/client'
import { useI18n } from '../i18n/LocaleContext'
import { StatusBadge } from '../ui'

const DOC_TYPES = ['aadhaar', 'pan', 'selfie', 'bank'] as const
type DocType = (typeof DOC_TYPES)[number]

type WorkerDoc = {
  id: number
  type: DocType
  status: string
  review_note?: string | null
}

export function KycUpload({
  documents,
  onUploaded,
}: {
  documents: WorkerDoc[]
  onUploaded: () => void
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState<DocType | null>(null)
  const [error, setError] = useState('')

  async function upload(type: DocType, file: File) {
    setBusy(type)
    setError('')
    try {
      const body = new FormData()
      body.append('type', type)
      body.append('file', file)
      await api('/worker/documents', { method: 'POST', body })
      onUploaded()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('worker.docFail'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="kyc-upload">
      <div className="card-kicker">{t('worker.docTitle')}</div>
      <p className="meta">{t('worker.docSub')}</p>
      {error && <p className="err">{error}</p>}
      <div className="kyc-doc-grid">
        {DOC_TYPES.map((type) => {
          const doc = documents.find((d) => d.type === type)
          return (
            <label key={type} className={`kyc-doc-card${doc ? ' has-doc' : ''}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={busy === type}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void upload(type, file)
                  e.target.value = ''
                }}
              />
              <strong>{t(`worker.doc.${type}`)}</strong>
              {doc ? (
                <>
                  <StatusBadge value={doc.status} />
                  {doc.review_note && <span className="meta">{doc.review_note}</span>}
                </>
              ) : (
                <span className="meta">{busy === type ? t('common.uploading') : t('worker.docTap')}</span>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
