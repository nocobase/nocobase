---
title: "Collections: definição de tabelas de dados"
description: "Definir Collections em plugins NocoBase: defineCollection, extendCollection, fields e a convenção do diretório src/server/collections."
keywords: "Collections,defineCollection,extendCollection,tabelas de dados,definição de Collection,NocoBase"
---

# Coleções

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

:::tip
O diretório convencional será carregado antes que todos os métodos `load()` dos **plugins** sejam executados, evitando assim problemas de dependência causados por algumas tabelas de dados não carregadas.
:::

## Referência Rápida de Tipos de Campo

Em `fields` do `defineCollection`, o `type` determina o tipo da coluna do campo no banco de dados. A seguir estão todos os tipos de campo integrados:

### Texto

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|-----------|------|----------|
| `string` | VARCHAR(255) | Texto curto | `length?: number` (comprimento personalizado), `trim?: boolean` |
| `text` | TEXT | Texto longo | `length?: 'tiny' \| 'medium' \| 'long'` (apenas MySQL) |

### Números

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|-----------|------|----------|
| `integer` | INTEGER | Número inteiro | — |
| `bigInt` | BIGINT | Número inteiro grande | — |
| `float` | FLOAT | Número de ponto flutuante | — |
| `double` | DOUBLE | Ponto flutuante de precisão dupla | — |
| `decimal` | DECIMAL(p,s) | Número de ponto fixo | `precision: number`, `scale: number` |

### Booleanos

| type | Tipo no banco de dados | Descrição |
|------|-----------|------|
| `boolean` | BOOLEAN | Valor booleano |

### Data e Hora

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|-----------|------|----------|
| `date` | DATE(3) | Data e hora (com milissegundos) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Apenas data, sem hora | — |
| `time` | TIME | Apenas hora | — |
| `unixTimestamp` | BIGINT | Timestamp Unix | `accuracy?: 'second' \| 'millisecond'` |

:::tip
`date` é o tipo de data mais usado. Se você precisar diferenciar o tratamento de fuso horário, também estão disponíveis `datetimeTz` (com fuso horário) e `datetimeNoTz` (sem fuso horário).
:::

### Dados Estruturados

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|-----------|------|----------|
| `json` | JSON / JSONB | Dados JSON | `jsonb?: boolean` (usa JSONB no PostgreSQL) |
| `jsonb` | JSONB / JSON | Prioriza o uso de JSONB | — |
| `array` | ARRAY / JSON | Array | No PostgreSQL é possível usar o tipo ARRAY nativo |

### Geração de ID

| type | Tipo no banco de dados | Descrição | Parâmetros específicos |
|------|-----------|------|----------|
| `uid` | VARCHAR(255) | ID curto gerado automaticamente | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (padrão true) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (padrão 12), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | ID Snowflake | `autoFill?: boolean` (padrão true) |

### Tipos Especiais

| type | Tipo no banco de dados | Descrição |
|------|-----------|------|
| `password` | VARCHAR(255) | Armazenado como hash com salt gerado automaticamente |
| `virtual` | Sem coluna real | Campo virtual; nenhuma coluna é criada no banco de dados |
| `context` | Configurável | Preenchido automaticamente a partir do contexto da requisição (por exemplo, `currentUser.id`) |

### Tipos de Relação

Os campos de relação não criam colunas no banco de dados; em vez disso, estabelecem relações entre tabelas na camada ORM:

| type | Descrição | Parâmetros principais |
|------|------|----------|
| `belongsTo` | Muitos para um | `target` (tabela de destino), `foreignKey` (campo de chave estrangeira) |
| `hasOne` | Um para um | `target`, `foreignKey` |
| `hasMany` | Um para muitos | `target`, `foreignKey` |
| `belongsToMany` | Muitos para muitos | `target`, `through` (tabela intermediária), `foreignKey`, `otherKey` |

Exemplo de uso dos campos de relação:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Muitos para um: o artigo pertence a um autor
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Um para muitos: o artigo tem vários comentários
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Muitos para muitos: o artigo tem várias tags
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // nome da tabela intermediária
    },
  ],
});
```

### Parâmetros Comuns

Todos os campos de coluna suportam os seguintes parâmetros:

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `name` | `string` | Nome do campo (obrigatório) |
| `defaultValue` | `any` | Valor padrão |
| `allowNull` | `boolean` | Se permite null |
| `unique` | `boolean` | Se o valor deve ser único |
| `primaryKey` | `boolean` | Se é chave primária |
| `autoIncrement` | `boolean` | Se é autoincremento |
| `index` | `boolean` | Se cria índice |
| `comment` | `string` | Comentário do campo |

## Sincronizando a Estrutura do Banco de Dados

Quando um **plugin** é ativado pela primeira vez, o sistema sincroniza automaticamente as configurações da **coleção** com a estrutura do banco de dados. Se o **plugin** já estiver instalado e em execução, após adicionar ou modificar **coleções**, você precisará executar manualmente o comando de atualização:

```bash
yarn nocobase upgrade
```

## Fazendo uma Coleção Aparecer na Lista de Tabelas de Dados da Interface

As tabelas definidas via `defineCollection` são tabelas internas do servidor e, por padrão, **não aparecem** na lista do gerenciamento de fontes de dados, nem na lista de seleção de tabelas de dados ao adicionar um bloco.

**Abordagem recomendada**: adicione a tabela de dados correspondente em "[Gerenciamento de fontes de dados](../../data-sources/data-source-main/index.md)" na interface do NocoBase. Depois de configurar os campos e os tipos de interface, a tabela aparecerá automaticamente na lista de seleção de tabelas de dados do bloco.

![Possível selecionar a própria tabela ao adicionar um bloco](https://static-docs.nocobase.com/20260409143839.png)

Se você realmente precisar registrar pelo código do **plugin** (por exemplo, em cenários de demonstração de **plugins** de exemplo), pode registrar manualmente via `addCollection` no **plugin** do cliente. Observe que o registro precisa ser feito através do padrão `eventBus` e não pode ser chamado diretamente em `load()` — o `ensureLoaded()` limpa e redefine todas as coleções depois do `load()`. Veja o exemplo completo em [Construir um plugin de gestão de dados com integração front-back](../client/examples/fullstack-plugin.md).

## Geração Automática de Recursos (Resource)

Após definir uma **coleção**, o sistema gerará automaticamente um Recurso (Resource) correspondente, no qual você pode executar operações CRUD diretamente via API. Veja [Gerenciador de Recursos](./resource-manager.md).

## Links relacionados

- [Database](./database.md) — CRUD, Repository, transações e eventos do banco de dados
- [DataSourceManager](./data-source-manager.md) — gerenciamento de várias fontes de dados e suas coleções
- [Migration](./migration.md) — scripts de migração de dados para upgrades de **plugins**
- [Plugin](./plugin.md) — ciclo de vida da classe Plugin, métodos membros e o objeto `app`
- [ResourceManager](./resource-manager.md) — APIs REST personalizadas e handlers de operações
- [Construir um plugin de gestão de dados com integração front-back](../client/examples/fullstack-plugin.md) — exemplo completo com defineCollection + addCollection
- [Estrutura do Projeto](../project-structure.md) — explicação da convenção do diretório `src/server/collections`
