import type { User } from './AuthContext'
import { homeForRoles, portalForRoles } from '../lib/providerTypes'

export function homeFor(roles: string[] | undefined): string {
  return homeForRoles(roles)
}

export function portalFor(user: User | null): 'admin' | 'caterer' | 'worker' | 'venue' | 'client' {
  const p = portalForRoles(user?.roles)
  if (p === 'vendor') return 'caterer'
  if (p === 'venue') return 'venue'
  return p
}
