export type ProviderTypeRow = {
  slug: string
  role?: string
  match_mode?: 'vendor' | 'worker'
  name: string
  name_hi?: string
  description?: string
  description_hi?: string
  category_slugs?: string[]
  active?: boolean
  coming_soon?: boolean
}

export function providerLabel(row: ProviderTypeRow, locale: string): string {
  if (locale === 'hi' && row.name_hi) return row.name_hi
  return row.name
}

export function providerDescription(row: ProviderTypeRow, locale: string): string {
  if (locale === 'hi' && row.description_hi) return row.description_hi
  return row.description || ''
}

export function isWorkerProvider(row?: ProviderTypeRow | null): boolean {
  return row?.match_mode === 'worker'
}

export const VENDOR_ROLES = ['caterer', 'agency'] as const
export const WORKER_ROLES = ['worker', 'driver', 'home_pro'] as const

export function portalForRoles(roles: string[] | undefined): 'admin' | 'vendor' | 'worker' | 'client' {
  if (roles?.includes('admin')) return 'admin'
  if (roles?.some((r) => (VENDOR_ROLES as readonly string[]).includes(r))) return 'vendor'
  if (roles?.some((r) => (WORKER_ROLES as readonly string[]).includes(r))) return 'worker'
  return 'client'
}

export function homeForRoles(roles: string[] | undefined): string {
  const portal = portalForRoles(roles)
  if (portal === 'admin') return '/admin'
  if (portal === 'vendor') return '/caterer'
  if (portal === 'worker') return '/worker'
  return '/app'
}
