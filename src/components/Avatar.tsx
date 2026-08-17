import { useEffect, useState } from 'react'
import { getToken } from '../api/client'

type Props = {
  name?: string | null
  src?: string | null
  size?: number
}

function isDirectImageSrc(src: string): boolean {
  return src.startsWith('/storage/') || src.startsWith('blob:') || /^https?:\/\//.test(src)
}

export function Avatar({ name, src, size = 40 }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const initials = (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const directSrc = src && isDirectImageSrc(src) ? src : null

  useEffect(() => {
    if (!src || directSrc) {
      setUrl(null)
      return
    }

    const controller = new AbortController()
    let objectUrl: string | null = null
    const headers: HeadersInit = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    fetch(src, { headers, signal: controller.signal })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob || controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!controller.signal.aborted) setUrl(null)
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, directSrc])

  const imageSrc = directSrc || url

  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {imageSrc ? <img src={imageSrc} alt={name || 'avatar'} /> : initials}
    </span>
  )
}
