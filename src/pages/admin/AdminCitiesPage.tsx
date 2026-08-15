import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { DataTable, Loader, PageHeader, StatusBadge, type Column } from '../../ui'

type City = { id: number; name: string; state?: string | null; is_active: boolean }

export function AdminCitiesPage() {
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
    { key: 'name', header: 'City', sortValue: (c) => c.name, csv: (c) => c.name, render: (c) => <strong>{c.name}</strong> },
    { key: 'state', header: 'State', sortValue: (c) => c.state || '', csv: (c) => c.state, render: (c) => c.state || '—' },
    { key: 'status', header: 'Status', sortValue: (c) => c.is_active ? 'active' : 'off', csv: (c) => c.is_active ? 'active' : 'inactive', render: (c) => <StatusBadge value={c.is_active ? 'active' : 'pending'} /> },
  ]

  if (!ready) return <Loader />

  return (
    <div className="page">
      <PageHeader title="Cities" subtitle="Add cities workers and clients can pick. New cities go live on KYC and booking forms." />
      {error && <p className="err">{error}</p>}
      <div className="split">
        <div className="card flush">
          <DataTable rows={rows} columns={columns} rowKey={(c) => c.id} filename="tasknear-cities" empty="No cities yet." />
        </div>
        <div className="side-panel card">
          <div className="card-kicker">Add city</div>
          <div className="field">
            <label>City name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kanpur" />
          </div>
          <div className="field">
            <label>State</label>
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Uttar Pradesh" />
          </div>
          <button disabled={busy || !name.trim()} onClick={async () => {
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
          }}>Add city</button>
          <div style={{ marginTop: 18 }}>
            <div className="card-kicker">Toggle</div>
            {rows.map((c) => (
              <div className="worker-row" key={c.id}>
                <strong>{c.name}</strong>
                <button className="ghost" onClick={async () => {
                  await api(`/admin/cities/${c.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !c.is_active }) })
                  await load()
                }}>{c.is_active ? 'Turn off' : 'Turn on'}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
