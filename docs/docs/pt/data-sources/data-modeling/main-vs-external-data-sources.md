---
title: "Comparação entre banco de dados principal e externo"
description: "Diferenças entre o banco de dados principal e os bancos de dados externos: comparação do suporte a tipos de banco de dados, tipos de tabelas, tipos de campos e recursos de backup, restauração e migração."
keywords: "banco de dados principal,banco de dados externo,comparação de fontes de dados,conexão somente leitura,sincronização de tabelas,NocoBase"
---

# Comparação entre banco de dados principal e externo

As diferenças entre o banco de dados principal e os bancos de dados externos no NocoBase concentram-se principalmente nos quatro aspectos a seguir: suporte a tipos de banco de dados, suporte a tipos de tabelas, suporte a tipos de campos e backup, restauração e migração.

## I. Suporte a tipos de banco de dados

Para mais detalhes, consulte: [Gerenciamento de fontes de dados](https://docs.nocobase.com/data-sources/data-source-manager)

### Tipos de banco de dados

| Tipo de banco de dados | Suporte do banco principal | Suporte do banco externo |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Gerenciamento de tabelas

| Gerenciamento de tabelas | Suporte do banco principal | Suporte do banco externo |
|-----------|-------------|--------------|
| Gerenciamento básico | ✅ | ✅ |
| Gerenciamento visual | ✅ | ❌ |

## II. Suporte a tipos de tabelas

Para mais detalhes, consulte: [Tabelas](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Tipo de tabela | Banco principal | Banco externo | Descrição |
|-----------|---------|-----------|------|
| Tabela comum | ✅ | ✅ | Tabela de dados básica |
| Tabela de visualização | ✅ | ✅ | Visualização da fonte de dados |
| Tabela herdada | ✅ | ❌ | Suporta herança de modelos de dados; somente a fonte de dados principal é compatível |
| Tabela de arquivos | ✅ | ❌ | Suporta o upload de arquivos; somente a fonte de dados principal é compatível |
| Tabela de comentários | ✅ | ❌ | Sistema de comentários integrado; somente a fonte de dados principal é compatível |
| Tabela de calendário | ✅ | ❌ | Tabela de dados usada para visualizações de calendário |
| Tabela de expressões | ✅ | ❌ | Suporta cálculos por fórmula |
| Tabela em árvore | ✅ | ❌ | Usada para a modelagem de dados em estruturas de árvore |
| Tabela SQL | ✅ | ❌ | Tabela de dados que pode ser definida por SQL |
| Tabela de conexão com dados externos | ✅ | ❌ | Tabela de conexão com uma fonte de dados externa, com funcionalidade limitada |

## III. Suporte a tipos de campos

Para mais detalhes, consulte: [Campos da tabela](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Tipos básicos

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Texto de uma linha | ✅ | ✅ |
| Texto de várias linhas | ✅ | ✅ |
| Número de telefone celular | ✅ | ✅ |
| E-mail | ✅ | ✅ |
| URL | ✅ | ✅ |
| Inteiro | ✅ | ✅ |
| Número | ✅ | ✅ |
| Porcentagem | ✅ | ✅ |
| Senha | ✅ | ✅ |
| Cor | ✅ | ✅ |
| Ícone | ✅ | ✅ |

### Tipos de seleção

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Caixa de seleção | ✅ | ✅ |
| Menu suspenso (seleção única) | ✅ | ✅ |
| Menu suspenso (seleção múltipla) | ✅ | ✅ |
| Botão de opção | ✅ | ✅ |
| Caixa de seleção múltipla | ✅ | ✅ |
| Divisões administrativas da China | ✅ | ❌ |

### Tipos multimídia

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Multimídia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Texto rico | ✅ | ✅ |
| Anexo (relação) | ✅ | ❌ |
| Anexo (URL) | ✅ | ✅ |

### Tipos de data e hora

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Data e hora (com fuso horário) | ✅ | ✅ |
| Data e hora (sem fuso horário) | ✅ | ✅ |
| Timestamp Unix | ✅ | ✅ |
| Data (sem hora) | ✅ | ✅ |
| Hora | ✅ | ✅ |

### Tipos geométricos

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Ponto | ✅ | ✅ |
| Linha | ✅ | ✅ |
| Círculo | ✅ | ✅ |
| Polígono | ✅ | ✅ |

### Tipos avançados

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Ordenação | ✅ | ✅ |
| Fórmula de cálculo | ✅ | ✅ |
| Codificação automática | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Seletor de tabelas | ✅ | ❌ |
| Criptografia | ✅ | ✅ |

### Campos de informações do sistema

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Data de criação | ✅ | ✅ |
| Data da última modificação | ✅ | ✅ |
| Criado por | ✅ | ❌ |
| Última modificação por | ✅ | ❌ |
| OID da tabela | ✅ | ❌ |

### Tipos de relações

| Tipo de campo | Banco principal | Banco externo |
|---------|---------|-----------|
| Um para um | ✅ | ✅ |
| Um para muitos | ✅ | ✅ |
| Muitos para um | ✅ | ✅ |
| Muitos para muitos | ✅ | ✅ |
| Muitos para muitos (matriz) | ✅ | ✅ |

:::info
Os campos de anexo dependem da tabela de arquivos, e as tabelas de arquivos são compatíveis apenas com o banco de dados principal. Portanto, os bancos de dados externos não oferecem suporte a campos de anexo no momento.
:::

## IV. Comparação do suporte a backup e migração

| Função | Banco principal | Banco externo |
|-----|---------|-----------|
| Backup e restauração | ✅ | ❌ (deve ser tratado por conta própria) |
| Gerenciamento de migrações | ✅ | ❌ (deve ser tratado por conta própria) |

:::info
O NocoBase oferece recursos de backup, restauração e migração estrutural para o banco de dados principal. Para bancos de dados externos, essas operações devem ser realizadas independentemente pelo usuário, de acordo com o ambiente do próprio banco de dados; o NocoBase não oferece suporte integrado.
:::

## Resumo da comparação

| Item de comparação | Banco principal | Banco externo |
|-------|---------|-----------|
| Tipos de banco de dados | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Suporte a tipos de tabelas | Todos os tipos de tabelas | Somente tabelas comuns e tabelas de visualização |
| Suporte a tipos de campos | Todos os tipos de campos | Todos os tipos de campos, exceto campos de anexo |
| Backup e migração | Suporte integrado | Deve ser tratado por conta própria |

## Recomendação

- **Se você estiver usando o NocoBase para criar um novo sistema de negócios**, use o **banco de dados principal**, pois assim será possível utilizar todos os recursos do NocoBase.
- **Se você estiver usando o NocoBase para conectar-se ao banco de dados de outro sistema e implementar operações básicas de consulta, inclusão, alteração e exclusão de dados**, use um **banco de dados externo**.