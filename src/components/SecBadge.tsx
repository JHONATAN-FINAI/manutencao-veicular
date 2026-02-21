import { cn } from '@/lib/utils'

interface SecBadgeProps {
  sigla: string | null
  nome?: string
  size?: 'sm' | 'md'
}

export default function SecBadge({ sigla, nome, size = 'sm' }: SecBadgeProps) {
  if (!sigla) return <span className="text-gray-400 text-xs">-</span>

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      )}
      title={nome}
    >
      {sigla}
    </span>
  )
}
