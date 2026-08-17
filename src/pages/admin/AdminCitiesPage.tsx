import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useI18n } from '../../i18n/LocaleContext'
import { DataTable, Loader, PageHeader, StatusBadge, type Column } from '../../ui'
import { AdminAlert, AdminDetailCard, AdminFormCard, AdminPage, AdminTableCard, AdminWorkspace } from './admin-ui'

type City = { id: number; name: string; state?: string | null; is_active: boolean }

export function AdminCitiesPage() {
  const { t } = useI18n()
  const [rows, setRows] = useState<City[]>([])
  const [name, setName] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  async function load() {
    setRows(await api<City[]>('/admin/cities'))
  }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  const columns: Column<City>[] = [
    { key: 'name', header: t('cols.city'), sortValue: (c) => c.name, csv: (c) => c.name, render: (c) => <strong>{c.name}</strong> },
    { key: 'state', header: 'State', sortValue: (c) => c.state || '', csv: (c) => c.state, render: (c) => c.state || '—' },
    { key: 'status', header: t('cols.status'), sortValue: (c) => c.is_active ? 'active' : 'off', csv: (c) => c.is_active ? 'active' : 'inactive', render: (c) => <StatusBadge value={c.is_active ? 'active' : 'pending'} /> },
  ]

  if (!ready) return <Loader />

  return (
    <AdminPage>
      <PageHeader title={t('nav.cities')} subtitle="Add cities workers and clients can pick. New cities go live on KYC and booking forms." />
      <AdminAlert message={error} />
      <AdminWorkspace
        table={(
          <AdminTableCard>
            <DataTable rows={rows} columns={columns} rowKey={(c) => c.id} filename="tasknear-cities" empty="No cities yet." searchPlaceholder="Search cities…" />
          </AdminTableCard>
        )}
        detail={(
          <div className="side-panel">
            <AdminFormCard
              kicker="Add city"
              hint="City appears in registration and job forms once saved."
              actions={(
                <button className="accent" disabled={busy || !name.trim()} onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    await api('/admin/cities', { method: 'POST', body: JSON.stringify({ name: name.trim(), state: state.trim() || null }) })
                    setName('')
                    setState('')
                    await load()
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not add city')
                  } finally {
                    setBusy(false)
                  }
                }}
                >
                  Add city
                </button>
              )}
            >
              <div className="field">
                <label>City name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kanpur" />
              </div>
              <div className="field">
                <label>State</label>
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Uttar Pradesh" />
              </div>
            </AdminFormCard>
            <AdminDetailCard kicker="Quick toggle">
              {rows.map((c) => (
                <div className="worker-row" key={c.id}>
                  <div>
                    <strong>{c.name}</strong>
                    <div className="meta"><span>{c.state || '—'}</span></div>
                  </div>
                  <button className="ghost" type="button" onClick={async () => {
                    await api(`/admin/cities/${c.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !c.is_active }) })
                    await load()
                  }}
                  >
                    {c.is_active ? 'Turn off' : 'Turn on'}
                  </button>
                </div>
              ))}
            </AdminDetailCard>
          </div>
        )}
      />
    </AdminPage>
  )
}
