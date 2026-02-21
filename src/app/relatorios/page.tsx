'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Calendar, Download, RefreshCcw } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import KpiCard from '@/components/KpiCard'
import type { Manutencao } from '@/types/database'

// Add type for the join
type ManutencaoWithRelations = Manutencao & {
  veiculo: {
    placa: string
    modelo: string
    secretaria: {
      sigla: string
      nome: string
    } | null
  } | null
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ManutencaoWithRelations[]>([])

  // Filters
  const [startDate, setStartDate] = useState(format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  const fetchData = useCallback(async () => {
    // setLoading(true) - Handled by event handlers to avoid effect cascade

    // Fetch maintenances strictly within the date range
    // Note: We use the date filter on the query to minimize data transfer
    const { data: rawData, error } = await supabase
      .from('manutencoes')
      .select(`
        *,
        veiculo:veiculos (
          placa, modelo,
          secretaria:secretarias (sigla, nome)
        )
      `)
      .gte('data_manutencao', startDate)
      .lte('data_manutencao', endDate)
      .order('data_manutencao', { ascending: true })

    if (error) {
      console.error('Error fetching reports:', error)
    } else {
      setData(rawData as unknown as ManutencaoWithRelations[])
    }
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Aggregations with useMemo for performance ---

  const kpis = useMemo(() => {
    const totalCost = data.reduce((sum, m) => sum + m.valor_total, 0)
    const totalParts = data.reduce((sum, m) => sum + m.valor_total_pecas, 0)
    const totalServices = data.reduce((sum, m) => sum + m.valor_total_servicos, 0)
    const totalCount = data.length
    const avgTicket = totalCount > 0 ? totalCost / totalCount : 0

    return { totalCost, totalParts, totalServices, totalCount, avgTicket }
  }, [data])

  const bySecretaria = useMemo(() => {
    const acc: Record<string, { name: string; value: number; count: number }> = {}

    data.forEach(m => {
      const secSigla = m.veiculo?.secretaria?.sigla || 'OUTROS'
      if (!acc[secSigla]) acc[secSigla] = { name: secSigla, value: 0, count: 0 }
      acc[secSigla].value += m.valor_total
      acc[secSigla].count += 1
    })

    return Object.values(acc)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10
  }, [data])

  const byMonth = useMemo(() => {
    const acc: Record<string, { name: string; total: number; pecas: number; servicos: number }> = {}

    data.forEach(m => {
      // Format YYYY-MM for sorting/grouping
      const date = parseISO(m.data_manutencao)
      const key = format(date, 'yyyy-MM')
      const label = format(date, 'MMM/yy', { locale: ptBR })

      if (!acc[key]) acc[key] = { name: label, total: 0, pecas: 0, servicos: 0 }
      acc[key].total += m.valor_total
      acc[key].pecas += m.valor_total_pecas
      acc[key].servicos += m.valor_total_servicos
    })

    return Object.keys(acc).sort().map(k => acc[k])
  }, [data])

  const byCategory = useMemo(() => {
    return [
      { name: 'Peças', value: kpis.totalParts },
      { name: 'Serviços', value: kpis.totalServices }
    ]
  }, [kpis])

  // --- Export Function ---
  const handleExport = () => {
    const csvContent = [
      ['Data', 'Veiculo', 'Secretaria', 'Empenho', 'Pecas', 'Servicos', 'Total'],
      ...data.map(m => [
        m.data_manutencao,
        m.veiculo?.placa || '-',
        m.veiculo?.secretaria?.sigla || '-',
        m.numero_empenho || '-',
        m.valor_total_pecas.toFixed(2),
        m.valor_total_servicos.toFixed(2),
        m.valor_total.toFixed(2)
      ])
    ].map(e => e.join(';')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `relatorio_manutencao_${startDate}_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Dashboard Gerencial" description="Análise analítica de custos e manutenções" />

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setLoading(true) }}
              className="text-sm border-none focus:ring-0 p-0 text-gray-700 w-32"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setLoading(true) }}
              className="text-sm border-none focus:ring-0 p-0 text-gray-700 w-32"
            />
          </div>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => { setLoading(true); fetchData() }}
            title="Atualizar"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={handleExport}
            title="Exportar CSV"
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <RefreshCcw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Carregando dados...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Custo Total"
              value={formatCurrency(kpis.totalCost)}
              sublabel={`${kpis.totalCount} manutenções no período`}
              className="border-l-4 border-l-blue-500 shadow-sm"
            />
            <KpiCard
              label="Ticket Médio"
              value={formatCurrency(kpis.avgTicket)}
              sublabel="Por manutenção"
              className="border-l-4 border-l-cyan-500 shadow-sm"
            />
            <KpiCard
              label="Gasto com Peças"
              value={formatCurrency(kpis.totalParts)}
              sublabel={`${((kpis.totalParts / kpis.totalCost) * 100 || 0).toFixed(1)}% do total`}
              className="border-l-4 border-l-orange-500 shadow-sm"
            />
            <KpiCard
              label="Gasto com Serviços"
              value={formatCurrency(kpis.totalServices)}
              sublabel={`${((kpis.totalServices / kpis.totalCost) * 100 || 0).toFixed(1)}% do total`}
              className="border-l-4 border-l-purple-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Cost by Month */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Evolução Mensal de Custos</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={byMonth}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(v) => `R$ ${v / 1000}k`}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatCurrency(Number(value || 0))}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Parts vs Services */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Peças vs Serviços</h3>
              <div className="h-80 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatCurrency(Number(value || 0))}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Cost by Secretariat */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Custo por Secretaria (Top 10)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySecretaria} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={100}
                      tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatCurrency(Number(value || 0))}
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" name="Custo Total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
