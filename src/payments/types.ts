export type CheckoutConfig = {
  razorpay_enabled: boolean
  key_id: string | null
  dev_pay_enabled: boolean
  currency: string
  company_name: string
}

export type CheckoutPayload = {
  key_id: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  prefill?: { name?: string; email?: string; contact?: string }
}

export type PayTarget =
  | { kind: 'booking'; paymentId: number; amountInr: number; description?: string }
  | { kind: 'subscription'; planId: number; amountInr: number; description?: string }

export type RazorpaySuccessResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: RazorpaySuccessResponse) => void) => void
    }
  }
}
