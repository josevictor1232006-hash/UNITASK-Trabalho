type UserAvatarProps = {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const sizeClass = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function UserAvatar({ name, size = 'md' }: UserAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-accent)] font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(30,58,138,0.28)] ring-2 ring-white ${sizeClass[size]}`}
      aria-hidden="true"
    >
      {initialsFromName(name)}
    </span>
  )
}
