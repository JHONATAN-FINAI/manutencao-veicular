'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCNPJ } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import type { Fornecedor } from '@/types/database'

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('fornecedores').select('*').order('razao_social').then(({ data }) => {
      if (data) setFornecedores(data)
      setLoading(false)
    })
  }, [])

  const filtered = fornecedores.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.razao_social.toLowerCase().includes(q) || f.nome_fantasia?.toLowerCase().includes(q) || f.cnpj.includes(q)
  })

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description={`${fornecedores.length} fornecedores`}
        action={
          <Link href="/fornecedores/novo"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={16} /> Novo Fornecedor
          </Link>
        }
      />

      <div className="mb-4">
        <input type="text" placeholder="Buscar por nome, CNPJ..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">CNPJ</th>
                  <th className="px-4 py-3 font-medium">Razão Social</th>
                  <th className="px-4 py-3 font-medium">Nome Fantasia</th>
                  <th className="px-4 py-3 font-medium">Cidade/UF</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{formatCNPJ(f.cnpj)}</td>
                    <td className="px-4 py-3 font-medium">{f.razao_social}</td>
                    <td className="px-4 py-3 text-gray-500">{f.nome_fantasia || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{f.cidade ? `${f.cidade}/${f.uf}` : '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{f.telefone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
