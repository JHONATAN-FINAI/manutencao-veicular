'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SecretariaInfo } from '@/lib/secretarias'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
import EmpenhoInput from '@/components/EmpenhoInput'
import type { Veiculo, Fornecedor, Categoria, NotaFiscalForm, ItemNotaFiscalForm } from '@/types/database'

const emptyItem = (): ItemNotaFiscalForm => ({
  descricao: '', codigo_produto: '', quantidade: 1, valor_unitario: 0,
  valor_total: 0, unidade: 'UN', categoria_id: '',
})

const emptyNF = (): NotaFiscalForm => ({
  tipo: 'peca', numero_nf: '', serie: '', chave_acesso: '',
  data_emissao: '', valor_bruto: 0, valor_desconto: 0, valor_liquido: 0,
  natureza_operacao: '', itens: [emptyItem()],
})

export default function NovaManutencaoPage() {
  const router = useRouter()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [veiculoId, setVeiculoId] = useState('')
  const [fornecedorId, setFornecedorId] = useState('')
  const [dataManutencao, setDataManutencao] = useState('')
  const [empenho, setEmpenho] = useState('')
  const [descricao, setDescricao] = useState('')
  const [notas, setNotas] = useState<NotaFiscalForm[]>([emptyNF()])
  const [detectedSec, setDetectedSec] = useState<SecretariaInfo | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('veiculos').select('id, placa, modelo, marca').eq('ativo', true).order('placa'),
      supabase.from('fornecedores').select('id, cnpj, razao_social, nome_fantasia').eq('ativo', true).order('razao_social'),
      supabase.from('categorias').select('*').order('nome'),
    ]).then(([v, f, c]) => {
      if (v.data) setVeiculos(v.data as Veiculo[])
      if (f.data) setFornecedores(f.data as Fornecedor[])
      if (c.data) setCategorias(c.data as Categoria[])
    })
  }, [])

  const handleSecretariaDetected = useCallback((sec: SecretariaInfo | null) => {
    setDetectedSec(sec)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateNota(nfIdx: number, field: keyof NotaFiscalForm, value: any) {
    setNotas(prev => {
      const updated = [...prev]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (updated[nfIdx] as any)[field] = value
      return updated
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateItem(nfIdx: number, itemIdx: number, field: keyof ItemNotaFiscalForm, value: any) {
    setNotas(prev => {
      const updated = [...prev]
      const item = { ...updated[nfIdx].itens[itemIdx] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ; (item as any)[field] = value
      // Recalcula total do item
      if (field === 'quantidade' || field === 'valor_unitario') {
        const qty = field === 'quantidade' ? Number(value) : item.quantidade
        const unit = field === 'valor_unitario' ? Number(value) : item.valor_unitario
        item.valor_total = Math.round(qty * unit * 100) / 100
      }
      updated[nfIdx].itens[itemIdx] = item
      // Recalcula total da NF (bruto)
      const totalItens = updated[nfIdx].itens.reduce((s, i) => s + i.valor_total, 0)
      updated[nfIdx].valor_bruto = Math.round(totalItens * 100) / 100
      // updated[nfIdx].valor_liquido = Math.round((totalItens - updated[nfIdx].valor_desconto) * 100) / 100
      return updated
    })
  }

  function addItem(nfIdx: number) {
    setNotas(prev => {
      const updated = [...prev]
      updated[nfIdx].itens.push(emptyItem())
      return updated
    })
  }

  function removeItem(nfIdx: number, itemIdx: number) {
    setNotas(prev => {
      const updated = [...prev]
      if (updated[nfIdx].itens.length <= 1) return prev
      updated[nfIdx].itens.splice(itemIdx, 1)
      const totalItens = updated[nfIdx].itens.reduce((s, i) => s + i.valor_total, 0)
      updated[nfIdx].valor_bruto = Math.round(totalItens * 100) / 100
      return updated
    })
  }

  function addNota() {
    setNotas(prev => [...prev, emptyNF()])
  }

  function removeNota(idx: number) {
    setNotas(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!veiculoId || !fornecedorId || !dataManutencao) {
      setError('Preencha veículo, fornecedor e data.')
      return
    }

    setSaving(true)
    try {
      // 1. Criar manutenção
      const { data: manut, error: manutErr } = await supabase
        .from('manutencoes')
        .insert({
          veiculo_id: veiculoId,
          fornecedor_id: fornecedorId,
          data_manutencao: dataManutencao,
          numero_empenho: empenho || null,
          descricao: descricao || null,
        })
        .select('id')
        .single()

      if (manutErr || !manut) throw manutErr || new Error('Erro ao criar manutenção')

      // 2. Atualizar secretaria do veículo pelo empenho
      if (detectedSec && empenho) {
        const { data: secDb } = await supabase
          .from('secretarias')
          .select('id')
          .eq('sigla', detectedSec.sigla)
          .single()

        if (secDb) {
          await supabase
            .from('veiculos')
            .update({ secretaria_id: secDb.id })
            .eq('id', veiculoId)
        }
      }

      // 3. Inserir NFs e itens
      for (const nf of notas) {
        if (!nf.numero_nf || !nf.data_emissao) continue

        const { data: nfData, error: nfErr } = await supabase
          .from('notas_fiscais')
          .insert({
            manutencao_id: manut.id,
            tipo: nf.tipo,
            numero_nf: nf.numero_nf,
            serie: nf.serie || null,
            chave_acesso: nf.chave_acesso || null,
            data_emissao: nf.data_emissao,
            valor_bruto: nf.valor_bruto,
            valor_desconto: nf.valor_desconto,
            valor_liquido: nf.valor_liquido,
            natureza_operacao: nf.natureza_operacao || null,
          })
          .select('id')
          .single()

        if (nfErr || !nfData) {
          console.error('Erro NF:', nfErr)
          continue
        }

        // Inserir itens
        const itensInsert = nf.itens
          .filter(i => i.descricao)
          .map(i => ({
            nota_fiscal_id: nfData.id,
            descricao: i.descricao,
            codigo_produto: i.codigo_produto || null,
            quantidade: i.quantidade,
            valor_unitario: i.valor_unitario,
            valor_total: i.valor_total,
            valor_liquido: i.valor_total,
            unidade: i.unidade || 'UN',
            categoria_id: i.categoria_id || null,
          }))

        if (itensInsert.length > 0) {
          await supabase.from('itens_nota_fiscal').insert(itensInsert)
        }
      }

      router.push('/manutencoes')
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Erro ao salvar manutenção'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const totalGeral = notas.reduce((s, nf) => s + nf.valor_liquido, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Nova Manutenção" description="Registro de manutenção com notas fiscais detalhadas" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dados principais */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 border-b pb-2">Dados Gerais</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veículo</label>
              <select
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione...</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.modelo} {v.marca}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione...</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Manutenção</label>
              <input
                type="date"
                value={dataManutencao}
                onChange={(e) => setDataManutencao(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <EmpenhoInput value={empenho} onChange={setEmpenho} onSecretariaDetected={handleSecretariaDetected} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Serviço</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Revisão geral, Troca de óleo..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notas Fiscais */}
        {notas.map((nf, nfIdx) => (
          <div key={nfIdx} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Nota Fiscal #{nfIdx + 1}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${nf.tipo === 'peca' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                  {nf.tipo === 'peca' ? 'Peças / Produtos' : 'Serviços'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={nf.tipo}
                  onChange={(e) => updateNota(nfIdx, 'tipo', e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="peca">Peças</option>
                  <option value="servico">Serviços</option>
                </select>
                {notas.length > 1 && (
                  <button type="button" onClick={() => removeNota(nfIdx)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nº NF</label>
                <input
                  type="text"
                  value={nf.numero_nf}
                  onChange={(e) => updateNota(nfIdx, 'numero_nf', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Série</label>
                <input
                  type="text"
                  value={nf.serie}
                  onChange={(e) => updateNota(nfIdx, 'serie', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Chave de Acesso</label>
                <input
                  type="text"
                  value={nf.chave_acesso}
                  onChange={(e) => updateNota(nfIdx, 'chave_acesso', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Emissão</label>
                <input
                  type="date"
                  value={nf.data_emissao}
                  onChange={(e) => updateNota(nfIdx, 'data_emissao', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor Bruto (R$)</label>
                <input
                  type="number"
                  value={nf.valor_bruto}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={nf.valor_desconto}
                  onChange={(e) => updateNota(nfIdx, 'valor_desconto', Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1">Valor Líquido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={nf.valor_liquido}
                  onChange={(e) => updateNota(nfIdx, 'valor_liquido', Number(e.target.value))}
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Itens */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 font-medium w-64">Descrição / Produto</th>
                      <th className="px-3 py-2 font-medium w-24">Cód.</th>
                      <th className="px-3 py-2 font-medium w-16 text-center">Qtd</th>
                      <th className="px-3 py-2 font-medium w-24">V. Unit</th>
                      <th className="px-3 py-2 font-medium w-24">Total</th>
                      <th className="px-3 py-2 font-medium w-32">Categoria</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {nf.itens.map((item, itemIdx) => (
                      <tr key={itemIdx}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => updateItem(nfIdx, itemIdx, 'descricao', e.target.value)}
                            placeholder="Descrição do item"
                            className="w-full border border-transparent hover:border-gray-200 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.codigo_produto || ''}
                            onChange={(e) => updateItem(nfIdx, itemIdx, 'codigo_produto', e.target.value)}
                            placeholder="Cód"
                            className="w-full border border-gray-200 rounded px-1 py-1 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => updateItem(nfIdx, itemIdx, 'quantidade', Number(e.target.value))}
                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.valor_unitario}
                            onChange={(e) => updateItem(nfIdx, itemIdx, 'valor_unitario', Number(e.target.value))}
                            className="w-full text-right border border-gray-200 rounded px-1 py-1 text-sm"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-700">
                          {formatCurrency(item.valor_total)}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.categoria_id}
                            onChange={(e) => updateItem(nfIdx, itemIdx, 'categoria_id', e.target.value)}
                            className="w-full border border-gray-200 rounded px-1 py-1 text-xs text-gray-600 bg-white"
                          >
                            <option value="">Selecione...</option>
                            {categorias
                              .filter(c => c.tipo === 'ambos' || c.tipo === nf.tipo)
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {nf.itens.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(nfIdx, itemIdx)}
                              className="text-gray-300 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addItem(nfIdx)}
              className="mt-3 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={14} /> Adicionar item
            </button>
          </div>
        ))}

        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={addNota}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Plus size={16} />
            Adicionar Outra Nota Fiscal
          </button>
        </div>

        {/* Resumo e salvar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg lg:static lg:shadow-none lg:border-t-0 lg:bg-transparent lg:p-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Geral da Manutenção</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGeral)}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? 'Salvando...' : 'Salvar Manutenção'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
