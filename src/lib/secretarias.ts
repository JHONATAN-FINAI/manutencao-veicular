// lib/secretarias.ts — Mapeamento código empenho → secretaria

export interface SecretariaInfo {
  sigla: string
  nome: string
}

// Primeiros 4 dígitos do empenho → secretaria
export const SECRETARIAS_MAP: Record<string, SecretariaInfo> = {
  '2001': { sigla: 'SEGOV', nome: 'Secretaria Municipal de Governo' },
  '2002': { sigla: 'PGM/PROCON', nome: 'Procuradoria Geral do Município / PROCON' },
  '2004': { sigla: 'SMR', nome: 'Secretaria Municipal da Receita' },
  '2006': { sigla: 'SMTT', nome: 'Secretaria Municipal de Trânsito e Transporte' },
  '2009': { sigla: 'SMDE', nome: 'Secretaria Municipal de Desenvolvimento Econômico' },
  '2010': { sigla: 'SMPAS', nome: 'Secretaria Municipal de Promoção e Assistência Social' },
  '2011': { sigla: 'SME', nome: 'Secretaria Municipal de Educação' },
  '2013': { sigla: 'SMPAS', nome: 'Secretaria Municipal de Promoção e Assistência Social' },
  '2014': { sigla: 'SMS', nome: 'Secretaria Municipal de Saúde' },
  '2015': { sigla: 'SMA', nome: 'Secretaria Municipal de Administração' },
  '2016': { sigla: 'SMEL', nome: 'Secretaria Municipal de Esporte e Lazer' },
  '2017': { sigla: 'SMINFRA', nome: 'Secretaria Municipal de Infraestrutura' },
  '2018': { sigla: 'SMAGRI', nome: 'Secretaria Municipal de Agricultura' },
  '2019': { sigla: 'SMMA', nome: 'Secretaria Municipal de Meio Ambiente' },
  '2021': { sigla: 'GASP', nome: 'Gabinete de Ações Estratégicas e Planejamento' },
  '2022': { sigla: 'SMHU', nome: 'Secretaria Municipal de Habitação e Urbanismo' },
  '2023': { sigla: 'SMC', nome: 'Secretaria Municipal de Cultura' },
  '2024': { sigla: 'SMGP', nome: 'Secretaria Municipal de Gestão de Pessoas' },
  '2025': { sigla: 'GCS', nome: 'Gabinete de Comunicação Social' },
  '2026': { sigla: 'SMCT', nome: 'Secretaria Municipal de Ciência e Tecnologia' },
}

/**
 * Extrai os 4 primeiros dígitos do empenho e retorna a secretaria correspondente.
 * Ex: "2001000037/2026" → { sigla: 'SEGOV', nome: '...' }
 */
export function getSecretariaByEmpenho(empenho: string): SecretariaInfo | null {
  if (!empenho || empenho.length < 4) return null
  const codigo = empenho.substring(0, 4)
  return SECRETARIAS_MAP[codigo] || null
}
