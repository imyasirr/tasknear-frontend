import { useEffect, useState } from 'react'
import { getToken } from '../api/client'

type Props = {
  name?: string | null
  src?: string | null
  size?: number
}

export function Avatar({ name, src, size = 40 }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const initials = (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    if (!src) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    const headers: HeadersInit = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    fetch(src, { headers })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => setUrl(null))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {url ? <img src={url} alt={name || 'avatar'} /> : initials}
    </span>
  )
}
