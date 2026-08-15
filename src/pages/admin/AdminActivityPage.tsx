import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, type Column } from '../../ui'

type Audit = { id: number; action: string; created_at?: string; actor?: { name: string }; payload?: Record<string, unknown> }
type Note = { id: number; channel: string; template: string; status: string; created_at?: string; user?: { name: string } }

export function AdminActivityPage() {
  const { t } = useI18n()
  const [audit, setAudit] = useState<Audit[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [picked, setPicked] = useState<Audit | null>(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([api<Audit[]>('/admin/audit'), api<Note[]>('/admin/notifications')])
      .then(([a, n]) => { setAudit(a); setNotes(n); setPicked(a[0] || null) })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true))
  }, [])

  const when = (iso?: string) => iso ? new Date(iso).toLocaleString() : ''

  const auditCols: Column<Audit>[] = [
    { key: 'when', header: t('cols.when'), sortValue: (a) => a.created_at || '', csv: (a) => when(a.created_at), render: (a) => when(a.created_at) || '—' },
    { key: 'actor', header: t('cols.actor'), sortValue: (a) => a.actor?.name || 'System', csv: (a) => a.actor?.name || 'System', render: (a) => a.actor?.name || 'System' },
    { key: 'action', header: t('cols.action'), sortValue: (a) => a.action, csv: (a) => a.action, render: (a) => a.action },
  ]

  const noteCols: Column<Note>[] = [
    { key: 'when', header: t('cols.when'), sortValue: (n) => n.created_at || '', csv: (n) => when(n.created_at), render: (n) => when(n.created_at) || '—' },
    { key: 'user', header: t('cols.user'), sortValue: (n) => n.user?.name || '', csv: (n) => n.user?.name, render: (n) => n.user?.name || '—' },
    { key: 'template', header: t('cols.template'), sortValue: (n) => n.template, csv: (n) => n.template, render: (n) => n.template },
    { key: 'channel', header: t('cols.channel'), sortValue: (n) => n.channel, csv: (n) => n.channel, render: (n) => n.channel },
    { key: 'status', header: t('cols.status'), sortValue: (n) => n.status, csv: (n) => n.status, render: (n) => <StatusBadge value={n.status} /> },
  ]

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title={t('activity.title')} subtitle={t('activity.subtitle')} />
      {error && <p className="err">{error}</p>}
      <div className="split even">
        <div className="card flush">
          <div className="card-kicker" style={{ padding: '14px 16px 0' }}>{t('activity.audit')}</div>
          <DataTable
            rows={audit}
            columns={auditCols}
            rowKey={(a) => a.id}
            filename="tasknear-audit"
            searchPlaceholder={t('activity.searchAudit')}
            selectedKey={picked?.id}
            onSelect={setPicked}
            empty={t('activity.noAudit')}
          />
        </div>
        <div className="side-panel">
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-kicker">{t('activity.selected')}</div>
            {picked ? (
              <>
                <h2>{picked.action}</h2>
                <div className="kv">
                  <div className="kv-row"><span>Actor</span><strong>{picked.actor?.name || 'System'}</strong></div>
                  <div className="kv-row"><span>When</span><strong>{when(picked.created_at) || '—'}</strong></div>
                </div>
              </>
            ) : <p>Select an audit row.</p>}
          </div>
          <div className="card flush">
            <div className="card-kicker" style={{ padding: '14px 16px 0' }}>{t('activity.notes')}</div>
            <DataTable
              rows={notes}
              columns={noteCols}
              rowKey={(n) => n.id}
              filename="tasknear-notifications"
              searchPlaceholder={t('activity.searchNotes')}
              pageSize={8}
              empty={t('activity.noNotes')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
