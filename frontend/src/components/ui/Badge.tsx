import { clsx } from 'clsx'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const variants: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant])}>
      {children}
    </span>
  )
}

export function statusBadge(status: string) {
  const map: Record<string, Variant> = {
    open: 'info', in_progress: 'warning', resolved: 'success', closed: 'default',
    delivered: 'success', pending: 'warning', processing: 'info', cancelled: 'danger',
    approved: 'success', rejected: 'danger', escalated: 'purple',
    low: 'default', medium: 'info', high: 'warning', urgent: 'danger',
  }
  return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>
}
