'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wrench,
  Car,
  Building2,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manutencoes', label: 'Manutenções', icon: Wrench },
  { href: '/veiculos', label: 'Veículos', icon: Car },
  { href: '/fornecedores', label: 'Fornecedores', icon: Building2 },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">AMTC</h1>
        <p className="text-xs text-gray-400 mt-1">Controle de Manutenções</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">Frota Municipal</p>
        <p className="text-xs text-gray-500">Rondonópolis - MT</p>
      </div>
    </aside>
  )
}
