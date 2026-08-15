import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/LocaleContext'
import { rupee } from '../ui'

export type Quote = {
  labor_inr: number
  commission_bps: number
  commission_inr: number
  total_inr: number
  fee_waived: boolean
  plan_name?: string | null
}

export function PriceQuote({ quote, compact }: { quote: Quote | null; compact?: boolean }) {
  const { t } = useI18n()
  if (!quote) return null
  const pct = (quote.commission_bps / 100).toFixed(quote.commission_bps % 100 === 0 ? 0 : 1)

  return (
    <div className={compact ? '' : 'card'} style={compact ? undefined : { margin: '12px 0 16px' }}>
      {!compact && <div className="card-kicker">{t('pay.breakdown')}</div>}
      <div className="kv">
        <div className="kv-row"><span>{t('pay.crew')}</span><strong>{rupee(quote.labor_inr)}</strong></div>
        <div className="kv-row">
          <span>{quote.fee_waived ? t('pay.feeWaived') : t('pay.fee', { pct })}</span>
          <strong>{quote.fee_waived ? t('pay.free') : rupee(quote.commission_inr)}</strong>
        </div>
        <div className="kv-row"><span>{t('pay.youPay')}</span><strong>{rupee(quote.total_inr)}</strong></div>
      </div>
      {quote.fee_waived ? (
        <p className="ok" style={{ marginTop: 10 }}>{t('pay.covered', { plan: quote.plan_name || 'plan' })}</p>
      ) : (
        <p style={{ marginTop: 10 }}>
          {t('pay.orSub')} <Link to="/app/plans">{t('pay.seePlans')}</Link>
        </p>
      )}
    </div>
  )
}
