// types/database.ts — Tipos do sistema de manutenção veicular AMTC

export interface Secretaria {
  id: string
  nome: string
  sigla: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface TipoVeiculo {
  id: string
  nome: string
  created_at: string
}

export interface Veiculo {
  id: string
  placa: string
  modelo: string
  marca: string | null
  ano_fabricacao: number | null
  ano_modelo: number | null
  tipo_veiculo_id: string | null
  secretaria_id: string | null
  chassi: string | null
  renavam: string | null
  combustivel: string | null
  cor: string | null
  patrimonio: string | null
  ativo: boolean
  observacoes: string | null
  created_at: string
  updated_at: string
  // joins
  tipo_veiculo?: TipoVeiculo
  secretaria?: Secretaria
}

export interface Fornecedor {
  id: string
  cnpj: string
  razao_social: string
  nome_fantasia: string | null
  inscricao_municipal: string | null
  inscricao_estadual: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  telefone: string | null
  email: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: string
  nome: string
  tipo: 'peca' | 'servico' | 'ambos'
  created_at: string
}

export interface Manutencao {
  id: string
  veiculo_id: string
  fornecedor_id: string
  data_manutencao: string
  numero_empenho: string | null
  descricao: string | null
  valor_total_pecas: number
  valor_total_servicos: number
  valor_total: number
  observacoes: string | null
  created_at: string
  updated_at: string
  // joins
  veiculo?: Veiculo
  fornecedor?: Fornecedor
  notas_fiscais?: NotaFiscal[]
}

export interface NotaFiscal {
  id: string
  manutencao_id: string
  tipo: 'peca' | 'servico'
  numero_nf: string
  serie: string | null
  chave_acesso: string | null
  codigo_autenticidade: string | null
  data_emissao: string
  valor_bruto: number
  valor_desconto: number
  valor_liquido: number
  valor_issqn: number
  valor_inss: number
  valor_irrf: number
  valor_pis: number
  valor_cofins: number
  valor_csll: number
  base_calculo_icms: number
  valor_icms: number
  natureza_operacao: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
  // joins
  itens?: ItemNotaFiscal[]
}

export interface ItemNotaFiscal {
  id: string
  nota_fiscal_id: string
  codigo_produto: string | null
  descricao: string
  ncm: string | null
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  valor_desconto: number
  valor_liquido: number | null
  percentual_desconto: number
  cfop: string | null
  cst: string | null
  item_servico: string | null
  aliquota_issqn: number
  categoria_id: string | null
  created_at: string
  // joins
  categoria?: Categoria
}

// Form types
export interface ManutencaoForm {
  veiculo_id: string
  fornecedor_id: string
  data_manutencao: string
  numero_empenho: string
  descricao: string
  observacoes: string
}

export interface NotaFiscalForm {
  tipo: 'peca' | 'servico'
  numero_nf: string
  serie: string
  chave_acesso: string
  data_emissao: string
  valor_bruto: number
  valor_desconto: number
  valor_liquido: number
  natureza_operacao: string
  itens: ItemNotaFiscalForm[]
}

export interface ItemNotaFiscalForm {
  descricao: string
  codigo_produto: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  unidade: string
  categoria_id: string
}

export interface VeiculoForm {
  placa: string
  modelo: string
  marca: string
  ano_fabricacao: number | null
  ano_modelo: number | null
  tipo_veiculo_id: string
  chassi: string
  renavam: string
  combustivel: string
  cor: string
  patrimonio: string
  observacoes: string
}

export interface FornecedorForm {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  cidade: string
  uf: string
  telefone: string
  email: string
}
