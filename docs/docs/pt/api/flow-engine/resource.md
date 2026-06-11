---
title: "Resource API"
description: "Referência da Resource API do NocoBase FlowEngine: assinaturas completas dos métodos, formatos de parâmetros e sintaxe de filter para MultiRecordResource e SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

O FlowEngine do NocoBase oferece duas classes de Resource para tratar operações de dados no front-end — `MultiRecordResource` para listas/tabelas (vários registros) e `SingleRecordResource` para formulários/detalhes (um único registro). Elas encapsulam chamadas REST API e fornecem gerenciamento reativo de dados.

Cadeia de herança: `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Usada em cenários com múltiplos registros, como listas, tabelas e kanban. Importada de `@nocobase/flow-engine`.

### Operações de dados

| Método | Parâmetros | Descrição |
|------|------|------|
| `getData()` | - | Retorna `TDataItem[]`. Valor inicial `[]`. |
| `hasData()` | - | Indica se o array de dados não está vazio. |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Cria um registro. Por padrão, atualiza automaticamente após a criação. |
| `get(filterByTk)` | `filterByTk: string \| number` | Obtém um único registro pela chave primária. |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Atualiza o registro. Faz refresh automático ao concluir. |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Remove registros. Suporta exclusão em lote. |
| `destroySelectedRows()` | - | Remove todas as linhas selecionadas. |
| `refresh()` | - | Atualiza os dados (chama o Action `list`). Múltiplas chamadas no mesmo event loop são consolidadas. |

### Paginação

| Método | Descrição |
|------|------|
| `getPage()` | Retorna a página atual. |
| `setPage(page)` | Define a página atual. |
| `getPageSize()` | Retorna o número de itens por página (padrão 20). |
| `setPageSize(pageSize)` | Define o número de itens por página. |
| `getCount()` | Retorna o total de registros. |
| `getTotalPage()` | Retorna o total de páginas. |
| `next()` | Vai para a próxima página e atualiza. |
| `previous()` | Vai para a página anterior e atualiza. |
| `goto(page)` | Vai para a página informada e atualiza. |

### Linhas selecionadas

| Método | Descrição |
|------|------|
| `setSelectedRows(rows)` | Define as linhas selecionadas. |
| `getSelectedRows()` | Retorna as linhas selecionadas. |

### Exemplo: usando dentro de um CollectionBlockModel

Ao herdar de `CollectionBlockModel`, é necessário criar a Resource via `createResource()` e ler os dados em `renderComponent()`:

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Declara o uso de MultiRecordResource para gerenciar os dados
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // total de registros

    return (
      <div>
        <h3>Total de {count} registros (página {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

Exemplo completo em [FlowEngine → Extensão de Block](../../plugin-development/client/flow-engine/block.md).

### Exemplo: chamando CRUD em um botão de ação

No handler do `registerFlow` de um `ActionModel`, obtenha a Resource do Block atual via `ctx.blockModel?.resource` e chame os métodos CRUD:

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Obtém a Resource do Block atual
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Cria o registro; após a criação, a Resource faz refresh automaticamente
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Exemplo completo em [Construindo um plugin de gerenciamento de dados full-stack](../../plugin-development/client/examples/fullstack-plugin.md).

### Exemplo: referência rápida de operações CRUD

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Criar ---
  await resource.create({ title: 'New item', completed: false });
  // Sem refresh automático
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Ler ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // total de registros
  const item = await resource.get(1);   // obtém um único registro pela chave primária

  // --- Atualizar ---
  await resource.update(1, { title: 'Updated' });

  // --- Excluir ---
  await resource.destroy(1);            // exclusão individual
  await resource.destroy([1, 2, 3]);    // exclusão em lote

  // --- Paginação ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Ou usando os métodos de atalho
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Atualizar dados ---
  await resource.refresh();
}
```

## SingleRecordResource

Usada em cenários com um único registro, como formulários e páginas de detalhe. Importada de `@nocobase/flow-engine`.

### Operações de dados

| Método | Parâmetros | Descrição |
|------|------|------|
| `getData()` | - | Retorna `TData` (objeto único). Valor inicial `null`. |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Salvamento inteligente — chama `create` quando `isNewRecord` é true; caso contrário chama `update`. |
| `destroy(options?)` | - | Remove o registro atual (usa o `filterByTk` definido). |
| `refresh()` | - | Atualiza os dados (chama o Action `get`). Pulado quando `isNewRecord` é true. |

### Propriedades-chave

| Propriedade | Descrição |
|------|------|
| `isNewRecord` | Indica se o registro é novo. `setFilterByTk()` define automaticamente para `false`. |

