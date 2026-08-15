import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Loader, PageHeader, StatusBadge } from '../../ui'

type Shift = {
  id: number
  title?: string
  city?: string
  status?: string
  headcount: number
  filled: number
  open: number
  category?: { name: string }
}
type Worker = { id: number; user?: { id: number; name: string; phone: string }; rating_avg?: number }

export function AdminFillBoardPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [openShift, setOpenShift] = useState<number | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  async function load() { setShifts(await api<Shift[]>('/admin/fill-board')) }
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setReady(true)) }, [])

  if (!ready) return <Loader />

  return (
    <div>
      <PageHeader title="Event fill board" subtitle="Override auto-match here if a shift is still short or a worker declined." />
      {error && <p className="err">{error}</p>}
      <div className="grid">
        {shifts.map((s) => (
          <div className="card" key={s.id}>
            <div className="btn-row">
              <StatusBadge value={s.status} />
              <span className="badge">{s.filled}/{s.headcount} filled</span>
            </div>
            <h2 style={{ marginTop: 10 }}>{s.title}</h2>
            <div className="meta">
              <span>{s.category?.name}</span>
              <span>{s.city}</span>
              <span>{s.open} open</span>
            </div>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className="ghost" onClick={async () => {
                setOpenShift(s.id)
                setWorkers(await api<Worker[]>(`/admin/shifts/${s.id}/eligible-workers`))
              }}>Show eligible workers</button>
            </div>
            {openShift === s.id && (
              <div style={{ marginTop: 8 }}>
                {workers.map((w) => (
                  <div className="worker-row" key={w.id}>
                    <div>
                      <strong>{w.user?.name}</strong>
                      <div className="meta"><span>{w.user?.phone}</span><span>Rating {w.rating_avg}</span></div>
                    </div>
                    <button onClick={async () => {
                      await api(`/admin/shifts/${s.id}/assign`, { method: 'POST', body: JSON.stringify({ worker_user_id: w.user?.id }) })
                      await load()
                      setWorkers(await api<Worker[]>(`/admin/shifts/${s.id}/eligible-workers`))
                    }}>Assign</button>
                  </div>
                ))}
                {workers.length === 0 && <p className="empty">No eligible approved workers.</p>}
              </div>
            )}
          </div>
        ))}
        {shifts.length === 0 && <div className="card empty">No open shifts.</div>}
      </div>
    </div>
  )
}
