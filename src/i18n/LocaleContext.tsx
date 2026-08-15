import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { messages, type Locale } from './messages'

const STORAGE_KEY = 'tasknear_locale_v2'

type Vars = Record<string, string | number>

type I18n = {
  locale: Locale
  setLocale: (next: Locale) => Promise<void>
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18n | null>(null)

function read(dict: unknown, key: string): string | undefined {
  let cur: unknown = dict
  for (const part of key.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

function fill(text: string, vars?: Vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''))
}

function storedLocale(): Locale | null {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'hi' || value === 'en' ? value : null
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user, refresh } = useAuth()
  const [locale, setLocaleState] = useState<Locale>(() => storedLocale() || 'en')

  useEffect(() => {
    const chosen = storedLocale()
    setLocaleState(chosen || 'en')
  }, [user?.id])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18n>(() => ({
    locale,
    async setLocale(next) {
      setLocaleState(next)
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
      if (user) {
        await api('/me', { method: 'PUT', body: JSON.stringify({ locale: next }) })
        await refresh()
      }
    },
    t(key, vars) {
      return fill(read(messages[locale], key) || read(messages.en, key) || key, vars)
    },
  }), [locale, user, refresh])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n outside provider')
  return ctx
}
