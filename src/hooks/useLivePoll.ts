import { useEffect, useState } from 'react'

export function useLivePoll(load: () => Promise<void> | void, ms = 2000, deps: unknown[] = []) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let on = true
    const run = async () => {
      if (!on) return
      try {
        await Promise.resolve(load())
      } catch {
        // first paint still ends so the page can show an error
      } finally {
        if (on) setReady(true)
      }
    }
    void run()
    const id = window.setInterval(() => { void run() }, ms)
    return () => {
      on = false
      window.clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ready
}
