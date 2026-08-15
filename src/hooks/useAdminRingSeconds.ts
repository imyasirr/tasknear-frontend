import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function useAdminRingSeconds() {
  const [seconds, setSeconds] = useState(180)

  useEffect(() => {
    api<{ vendor_offer_seconds: number }>('/admin/matching')
      .then((row) => setSeconds(row.vendor_offer_seconds))
      .catch(() => {})
  }, [])

  return seconds
}
