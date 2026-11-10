type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  withWordmark?: boolean
  variant?: 'default' | 'light'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
}

export function Logo({
  size = 'md',
  withWordmark = true,
  variant = 'default',
  className = '',
}: LogoProps) {
  const titleClass =
    variant === 'light'
      ? 'text-white'
      : 'text-[var(--color-brand)]'
  const subtitleClass =
    variant === 'light' ? 'text-indigo-100' : 'text-[var(--color-accent)]'

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/favicon.svg"
        alt=""
        className={`${sizes[size]} rounded-2xl shadow-[0_10px_30px_rgba(30,58,138,0.28)]`}
        width={size === 'lg' ? 56 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 56 : size === 'md' ? 40 : 32}
      />
      {withWordmark && (
        <div className="leading-tight">
          <p
            className={`font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-2xl ${titleClass}`}
          >
            UniTask
          </p>
          <p
            className={`hidden text-xs font-medium tracking-[0.14em] uppercase sm:block ${subtitleClass}`}
          >
            vida acadêmica
          </p>
        </div>
      )}
    </div>
  )
}
