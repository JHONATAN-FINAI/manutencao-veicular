# Sistema de Manutenção Veicular - AMTC

Controle de manutenções da frota municipal de Rondonópolis/MT.

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 4
- Supabase (PostgreSQL + Client)
- Lucide React (ícones)

## Setup

### 1. Supabase

Crie um projeto no Supabase e execute o SQL do arquivo `001_schema.sql` no SQL Editor.

### 2. Environment

```bash
cp .env.local.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Funcionalidades

- Dashboard com KPIs e gráficos
- Cadastro de veículos e fornecedores
- Lançamento de manutenções com múltiplas NFs e itens
- Auto-detecção de secretaria pelo código de empenho
- 5 relatórios analíticos via views SQL
