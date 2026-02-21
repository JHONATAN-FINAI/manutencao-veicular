'use client'

import { useEffect } from 'react'
import { getSecretariaByEmpenho, SecretariaInfo } from '@/lib/secretarias'

interface EmpenhoInputProps {
  value: string
  onChange: (value: string) => void
  onSecretariaDetected?: (sec: SecretariaInfo | null) => void
}

export default function EmpenhoInput({ value, onChange, onSecretariaDetected }: EmpenhoInputProps) {
  // Derived state (no useEffect needed for simple sync calculations)
  const detected = (value && value.length >= 4) ? getSecretariaByEmpenho(value) : null
  const showWarning = !!(value && value.length >= 4 && !detected)

  // Notify parent only when detection changes (using useEffect to avoid render loop)
  useEffect(() => {
    onSecretariaDetected?.(detected)
  }, [detected, onSecretariaDetected])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Número do Empenho
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="2001000037/2026"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {detected && (
        <div className="mt-1.5 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-1.5 border border-green-200">
          <span className="font-semibold">{detected.sigla}</span>
          <span className="text-green-600">— {detected.nome}</span>
        </div>
      )}
      {showWarning && (
        <div className="mt-1.5 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-1.5 border border-amber-200">
          Código de empenho não reconhecido
        </div>
      )}
    </div>
  )
}
