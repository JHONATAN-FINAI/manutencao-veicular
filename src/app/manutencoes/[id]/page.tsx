'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getSecretariaByEmpenho } from '@/lib/secretarias'
import PageHeader from '@/components/PageHeader'
import SecBadge from '@/components/SecBadge'
import type { Manutencao, NotaFiscal } from '@/types/database'

interface ItemDetail {
  categoria: { nome: string } | null
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

interface ManutencaoDetail extends Omit<Manutencao, 'veiculo' | 'fornecedor' | 'notas_fiscais'> {
  veiculo: { placa: string; modelo: string; marca: string } | null
  fornecedor: { razao_social: string; nome_fantasia: string; cnpj: string } | null
  notas_fiscais: (NotaFiscal & { itens: ItemDetail[] })[]
}

export default function ManutencaoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [manut, setManut] = useState<ManutencaoDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadManutencao() {
      const { data, error } = await supabase
        .from('manutencoes')
        .select(`
          *,
          veiculo:veiculos(placa, modelo, marca),
          fornecedor:fornecedores(razao_social, nome_fantasia, cnpj),
          notas_fiscais(*, itens:itens_nota_fiscal(*, categoria:categorias(nome)))
        `)
        .eq('id', params.id)
        .single()

      if (!error && data) {
        setManut(data as unknown as ManutencaoDetail)
      }
      setLoading(false)
    }
    loadManutencao()
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>
  if (!manut) return <div className="p-8 text-center text-gray-400">Manutenção não encontrada</div>

  const v = manut.veiculo
  const f = manut.fornecedor
  const sec = manut.numero_empenho ? getSecretariaByEmpenho(manut.numero_empenho) : null
  const nfs = manut.notas_fiscais || []

  return (
    <div className="max-w-5xl">
      <div className="mb-4">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          <ArrowLeft size={14} />
          Voltar
        </button>
      </div>

      <PageHeader
        title={`${v?.placa} - ${v?.modelo}`}
        description={`Manutenção em ${formatDate(manut.data_manutencao)}`}
      />

      {/* Info principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Veículo</p>
            <p className="font-medium">{v?.placa} - {v?.modelo} {v?.marca}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Fornecedor</p>
            <p className="font-medium">{f?.nome_fantasia || f?.razao_social}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Empenho</p>
            <p className="font-mono">{manut.numero_empenho || '-'}</p>
            {sec && <SecBadge sigla={sec.sigla} nome={sec.nome} size="md" />}
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Descrição</p>
            <p>{manut.descricao || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Peças</p>
            <p className="text-lg font-bold">{formatCurrency(manut.valor_total_pecas)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Serviços</p>
            <p className="text-lg font-bold">{formatCurrency(manut.valor_total_servicos)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(manut.valor_total)}</p>
          </div>
        </div>
      </div>

      {/* Notas Fiscais */}
      {nfs.map((nf) => (
        <div key={nf.id} className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                NF {nf.numero_nf}{nf.serie ? `/${nf.serie}` : ''}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {nf.tipo === 'peca' ? 'Peças' : 'Serviços'} — Emissão: {formatDate(nf.data_emissao)}
              </p>
            </div>
            <span className="text-lg font-bold">{formatCurrency(nf.valor_liquido)}</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Descrição</th>
                <th className="pb-2 font-medium">Categoria</th>
                <th className="pb-2 font-medium text-center">Qtd</th>
                <th className="pb-2 font-medium text-right">Valor Unit.</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(nf.itens || []).map((item) => (
                <tr key={item.id}>
                  <td className="py-2">{item.descricao}</td>
                  <td className="py-2 text-gray-500">{item.categoria?.nome || '-'}</td>
                  <td className="py-2 text-center">{item.quantidade}</td>
                  <td className="py-2 text-right">{formatCurrency(item.valor_unitario)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
