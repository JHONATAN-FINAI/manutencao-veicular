// lib/utils.ts — Funções utilitárias

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  if (!date) return ''
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

export function formatPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
