export type SlugRow = {
  id?: number
  slug?: string | null
  type?: string
  event_detail?: unknown
  task_detail?: unknown
  service_request?: SlugRow | null
}

export function slugOf(row?: SlugRow | null, fallback?: number | string): string {
  return row?.slug || (fallback != null ? String(fallback) : String(row?.id || ''))
}

export function eventPath(row?: SlugRow | null): string {
  return `/app/events/${slugOf(row)}`
}

export function taskPath(row?: SlugRow | null): string {
  return `/app/tasks/${slugOf(row)}`
}

export function bookingPath(row?: SlugRow | null): string {
  if (row?.type === 'task' || (!row?.event_detail && row?.task_detail)) return taskPath(row)
  return eventPath(row)
}

export function catererJobPath(row?: SlugRow | null, offerId?: number): string {
  return `/caterer/jobs/${slugOf(row?.service_request || row, offerId)}`
}

export function adminBookingPath(row?: SlugRow | null): string {
  const key = slugOf(row)
  if (row?.type === 'task' || (!row?.event_detail && row?.task_detail)) return `/admin/tasks/${key}`
  return `/admin/events/${key}`
}
