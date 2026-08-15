import type { User } from './AuthContext'

export function homeFor(roles: string[] | undefined): string {
  if (roles?.includes('admin')) return '/admin'
  if (roles?.includes('caterer')) return '/caterer'
  return '/app'
}

export function portalFor(user: User | null): 'admin' | 'caterer' | 'client' {
  if (user?.roles.includes('admin')) return 'admin'
  if (user?.roles.includes('caterer')) return 'caterer'
  return 'client'
}
