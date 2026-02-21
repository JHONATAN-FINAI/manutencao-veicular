'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import KpiCard from '@/components/KpiCard'
import SecBadge from '@/components/SecBadge'
import type { Manutencao } from '@/types/database'

interface DashboardData {
  totalManutencoes: number
  totalVeiculos: number
  custoTotal: number
  custoPecas: number
  custoServicos: number
  ticketMedio: number
  porSecretaria: { sigla: string; nome: string; custo_total: number; total_manutencoes: number }[]
  porFornecedor: { nome_fantasia: string; razao_social: string; custo_total: number; total_manutencoes: number }[]
  ultimasManutencoes: ManutencaoWithRelations[]
}

type ManutencaoWithRelations = Manutencao & {
  veiculo: { placa: string; modelo: string } | null
  fornecedor: { nome_fantasia: string; razao_social: string } | null
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [
        { data: secData },
        { data: fornData },
        { data: manutData },
        { count: veiculosCount },
      ] = await Promise.all([
        supabase.from('vw_custo_por_secretaria').select('*').gt('custo_total', 0).order('custo_total', { ascending: false }),
        supabase.from('vw_custo_por_fornecedor').select('*').gt('custo_total', 0).order('custo_total', { ascending: false }),
        supabase.from('manutencoes').select('*, veiculo:veiculos(placa, modelo), fornecedor:fornecedores(nome_fantasia, razao_social)').order('data_manutencao', { ascending: false }).limit(5),
        supabase.from('veiculos').select('*', { count: 'exact', head: true }).eq('ativo', true),
      ])

      interface CustoPorSecretaria {
        sigla: string
        secretaria: string
        custo_total: number
        total_manutencoes: number
        total_pecas: number
        total_servicos: number
      }

      interface CustoPorFornecedor {
        nome_fantasia: string
        razao_social: string
        custo_total: number
        total_manutencoes: number
      }


      const secDataTyped = secData as unknown as CustoPorSecretaria[]
      const fornDataTyped = fornData as unknown as CustoPorFornecedor[]

      const totalPecas = (secDataTyped || []).reduce((s, r) => s + Number(r.total_pecas || 0), 0)
      const totalServicos = (secDataTyped || []).reduce((s, r) => s + Number(r.total_servicos || 0), 0)
      const custoTotal = totalPecas + totalServicos
      const totalManut = (secDataTyped || []).reduce((s, r) => s + Number(r.total_manutencoes || 0), 0)

      setData({
        totalManutencoes: totalManut,
        totalVeiculos: veiculosCount || 0,
        custoTotal,
        custoPecas: totalPecas,
        custoServicos: totalServicos,
        ticketMedio: totalManut > 0 ? custoTotal / totalManut : 0,
        porSecretaria: (secDataTyped || []).map(r => ({
          sigla: r.sigla,
          nome: r.secretaria,
          custo_total: Number(r.custo_total),
          total_manutencoes: Number(r.total_manutencoes),
        })),
        porFornecedor: (fornDataTyped || []).map(r => ({
          nome_fantasia: r.nome_fantasia,
          razao_social: r.razao_social,
          custo_total: Number(r.custo_total),
          total_manutencoes: Number(r.total_manutencoes),
        })),
        ultimasManutencoes: (manutData || []) as ManutencaoWithRelations[],
      })
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!data) return null

  const maxCustoSec = Math.max(...data.porSecretaria.map(s => s.custo_total), 1)
  const maxCustoForn = Math.max(...data.porFornecedor.map(f => f.custo_total), 1)

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral das manutenções da frota municipal" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Custo Total" value={formatCurrency(data.custoTotal)} />
        <KpiCard label="Peças" value={formatCurrency(data.custoPecas)} />
        <KpiCard label="Serviços" value={formatCurrency(data.custoServicos)} />
        <KpiCard label="Manutenções" value={data.totalManutencoes} />
        <KpiCard label="Veículos" value={data.totalVeiculos} />
        <KpiCard label="Ticket Médio" value={formatCurrency(data.ticketMedio)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Custo por Secretaria */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Custo por Secretaria</h3>
          {data.porSecretaria.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum dado encontrado</p>
          ) : (
            <div className="space-y-3">
              {data.porSecretaria.slice(0, 10).map((s) => (
                <div key={s.sigla}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <SecBadge sigla={s.sigla} nome={s.nome} />
                      <span className="text-xs text-gray-500">{s.total_manutencoes} manutenções</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(s.custo_total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(s.custo_total / maxCustoSec) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custo por Fornecedor */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Custo por Fornecedor</h3>
          {data.porFornecedor.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum dado encontrado</p>
          ) : (
            <div className="space-y-3">
              {data.porFornecedor.slice(0, 10).map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm text-gray-700">{f.nome_fantasia || f.razao_social}</span>
                      <span className="text-xs text-gray-400 ml-2">{f.total_manutencoes} manutenções</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(f.custo_total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gray-600 h-2 rounded-full transition-all"
                      style={{ width: `${(f.custo_total / maxCustoForn) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas Manutenções */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Últimas Manutenções</h3>
        {data.ultimasManutencoes.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma manutenção registrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Veículo</th>
                  <th className="pb-2 font-medium">Fornecedor</th>
                  <th className="pb-2 font-medium">Empenho</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.ultimasManutencoes.map((m) => {
                  const v = m.veiculo
                  const f = m.fornecedor
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-2.5">{new Date(m.data_manutencao + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="py-2.5 font-medium">{v?.placa} <span className="font-normal text-gray-500">{v?.modelo}</span></td>
                      <td className="py-2.5">{f?.nome_fantasia || f?.razao_social}</td>
                      <td className="py-2.5 font-mono text-xs">{m.numero_empenho || '-'}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(m.valor_total)}</td>
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
