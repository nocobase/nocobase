---
title: "Definição de Collections"
description: "Definição de Collection em plugins NocoBase: defineCollection, extendCollection, fields, convenção do diretório src/server/collections."
keywords: "Collections,defineCollection,extendCollection,tabela de dados,Collection,NocoBase"
---

# Collections

No desenvolvimento de **plugins** NocoBase, a **coleção (tabela de dados)** é um dos conceitos mais importantes. Você pode adicionar ou modificar estruturas de tabelas de dados em **plugins** definindo ou estendendo **coleções**. Diferente das tabelas de dados criadas pela interface de gerenciamento de **fontes de dados**, as **coleções** definidas via código são geralmente tabelas de metadados de nível de sistema e não aparecerão na lista de gerenciamento de **fontes de dados**.

## Definindo Coleções

Seguindo a estrutura de diretórios convencional, os arquivos de **coleção** devem ser colocados no diretório `./src/server/collections`. Use `defineCollection()` para criar novas tabelas e `extendCollection()` para estender tabelas existentes.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Exemplo de Artigos',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Título', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Conteúdo' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

No exemplo acima:

- `name`: Nome da tabela (uma tabela com o mesmo nome será gerada automaticamente no banco de dados).
- `title`: Nome de exibição da tabela na interface.
- `fields`: Coleção de campos, onde cada campo contém atributos como `type`, `name`, etc.

Quando você precisar adicionar campos ou modificar configurações para **coleções** de outros **plugins**, você pode usar `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Após ativar o **plugin**, o sistema adicionará automaticamente o campo `isPublished` à tabela `articles` existente.

:::tip Dica
O diretório convencional será carregado antes que todos os métodos `load()` dos plugins sejam executados, evitando assim problemas de dependência causados por algumas tabelas de dados não carregadas.
:::

## Tipo de campo - referência rápida

No `fields` de `defineCollection`, o `type` determina o tipo de coluna do campo no banco de dados. A seguir estão todos os tipos de campo integrados:

### Texto

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|------------------------|-----------|------------------------|
| `string` | VARCHAR(255) | Texto curto | `length?: number` (comprimento personalizado), `trim?: boolean` |
| `text` | TEXT | Texto longo | `length?: 'tiny' \| 'medium' \| 'long'` (somente MySQL) |

### Números

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|------------------------|-----------|------------------------|
| `integer` | INTEGER | Inteiro | — |
| `bigInt` | BIGINT | Inteiro grande | — |
| `float` | FLOAT | Ponto flutuante | — |
| `double` | DOUBLE | Ponto flutuante de dupla precisão | — |
| `decimal` | DECIMAL(p,s) | Número de ponto fixo | `precision: number`, `scale: number` |

### Booleano

| type | Tipo no banco de dados | Descrição |
|------|------------------------|-----------|
| `boolean` | BOOLEAN | Valor booleano |

### Data e hora

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|------------------------|-----------|------------------------|
| `date` | DATE(3) | Data e hora (com milissegundos) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Somente data, sem hora | — |
| `time` | TIME | Somente hora | — |
| `unixTimestamp` | BIGINT | Timestamp Unix | `accuracy?: 'second' \| 'millisecond'` |

:::tip Dica
`date` é o tipo de data mais usado. Se precisar distinguir o tratamento de fuso horário, também há `datetimeTz` (com fuso) e `datetimeNoTz` (sem fuso) disponíveis.
:::

### Dados estruturados

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|------------------------|-----------|------------------------|
| `json` | JSON / JSONB | Dados JSON | `jsonb?: boolean` (usar JSONB no PostgreSQL) |
| `jsonb` | JSONB / JSON | Prioriza o uso de JSONB | — |
| `array` | ARRAY / JSON | Array | No PostgreSQL pode-se usar o tipo ARRAY nativo |

### Geração de ID

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|------------------------|-----------|------------------------|
| `uid` | VARCHAR(255) | Gera automaticamente um ID curto | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (padrão true) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (padrão 12), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean` (padrão true) |

### Tipos especiais

| type | Tipo no banco de dados | Descrição |
|------|------------------------|-----------|
| `password` | VARCHAR(255) | Armazenamento com hash e salt automáticos |
| `virtual` | Nenhuma coluna real | Campo virtual, não cria coluna no banco de dados |
| `context` | Configurável | Preenchido automaticamente a partir do contexto da requisição (por exemplo, `currentUser.id`) |

### Tipos de associação

Campos de associação não criam colunas no banco de dados, mas estabelecem relações entre tabelas na camada ORM:

