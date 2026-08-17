import { useI18n } from '../i18n/LocaleContext'

function MapHero() {
  return (
    <svg
      className="login-hero-svg"
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      overflow="hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="0" y="0" width="400" height="220" rx="20" fill="#163228" />
      <path
        d="M32 168c24-36 54-48 86-48s68 18 96 18 46-14 68-34"
        stroke="rgba(110,224,180,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="200" cy="102" r="44" stroke="rgba(110,224,180,0.35)" strokeWidth="1.5" strokeDasharray="4 7" />
      <circle cx="200" cy="102" r="24" fill="rgba(110,224,180,0.12)" />
      <path
        d="M200 72c-14 0-25 11-25 25 0 18 25 42 25 42s25-24 25-42c0-14-11-25-25-25Z"
        fill="#0e7a58"
      />
      <circle cx="200" cy="95" r="8" fill="#fff" fillOpacity="0.92" />
      <circle cx="124" cy="82" r="4" fill="#6ee0b4" fillOpacity="0.8" />
      <circle cx="278" cy="76" r="3.5" fill="#6ee0b4" fillOpacity="0.55" />
      <circle cx="296" cy="142" r="4" fill="#6ee0b4" fillOpacity="0.65" />
    </svg>
  )
}

export function LoginBrandVisual() {
  const { t } = useI18n()
  const highlights = [t('brand.feature1'), t('brand.feature2'), t('brand.feature3')]

  return (
    <div className="login-visual">
      <MapHero />
      <ul className="login-highlights">
        {highlights.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
