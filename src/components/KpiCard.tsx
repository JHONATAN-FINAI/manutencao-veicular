import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  sublabel?: string
  className?: string
}

export default function KpiCard({ label, value, sublabel, className }: KpiCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  )
}
