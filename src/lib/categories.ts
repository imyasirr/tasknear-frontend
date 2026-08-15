import type { Locale } from '../i18n/messages'

export type CategoryRow = {
  id: number
  slug?: string
  name: string
  name_hi?: string
  vertical?: string
  default_rate_inr: number
  default_duration_minutes?: number
}

export function categoryLabel(c: CategoryRow, locale: Locale | string): string {
  if (locale === 'hi' && c.name_hi) return c.name_hi
  return c.name
}
