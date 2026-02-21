'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getSecretariaByEmpenho } from '@/lib/secretarias'
import PageHeader from '@/components/PageHeader'
import SecBadge from '@/components/SecBadge'
import type { Manutencao } from '@/types/database'

interface ManutencaoListAPI extends Omit<Manutencao, 'veiculo' | 'fornecedor'> {
  veiculo: { placa: string; modelo: string; marca: string } | null
  fornecedor: { razao_social: string; nome_fantasia: string } | null
}

export default function ManutencoesPage() {
  const [manutencoes, setManutencoes] = useState<ManutencaoListAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadManutencoes() {
      const { data, error } = await supabase
        .from('manutencoes')
        .select(`
          *,
          veiculo:veiculos(placa, modelo, marca),
          fornecedor:fornecedores(razao_social, nome_fantasia)
        `)
        .order('data_manutencao', { ascending: false })
        .limit(100)

      if (!error && data) {
        setManutencoes(data as unknown as ManutencaoListAPI[])
      }
      setLoading(false)
    }
    loadManutencoes()
  }, [])

  const filtered = manutencoes.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    const v = m.veiculo
    const f = m.fornecedor
    return (
      v?.placa?.toLowerCase().includes(q) ||
      v?.modelo?.toLowerCase().includes(q) ||
      f?.razao_social?.toLowerCase().includes(q) ||
      f?.nome_fantasia?.toLowerCase().includes(q) ||
      m.numero_empenho?.toLowerCase().includes(q) ||
      m.descricao?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <PageHeader
        title="Manutenções"
        description={`${manutencoes.length} registros`}
        action={
          <Link
            href="/manutencoes/nova"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Nova Manutenção
          </Link>
        }
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por placa, fornecedor, empenho..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhuma manutenção encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Secretaria</th>
                  <th className="px-4 py-3 font-medium">Fornecedor</th>
                  <th className="px-4 py-3 font-medium">Empenho</th>
                  <th className="px-4 py-3 font-medium text-right">Peças</th>
                  <th className="px-4 py-3 font-medium text-right">Serviços</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m) => {
                  const v = m.veiculo
                  const f = m.fornecedor
                  const sec = m.numero_empenho ? getSecretariaByEmpenho(m.numero_empenho) : null
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{formatDate(m.data_manutencao)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{v?.placa}</span>
                        <span className="text-gray-500 ml-1">{v?.modelo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <SecBadge sigla={sec?.sigla || null} nome={sec?.nome} />
                      </td>
                      <td className="px-4 py-3">{f?.nome_fantasia || f?.razao_social}</td>
                      <td className="px-4 py-3 font-mono text-xs">{m.numero_empenho || '-'}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(m.valor_total_pecas)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(m.valor_total_servicos)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.valor_total)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/manutencoes/${m.id}`}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Eye size={16} />
                        </Link>
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
