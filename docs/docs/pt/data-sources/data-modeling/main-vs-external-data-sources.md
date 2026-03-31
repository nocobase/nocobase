:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Comparativo: Bancos de Dados Principal e Externos

As diferenças entre os bancos de dados principal e externos no NocoBase se manifestam principalmente em quatro aspectos: suporte a tipos de banco de dados, suporte a tipos de coleção, suporte a tipos de campo e recursos de backup e migração.

## 1. Suporte a Tipos de Banco de Dados

Para mais detalhes, consulte: [Gerenciamento de Fontes de Dados](https://docs.nocobase.com/data-sources/data-source-manager)

### Tipos de Banco de Dados

| Tipo de Banco de Dados | Suporte ao Banco de Dados Principal | Suporte ao Banco de Dados Externo |
|------------------|---------------------------|------------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Gerenciamento de Coleções

| Gerenciamento de Coleções | Suporte ao Banco de Dados Principal | Suporte ao Banco de Dados Externo |
|----------------------|-----------------------------|------------------------------|
| Gerenciamento Básico | ✅ | ✅ |
| Gerenciamento Visual | ✅ | ❌ |

## 2. Suporte a Tipos de Coleção

Para mais detalhes, consulte: [Coleções](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Tipo de Coleção | Banco de Dados Principal | Banco de Dados Externo | Descrição |
|----------------|-------------------|---------------------|-------------|
| Geral | ✅ | ✅ | Coleção básica |
| Visualização | ✅ | ✅ | Visualização de fonte de dados |
| Herança | ✅ | ❌ | Suporta herança de modelo de dados, apenas para o banco de dados principal |
| Arquivo | ✅ | ❌ | Suporta upload de arquivos, apenas para o banco de dados principal |
| Comentário | ✅ | ❌ | Sistema de comentários integrado, apenas para o banco de dados principal |
| Calendário | ✅ | ❌ | Coleção para visualizações de calendário |
| Expressão | ✅ | ❌ | Suporta cálculos de fórmula |
| Árvore | ✅ | ❌ | Para modelagem de dados em estrutura de árvore |
| SQL | ✅ | ❌ | Coleção definida via SQL |
| Conexão Externa | ✅ | ❌ | Coleção de conexão para fontes de dados externas, com funcionalidade limitada |

## 3. Suporte a Tipos de Campo

Para mais detalhes, consulte: [Campos de Coleção](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Tipos Básicos

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Texto de Linha Única | ✅ | ✅ |
| Texto Longo | ✅ | ✅ |
| Telefone | ✅ | ✅ |
| E-mail | ✅ | ✅ |
| URL | ✅ | ✅ |
| Inteiro | ✅ | ✅ |
| Número | ✅ | ✅ |
| Porcentagem | ✅ | ✅ |
| Senha | ✅ | ✅ |
| Cor | ✅ | ✅ |
| Ícone | ✅ | ✅ |

### Tipos de Escolha

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Caixa de Seleção | ✅ | ✅ |
| Menu Suspenso (Seleção Única) | ✅ | ✅ |
| Menu Suspenso (Múltipla Seleção) | ✅ | ✅ |
| Botão de Rádio | ✅ | ✅ |
| Grupo de Caixas de Seleção | ✅ | ✅ |
| Região da China | ✅ | ❌ |

### Tipos de Mídia

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Mídia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Texto Rico | ✅ | ✅ |
| Anexo (Associação) | ✅ | ❌ |
| Anexo (URL) | ✅ | ✅ |

### Tipos de Data e Hora

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Data e Hora (com fuso horário) | ✅ | ✅ |
| Data e Hora (sem fuso horário) | ✅ | ✅ |
| Timestamp Unix | ✅ | ✅ |
| Data (sem hora) | ✅ | ✅ |
| Hora | ✅ | ✅ |

### Tipos Geométricos

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Ponto | ✅ | ✅ |
| Linha | ✅ | ✅ |
| Círculo | ✅ | ✅ |
| Polígono | ✅ | ✅ |

### Tipos Avançados

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Ordenação | ✅ | ✅ |
| Fórmula | ✅ | ✅ |
| Sequência | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Seletor de Coleção | ✅ | ❌ |
| Criptografia | ✅ | ✅ |

### Campos de Informações do Sistema

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Data de Criação | ✅ | ✅ |
| Última Atualização | ✅ | ✅ |
| Criado por | ✅ | ❌ |
| Última Atualização por | ✅ | ❌ |
| OID da Tabela | ✅ | ❌ |

### Tipos de Associação

| Tipo de Campo | Banco de Dados Principal | Banco de Dados Externo |
|-----------|----------------|-------------------|
| Um-para-um | ✅ | ✅ |
| Um-para-muitos | ✅ | ✅ |
| Muitos-para-um | ✅ | ✅ |
| Muitos-para-muitos | ✅ | ✅ |
| Muitos-para-muitos (array) | ✅ | ✅ |

:::info
Os campos de anexo dependem de coleções de arquivo, que são suportadas apenas pelo banco de dados principal. Portanto, os bancos de dados externos não oferecem suporte a campos de anexo no momento.
:::

## 4. Comparativo de Suporte a Backup e Migração

| Funcionalidade | Banco de Dados Principal | Banco de Dados Externo |
|-----|---------|-----------|
| Backup e Restauração | ✅ | ❌ (Gerenciado pelo usuário) |
| Gerenciamento de Migração | ✅ | ❌ (Gerenciado pelo usuário) |

:::info
O NocoBase oferece recursos de backup, restauração e migração de estrutura para o banco de dados principal. Para bancos de dados externos, essas operações precisam ser realizadas independentemente pelos usuários, de acordo com seus próprios ambientes de banco de dados. O NocoBase não oferece suporte integrado para isso.
:::

## Resumo Comparativo

| Item de Comparação | Banco de Dados Principal | Banco de Dados Externo |
|----------------|-------------------|---------------------|
| Tipos de Banco de Dados | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Suporte a Tipos de Coleção | Todos os tipos de coleção | Apenas coleções gerais e de visualização |
| Suporte a Tipos de Campo | Todos os tipos de campo | Todos os tipos de campo, exceto campos de anexo |
| Backup e Migração | Suporte integrado | Gerenciado pelo usuário |

## Recomendações

- Se você estiver usando o NocoBase para construir um **novo sistema de negócios**, utilize o **banco de dados principal**. Isso permitirá que você aproveite a funcionalidade completa do NocoBase.
- Se você estiver usando o NocoBase para se conectar a bancos de dados de outros sistemas para realizar **operações CRUD básicas**, então utilize **bancos de dados externos**.