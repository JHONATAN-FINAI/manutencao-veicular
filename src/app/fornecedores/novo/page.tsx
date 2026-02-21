'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cleanCNPJ } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'

const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']

export default function NovoFornecedorPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('MT')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cnpjClean = cleanCNPJ(cnpj)
    if (cnpjClean.length !== 14) {
      setError('CNPJ deve ter 14 dígitos.')
      return
    }

    setSaving(true)
    try {
      const { error: err } = await supabase.from('fornecedores').insert({
        cnpj: cnpjClean,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia || null,
        cidade: cidade || null,
        uf: uf || null,
        telefone: telefone || null,
        email: email || null,
      })
      if (err) throw err
      router.push('/fornecedores')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      setError(message.includes('unique') ? 'CNPJ já cadastrado.' : message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Novo Fornecedor" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
            <input type="text" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
            <input type="text" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
            <select value={uf} onChange={(e) => setUf(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {UFS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
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
