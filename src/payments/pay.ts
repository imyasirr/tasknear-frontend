import { api } from '../api/client'
import { loadRazorpayScript, openRazorpayCheckout } from './razorpay'
import type { CheckoutConfig, CheckoutPayload, PayTarget } from './types'

let configCache: CheckoutConfig | null = null

export async function getCheckoutConfig(force = false): Promise<CheckoutConfig> {
  if (configCache && !force) {
    return configCache
  }

  configCache = await api<CheckoutConfig>('/checkout/config')
  return configCache
}

async function startCheckout(path: string): Promise<CheckoutPayload> {
  return api<CheckoutPayload>(path, { method: 'POST' })
}

async function verifyCheckout(body: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) {
  return api('/checkout/verify', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function devPayBooking(paymentId: number) {
  return api(`/payments/${paymentId}/dev-pay`, { method: 'POST' })
}

async function devBuySubscription(planId: number) {
  return api(`/subscription-plans/${planId}/buy`, { method: 'POST' })
}

function checkoutPath(target: PayTarget): string {
  if (target.kind === 'booking') {
    return `/payments/${target.paymentId}/checkout`
  }

  return `/subscription-plans/${target.planId}/checkout`
}

export async function runPayment(
  target: PayTarget,
  options?: {
    onSuccess?: () => void | Promise<void>
    onDismiss?: () => void
  },
): Promise<void> {
  const config = await getCheckoutConfig()

  if (config.razorpay_enabled) {
    const payload = await startCheckout(checkoutPath(target))
    await loadRazorpayScript()

    await new Promise<void>((resolve, reject) => {
      openRazorpayCheckout(
        payload,
        async (response) => {
          try {
            await verifyCheckout(response)
            await options?.onSuccess?.()
            resolve()
          } catch (e) {
            reject(e)
          }
        },
        () => {
          options?.onDismiss?.()
          reject(new Error('Payment cancelled.'))
        },
      )
    })

    return
  }

  if (config.dev_pay_enabled) {
    if (target.kind === 'booking') {
      await devPayBooking(target.paymentId)
    } else {
      await devBuySubscription(target.planId)
    }
    await options?.onSuccess?.()
    return
  }

  throw new Error('Online payments are not configured. Add Razorpay keys on the server.')
}
