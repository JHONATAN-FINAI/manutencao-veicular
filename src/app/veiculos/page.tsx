'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import SecBadge from '@/components/SecBadge'
import type { Veiculo } from '@/types/database'

interface VeiculoWithRelations extends Omit<Veiculo, 'tipo_veiculo' | 'secretaria'> {
  tipo_veiculo: { nome: string } | null
  secretaria: { nome: string; sigla: string } | null
}

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<VeiculoWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadVeiculos() {
      const { data } = await supabase
        .from('veiculos')
        .select('*, tipo_veiculo:tipos_veiculo(nome), secretaria:secretarias(nome, sigla)')
        .order('placa')

      if (data) setVeiculos(data as unknown as VeiculoWithRelations[])
      setLoading(false)
    }
    loadVeiculos()
  }, [])

  const filtered = veiculos.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.placa.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q) || v.marca?.toLowerCase().includes(q)
  })

  return (
    <div>
      <PageHeader
        title="Veículos"
        description={`${veiculos.length} veículos cadastrados`}
        action={
          <Link
            href="/veiculos/novo"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Novo Veículo
          </Link>
        }
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por placa, modelo, marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Modelo</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Secretaria</th>
                  <th className="px-4 py-3 font-medium">Ano</th>
                  <th className="px-4 py-3 font-medium">Patrimônio</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(v => {
                  const tipo = v.tipo_veiculo
                  const sec = v.secretaria
                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium font-mono">{v.placa}</td>
                      <td className="px-4 py-3">{v.modelo}</td>
                      <td className="px-4 py-3 text-gray-500">{v.marca || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{tipo?.nome || '-'}</td>
                      <td className="px-4 py-3">
                        <SecBadge sigla={sec?.sigla || null} nome={sec?.nome} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{v.ano_modelo || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{v.patrimonio || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${v.ativo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {v.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