| type | Descrição | Parâmetros-chave |
|------|-----------|------------------|
| `belongsTo` | Muitos-para-um | `target` (tabela alvo), `foreignKey` (campo de chave estrangeira) |
| `hasOne` | Um-para-um | `target`, `foreignKey` |
| `hasMany` | Um-para-muitos | `target`, `foreignKey` |
| `belongsToMany` | Muitos-para-muitos | `target`, `through` (tabela intermediária), `foreignKey`, `otherKey` |

Exemplo de uso de campos de associação:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Muitos-para-um: artigo pertence a um autor
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Um-para-muitos: artigo tem múltiplos comentários
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Muitos-para-muitos: artigo tem múltiplas tags
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // nome da tabela intermediária
    },
  ],
});
```

### Parâmetros comuns

Todos os campos de coluna suportam os seguintes parâmetros:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `name` | `string` | Nome do campo (obrigatório) |
| `defaultValue` | `any` | Valor padrão |
| `allowNull` | `boolean` | Se permite null |
| `unique` | `boolean` | Se é único |
| `primaryKey` | `boolean` | Se é chave primária |
| `autoIncrement` | `boolean` | Se é auto-incremento |
| `index` | `boolean` | Se deve criar índice |
| `comment` | `string` | Comentário do campo |

## Sincronizando a Estrutura do Banco de Dados

Quando um **plugin** é ativado pela primeira vez, o sistema sincroniza automaticamente as configurações da **coleção** com a estrutura do banco de dados. Se o **plugin** já estiver instalado e em execução, após adicionar ou modificar **coleções**, você precisará executar manualmente o comando de atualização:

```bash
nb app upgrade
```

Se durante o upgrade do plugin for necessário migrar dados existentes — como renomear campos, dividir tabelas, preencher valores padrão, etc. — isso deve ser feito através de [scripts de Migration](./migration.md), e não alterando o banco de dados manualmente.

## Fazer a Collection aparecer na lista de tabelas de dados da UI

As tabelas definidas via `defineCollection` são tabelas internas do servidor e, por padrão, **não aparecem** na lista de "Gerenciamento de Fontes de Dados", nem na lista de seleção de tabelas de dados ao "Adicionar Bloco".

**Abordagem recomendada**: Adicione a tabela de dados correspondente na interface do NocoBase em "[Gerenciamento de Fontes de Dados](../../data-sources/data-source-main/index.md)", configure os campos e tipos de interface, e a tabela aparecerá automaticamente na lista de seleção de tabelas de dados dos blocos.

![Selecionar sua tabela ao adicionar bloco](https://static-docs.nocobase.com/20260409143839.png)

Se realmente for necessário registrar via código do plugin (por exemplo, em cenários de demonstração de plugins de exemplo), você pode registrar manualmente no plugin do lado do cliente via `addCollection`. Observe que é necessário registrar através do padrão `eventBus`, e não chamar diretamente em `load()` — `ensureLoaded()` vai limpar e reconfigurar todas as collections após `load()`. Para um exemplo completo, consulte [Criar um plugin de gerenciamento de dados com integração frontend-backend](../client/examples/fullstack-plugin.md).

## Geração Automática de Recursos (Resource)

Após definir uma Collection, o NocoBase gerará automaticamente o recurso REST API correspondente, com interfaces CRUD prontas para uso (`list`, `get`, `create`, `update`, `destroy`) sem necessidade de código adicional. Se as operações CRUD integradas não forem suficientes — por exemplo, se você precisar de uma interface de "importação em lote" ou "resumo estatístico" — você pode registrar actions personalizadas via `resourceManager`. Consulte [ResourceManager - Gerenciamento de Recursos](./resource-manager.md).

## Links relacionados

- [Database - Banco de Dados](./database.md) — CRUD, Repository, transações e eventos de banco de dados
- [DataSourceManager - Gerenciamento de Fontes de Dados](./data-source-manager.md) — Gerenciar múltiplas fontes de dados e suas collections
- [Migration - Migração de Dados](./migration.md) — Scripts de migração de dados para upgrade de plugins
- [Plugin](./plugin.md) — Ciclo de vida da classe Plugin, métodos e objeto `app`
- [ResourceManager - Gerenciamento de Recursos](./resource-manager.md) — REST API personalizada e handlers de operações
- [Criar um plugin de gerenciamento de dados com integração frontend-backend](../client/examples/fullstack-plugin.md) — Exemplo completo de defineCollection + addCollection
- [Estrutura de diretórios do projeto](../project-structure.md) — Convenção do diretório `src/server/collections`