'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatPlaca } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import type { TipoVeiculo } from '@/types/database'

export default function NovoVeiculoPage() {
  const router = useRouter()
  const [tipos, setTipos] = useState<TipoVeiculo[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [marca, setMarca] = useState('')
  const [anoFab, setAnoFab] = useState('')
  const [anoMod, setAnoMod] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [chassi, setChassi] = useState('')
  const [renavam, setRenavam] = useState('')
  const [combustivel, setCombustivel] = useState('')
  const [cor, setCor] = useState('')
  const [patrimonio, setPatrimonio] = useState('')
  const [obs, setObs] = useState('')

  useEffect(() => {
    supabase.from('tipos_veiculo').select('*').order('nome').then(({ data }) => {
      if (data) setTipos(data)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!placa || !modelo) {
      setError('Placa e modelo são obrigatórios.')
      return
    }

    setSaving(true)
    try {
      const { error: err } = await supabase.from('veiculos').insert({
        placa: formatPlaca(placa),
        modelo,
        marca: marca || null,
        ano_fabricacao: anoFab ? Number(anoFab) : null,
        ano_modelo: anoMod ? Number(anoMod) : null,
        tipo_veiculo_id: tipoId || null,
        chassi: chassi || null,
        renavam: renavam || null,
        combustivel: combustivel || null,
        cor: cor || null,
        patrimonio: patrimonio || null,
        observacoes: obs || null,
      })

      if (err) throw err
      router.push('/veiculos')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Novo Veículo" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
            <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              maxLength={7} placeholder="ABC1234" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={tipoId} onChange={(e) => setTipoId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano Fabricação</label>
            <input type="number" value={anoFab} onChange={(e) => setAnoFab(e.target.value)}
              min="1980" max="2030"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano Modelo</label>
            <input type="number" value={anoMod} onChange={(e) => setAnoMod(e.target.value)}
              min="1980" max="2030"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chassi</label>
            <input type="text" value={chassi} onChange={(e) => setChassi(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RENAVAM</label>
            <input type="text" value={renavam} onChange={(e) => setRenavam(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
            <select value={combustivel} onChange={(e) => setCombustivel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Etanol">Etanol</option>
              <option value="Flex">Flex</option>
              <option value="Diesel">Diesel</option>
              <option value="GNV">GNV</option>
              <option value="Elétrico">Elétrico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <input type="text" value={cor} onChange={(e) => setCor(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patrimônio</label>
            <input type="text" value={patrimonio} onChange={(e) => setPatrimonio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
