import { useState } from 'react'
import { useI18n } from '../i18n/LocaleContext'
import { rupee } from '../ui'
import { runPayment } from './pay'
import type { PayTarget } from './types'

export function PayButton({
  target,
  label,
  className = 'accent',
  disabled,
  onSuccess,
  onError,
}: {
  target: PayTarget
  label?: string
  className?: string
  disabled?: boolean
  onSuccess?: () => void | Promise<void>
  onError?: (message: string) => void
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  const text =
    label ||
    (target.kind === 'subscription'
      ? t('pay.buyPlan', { amount: rupee(target.amountInr) })
      : t('pay.payNow', { amount: rupee(target.amountInr) }))

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true)
        try {
          await runPayment(target, {
            onSuccess,
            onDismiss: () => setBusy(false),
          })
        } catch (e) {
          const message = e instanceof Error ? e.message : t('pay.failed')
          if (message !== 'Payment cancelled.') {
            onError?.(message)
          }
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy ? t('pay.processing') : text}
    </button>
  )
}
