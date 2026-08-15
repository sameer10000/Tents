interface IconProps {
  className?: string
}

/** Hairline icon set — 1px strokes on a 24 grid, to sit with the type. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16 L21 21" />
  </svg>
)

export const HeartIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg {...base} className={className} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5 C 6.5 16.5 3 13.5 3 9.6 A4.6 4.6 0 0 1 12 7.4 A4.6 4.6 0 0 1 21 9.6 C21 13.5 17.5 16.5 12 20.5 Z" />
  </svg>
)

export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 5 L19 19 M19 5 L5 19" />
  </svg>
)

export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 7 L21 7 M3 12 L21 12 M3 17 L14 17" />
  </svg>
)

export const SunIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5 L12 5 M12 19 L12 21.5 M2.5 12 L5 12 M19 12 L21.5 12 M5.3 5.3 L7 7 M17 17 L18.7 18.7 M18.7 5.3 L17 7 M7 17 L5.3 18.7" />
  </svg>
)

export const MoonIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M20.5 14.2 A8.6 8.6 0 0 1 9.8 3.5 A8.8 8.8 0 1 0 20.5 14.2 Z" />
  </svg>
)

export const ArrowIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 12 L20 12 M14 6 L20 12 L14 18" />
  </svg>
)

export const ChevronIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M8 5 L15 12 L8 19" />
  </svg>
)

export const MailIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="2.5" y="5" width="19" height="14" rx="1" />
    <path d="M2.5 6.5 L12 13 L21.5 6.5" />
  </svg>
)

export const FilterIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 6 L21 6 M6 12 L18 12 M10 18 L14 18" />
  </svg>
)

export const GridIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="7.5" height="7.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" />
  </svg>
)

export const BagIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 7.5 L20 7.5 L18.8 20.5 L5.2 20.5 Z" />
    <path d="M8.5 10 V6.5 A3.5 3.5 0 0 1 15.5 6.5 V10" />
  </svg>
)

export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 5 L12 19 M5 12 L19 12" />
  </svg>
)

export const MinusIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12 L19 12" />
  </svg>
)

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 12.5 L9.5 18 L20 6" />
  </svg>
)

export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="1" />
    <path d="M8 10.5 V7 A4 4 0 0 1 16 7 V10.5" />
  </svg>
)

export const TruckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M2.5 6.5 H14.5 V17 H2.5 Z" />
    <path d="M14.5 10 H18 L21.5 13.5 V17 H14.5 Z" />
    <circle cx="7" cy="17.5" r="2" />
    <circle cx="17.5" cy="17.5" r="2" />
  </svg>
)

export const RowsIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="6" />
    <rect x="3" y="14" width="18" height="6" />
  </svg>
)
