const SCRIPT_ID = 'razorpay-checkout-js'
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise: Promise<void> | null = null

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Payments work in the browser only.'))
  }

  if (window.Razorpay) {
    return Promise.resolve()
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay.'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

export function openRazorpayCheckout(
  payload: {
    key_id: string
    order_id: string
    amount: number
    currency: string
    name: string
    description: string
    prefill?: { name?: string; email?: string; contact?: string }
  },
  onSuccess: (response: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => void,
  onDismiss?: () => void,
): void {
  if (!window.Razorpay) {
    throw new Error('Razorpay is not loaded.')
  }

  const rzp = new window.Razorpay({
    key: payload.key_id,
    amount: payload.amount,
    currency: payload.currency,
    name: payload.name,
    description: payload.description,
    order_id: payload.order_id,
    prefill: payload.prefill,
    theme: { color: '#0f766e' },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  })

  rzp.open()
}