### Exemplo: cenário de formulário/detalhe

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // objeto único ou null
    if (!data) return <div>Carregando...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Exemplo: criar e editar registros

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Criar registro ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save chama internamente o Action create e faz refresh automático ao concluir

  // --- Editar registro existente ---
  resource.setFilterByTk(1);  // define automaticamente isNewRecord = false
  await resource.refresh();   // carrega os dados atuais primeiro
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save chama internamente o Action update

  // --- Excluir registro atual ---
  await resource.destroy();   // usa o filterByTk definido
}
```

## Métodos comuns

Os métodos a seguir estão disponíveis tanto em `MultiRecordResource` quanto em `SingleRecordResource`:

### Filtros

| Método | Descrição |
|------|------|
| `setFilter(filter)` | Define o objeto filter diretamente. |
| `addFilterGroup(key, filter)` | Adiciona um grupo de filtro nomeado (recomendado, combinável e removível). |
| `removeFilterGroup(key)` | Remove um grupo de filtro nomeado. |
| `getFilter()` | Retorna o filter agregado. Múltiplos grupos são combinados automaticamente com `$and`. |

### Controle de campos

| Método | Descrição |
|------|------|
| `setFields(fields)` | Define os campos retornados. |
| `setAppends(appends)` | Define os appends de campos relacionais. |
| `addAppends(appends)` | Adiciona appends (com deduplicação). |
| `setSort(sort)` | Define a ordenação, por exemplo `['-createdAt', 'name']`. |
| `setFilterByTk(value)` | Define o filtro pela chave primária. |

### Configuração de Resource

| Método | Descrição |
|------|------|
| `setResourceName(name)` | Define o nome do recurso, por exemplo `'users'` ou um recurso relacional `'users.tags'`. |
| `setSourceId(id)` | Define o ID do registro pai do recurso relacional. |
| `setDataSourceKey(key)` | Define o data source (adiciona o cabeçalho `X-Data-Source` na requisição). |

### Metadados e estado

| Método | Descrição |
|------|------|
| `getMeta(key?)` | Retorna metadados. Sem `key`, retorna todo o objeto meta. |
| `loading` | Indica se está carregando (getter). |
| `getError()` | Retorna a mensagem de erro. |
| `clearError()` | Limpa o erro. |

### Eventos

| Evento | Quando dispara |
|------|----------|
| `'refresh'` | Após `refresh()` obter os dados com sucesso. |
| `'saved'` | Após sucesso de `create` / `update` / `save`. |

```ts
resource.on('saved', (data) => {
  console.log('Registro salvo:', data);
});
```

## Sintaxe de filter

O NocoBase usa uma sintaxe de filtro em estilo JSON, com operadores começando com `$`:

```ts
// igual
{ status: { $eq: 'active' } }

// diferente
{ status: { $ne: 'deleted' } }

// maior que
{ age: { $gt: 18 } }

// contém (correspondência aproximada)
{ name: { $includes: 'test' } }

// combinação E
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// combinação OU
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Na Resource, recomenda-se usar `addFilterGroup` para gerenciar as condições de filtro:

```ts
// Adiciona vários grupos de filtro
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() agrega automaticamente em: { $and: [...] }

// Remove um grupo de filtro
resource.removeFilterGroup('status');

// Atualiza para aplicar os filtros
await resource.refresh();
```

## Comparação entre MultiRecordResource e SingleRecordResource

| Característica | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| Retorno de getData() | `TDataItem[]` (array) | `TData` (objeto único) |
| Action padrão de refresh | `list` | `get` |
| Paginação | Suportada | Não suportada |
| Linhas selecionadas | Suportadas | Não suportadas |
| Criação | `create(data)` | `save(data)` + `isNewRecord=true` |
| Atualização | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Exclusão | `destroy(filterByTk)` | `destroy()` |
| Cenário típico | Listas, tabelas, kanban | Formulários, páginas de detalhe |

## Links relacionados

- [Construindo um plugin de gerenciamento de dados full-stack](../../plugin-development/client/examples/fullstack-plugin.md) — Exemplo completo: uso real de `resource.create()` em um botão de ação personalizado.
- [FlowEngine → Extensão de Block](../../plugin-development/client/flow-engine/block.md) — Uso de `createResource()` e `resource.getData()` em um CollectionBlockModel.
- [Gerenciamento de Resource (server)](../../plugin-development/server/resource-manager.md) — Definição dos recursos REST API no servidor; é exatamente o que a Resource cliente consome.
- [FlowContext API](./flow-context.md) — Descrição de métodos como `ctx.makeResource()` e `ctx.initResource()`.
