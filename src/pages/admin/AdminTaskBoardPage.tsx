import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Loader, PageHeader, StatusBadge } from '../../ui'

type Task = { id: number; title?: string; city?: string; status?: string; required_workers: number; filled: number; open: number }
type Worker = { id: number; user?: { id: number; name: string; phone: string } }

export function AdminTaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [ready, setReady] = useState(false)

  async function load() { setTasks(await api<Task[]>('/admin/tasks')) }
  useEffect(() => { load().catch(() => setTasks([])).finally(() => setReady(true)) }, [])

  if (!ready) return <Loader />

  return (
    <div>
      <PageHeader title="Task board" subtitle="Weekday jobs for the same worker pool." />
      {tasks.map((t) => (
        <div className="card" key={t.id} style={{ marginBottom: 12 }}>
          <div className="btn-row">
            <StatusBadge value={t.status} />
            <span className="badge">{t.filled}/{t.required_workers} filled</span>
          </div>
          <h2 style={{ marginTop: 10 }}>{t.title}</h2>
          <div className="meta"><span>{t.city}</span><span>{t.open} open</span></div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="ghost" onClick={async () => {
              setOpenId(t.id)
              setWorkers(await api<Worker[]>(`/admin/tasks/${t.id}/eligible-workers`))
            }}>Show eligible workers</button>
          </div>
          {openId === t.id && workers.map((w) => (
            <div className="worker-row" key={w.id}>
              <div><strong>{w.user?.name}</strong><div className="meta"><span>{w.user?.phone}</span></div></div>
              <button onClick={async () => {
                await api(`/admin/tasks/${t.id}/assign`, { method: 'POST', body: JSON.stringify({ worker_user_id: w.user?.id }) })
                await load()
                setWorkers(await api<Worker[]>(`/admin/tasks/${t.id}/eligible-workers`))
              }}>Assign</button>
            </div>
          ))}
        </div>
      ))}
      {tasks.length === 0 && <div className="card empty">No open tasks.</div>}
    </div>
  )
}
