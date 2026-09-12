---
title: "Extensão de blocos"
description: "Desenvolvimento de extensões de bloco no NocoBase: classes base BlockModel, DataBlockModel, CollectionBlockModel, TableBlockModel e formas de registro."
keywords: "extensão de blocos,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Extensão de blocos

No NocoBase, **blocos (Blocks)** são as áreas de conteúdo da página — tabelas, formulários, gráficos, detalhes etc. Herdando as classes base da família BlockModel, você pode criar blocos personalizados e registrá-los no menu "Adicionar bloco".

## Escolha de classe base

O NocoBase oferece três classes base de bloco; escolha conforme suas necessidades de dados:

| Classe base            | Hierarquia                            | Cenários de uso                            |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel`           | Bloco mais básico                     | Bloco de exibição que não precisa de fonte de dados |
| `DataBlockModel`       | Herda de `BlockModel`                 | Precisa de dados, mas não vinculado a uma data table do NocoBase |
| `CollectionBlockModel` | Herda de `DataBlockModel`             | Vinculado a uma data table do NocoBase, busca dados automaticamente |
| `TableBlockModel`      | Herda de `CollectionBlockModel`       | Bloco de tabela completo, com colunas, barra de ações, paginação etc. |

A cadeia de herança é: `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

Em geral, se você quer um bloco de tabela pronto para usar, use `TableBlockModel` diretamente — ele já vem com colunas, barra de ações, paginação, ordenação e outras capacidades completas, sendo a classe base mais utilizada. Se precisa personalizar totalmente a renderização (por exemplo, lista de cards, timeline etc.), use `CollectionBlockModel` e escreva seu próprio `renderComponent`. Se for apenas exibir conteúdo estático ou UI personalizada, basta `BlockModel`.

`DataBlockModel` tem um papel especial — ele não adiciona novas propriedades ou métodos; o corpo da classe é vazio. Sua função é **identificação de categoria**: blocos que herdam de `DataBlockModel` são agrupados sob o menu "Blocos de dados" na UI. Se o seu bloco precisa gerenciar a busca de dados por conta própria (sem passar pelo binding padrão de Collection do NocoBase), pode herdar de `DataBlockModel`. Por exemplo, o `ChartBlockModel` do plugin de gráficos é assim — ele usa um `ChartResource` personalizado para buscar dados, sem precisar do binding padrão de data table. Na maioria dos cenários, você não precisa usar `DataBlockModel` diretamente; `CollectionBlockModel` ou `TableBlockModel` são suficientes.

## Exemplo de BlockModel

Um bloco simples — que permite editar conteúdo HTML:

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Esse exemplo cobre os três passos do desenvolvimento de blocos:

1. **`renderComponent()`** — renderiza a UI do bloco, lendo as propriedades via `this.props`
2. **`define()`** — define o nome exibido do bloco no menu "Adicionar bloco"
3. **`registerFlow()`** — adiciona o painel de configuração visual; o usuário pode editar o conteúdo HTML pela interface

## Exemplo de CollectionBlockModel

Se o bloco precisa estar vinculado a uma data table do NocoBase, use `CollectionBlockModel`. Ele cuida automaticamente da busca de dados:

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // 声明这是一个多条记录的区块
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>数据表区块</h3>
        {/* resource.getData() 获取数据表的数据 */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

Em comparação ao `BlockModel`, o `CollectionBlockModel` adiciona:

- **`static scene`** — declara o cenário do bloco. Valores comuns: `BlockSceneEnum.many` (lista de múltiplos registros), `BlockSceneEnum.one` (detalhe/formulário de um registro). Os enums completos incluem `new`, `select`, `filter`, `subForm`, `bulkEditForm` etc.
- **`createResource()`** — cria o recurso de dados; `MultiRecordResource` é usado para buscar múltiplos registros
- **`this.resource.getData()`** — obtém os dados da data table

## Exemplo de TableBlockModel

`TableBlockModel` herda de `CollectionBlockModel` e é o bloco de tabela completo embutido no NocoBase — com colunas, barra de ações, paginação, ordenação e outras capacidades. Quando o usuário escolhe "Table" em "Adicionar bloco", está usando essa classe.

Em geral, se o `TableBlockModel` embutido já atende às necessidades, o usuário pode adicioná-lo diretamente pela interface, e o desenvolvedor não precisa fazer nada. Você só precisa herdar dele quando quiser **personalizar sobre o TableBlockModel** — por exemplo:

- Sobrescrever `customModelClasses` para substituir os modelos integrados de grupo de ações ou colunas de campo
- Usar `filterCollection` para limitar o uso a apenas certas data tables
- Registrar Flows adicionais para acrescentar itens de configuração personalizados

```tsx
// 示例：限制只对 todoItems 数据表可用的表格区块
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Um exemplo completo de personalização de `TableBlockModel` está em [Construir um plugin de gestão de dados com integração front-back](../examples/fullstack-plugin).

## Registrando o bloco

No `load()` do Plugin, registre:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

Após o registro, ao clicar em "Adicionar bloco" na interface do NocoBase, você verá seus blocos personalizados.

## Código-fonte completo

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — exemplo de BlockModel
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — exemplo de CollectionBlockModel

## Links relacionados

- [Hands-on: criar um bloco de exibição personalizado](../examples/custom-block) — montar do zero um BlockModel configurável
- [Hands-on: plugin de gestão de dados com integração front-back](../examples/fullstack-plugin) — exemplo completo combinando TableBlockModel + campos personalizados + ações personalizadas
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel e registerFlow
- [Extensão de campos](./field) — componentes de campo personalizados
- [Extensão de ações](./action) — botões de ação personalizados
- [Resumo da Resource API](../../../api/flow-engine/resource.md) — assinaturas completas dos métodos de MultiRecordResource / SingleRecordResource
- [FlowDefinition (definição de fluxo)](../../../flow-engine/definitions/flow-definition.md) — parâmetros completos e tipos de eventos do registerFlow
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa
