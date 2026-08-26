---
title: "Visão geral do FlowEngine"
description: "Guia de desenvolvimento de plugins NocoBase com FlowEngine: uso básico do FlowModel, renderComponent, registerFlow, configuração de uiSchema e seleção de classes base."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

No NocoBase, o **FlowEngine (motor de fluxos)** é o motor que impulsiona a configuração visual. Os blocos, campos e botões de ação na interface do NocoBase são todos gerenciados pelo FlowEngine — incluindo a renderização, o painel de configuração e a persistência das configurações.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Para quem desenvolve plugins, o FlowEngine oferece dois conceitos centrais:

- **FlowModel** — modelo de componente configurável, responsável por renderizar a UI e gerenciar as props
- **Flow** — fluxo de configuração, define o painel de configuração do componente e a lógica de processamento de dados

Se o seu componente precisa aparecer no menu "Adicionar bloco / campo / ação" ou precisa permitir que o usuário faça configuração visual na interface, você precisa envolvê-lo com FlowModel. Se essas capacidades não forem necessárias, basta um componente React comum — veja [Component vs FlowModel](../component-vs-flow-model).

## O que é o FlowModel

Diferente de um componente React comum, além de renderizar a UI, o FlowModel também gerencia a origem das props, a definição do painel de configuração e a persistência da configuração. Em resumo: as props de um componente comum são fixas; as props de um FlowModel são geradas dinamicamente por meio do Flow.

Para entender mais a fundo a arquitetura do FlowEngine, consulte a [documentação completa do FlowEngine](../../../flow-engine/index.md). A seguir, apresentamos o uso sob a perspectiva de quem desenvolve plugins.

## Exemplo mínimo

Da criação ao registro, um FlowModel envolve três passos:

### 1. Herdar a classe base e implementar renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>这是一个自定义区块。</p>
      </div>
    );
  }
}

// define() 设置菜单里的显示名
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` é o método de renderização desse modelo, similar ao `render()` de um componente React. `tExpr()` é usado para tradução adiada — porque `define()` é executado no momento de carregamento do módulo, quando o i18n ainda não está inicializado. Para detalhes, veja [Capacidades comuns do Context → tExpr](../ctx/common-capabilities#texpr).

### 2. Registrar no Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // 按需加载，首次用到时才加载模块
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Usar na interface

Após o registro, inicie o plugin (a ativação do plugin pode ser consultada na [Visão geral do desenvolvimento de plugins](../../index.md)). Crie uma nova página na interface do NocoBase e clique em "Adicionar bloco" — você verá seu "Hello block".

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Adicionando itens de configuração com registerFlow

Apenas conseguir renderizar não é suficiente — o valor central do FlowModel está em ser **configurável**. Com `registerFlow()`, você adiciona um painel de configuração ao modelo, permitindo que o usuário modifique propriedades pela interface.

Por exemplo, um bloco que suporta editar conteúdo HTML:

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // this.props 的值来自 Flow handler 的设置
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // 渲染前执行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema 定义配置面板的 UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 默认值
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // handler 里把配置面板的值设置到 model 的 props 上
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Pontos-chave:

- **`on: 'beforeRender'`** — indica que esse Flow é executado antes da renderização; os valores do painel de configuração são gravados em `this.props` antes de renderizar
- **`uiSchema`** — define a UI do painel de configuração no formato JSON Schema; consulte a sintaxe em [UI Schema](../../../flow-engine/ui-schema)
- **`handler(ctx, params)`** — `params` são os valores preenchidos pelo usuário no painel de configuração; use `ctx.model.props` para gravá-los no modelo
- **`defaultParams`** — valores padrão do painel de configuração

## Usos comuns de uiSchema

`uiSchema` é baseado em JSON Schema. A v2 é compatível com a sintaxe de uiSchema, mas o cenário de uso é limitado — principalmente nos painéis de configuração de Flow para descrever a UI de formulário. Para a maior parte da renderização de componentes em tempo de execução, é recomendado usar diretamente componentes Antd, sem passar por uiSchema.

A seguir, alguns dos componentes mais comuns (referência completa em [UI Schema](../../../flow-engine/ui-schema)):

```ts
uiSchema: {
  // 文本输入
  title: {
    type: 'string',
    title: '标题',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // 多行文本
  content: {
    type: 'string',
    title: '内容',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // 下拉选择
  type: {
    type: 'string',
    title: '类型',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: '主要', value: 'primary' },
      { label: '默认', value: 'default' },
      { label: '虚线', value: 'dashed' },
    ],
  },
  // 开关
  bordered: {
    type: 'boolean',
    title: '显示边框',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Cada campo é envolvido por `'x-decorator': 'FormItem'`, que automaticamente fornece título e layout.

## Parâmetros de define()

`FlowModel.define()` define os metadados do modelo, controlando como ele aparece nos menus. No desenvolvimento de plugins, o mais usado é `label`, mas há mais parâmetros disponíveis:

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `label` | `string \| ReactNode` | Nome exibido no menu "Adicionar bloco / campo / ação"; aceita `tExpr()` para tradução adiada |
| `icon` | `ReactNode` | Ícone no menu |
| `sort` | `number` | Peso de ordenação; quanto menor, mais à frente. Padrão `0` |
| `hide` | `boolean \| (ctx) => boolean` | Se deve ser ocultado no menu; aceita avaliação dinâmica |
| `group` | `string` | Identificador de agrupamento, usado para classificar em um grupo de menu específico |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Itens de submenu; aceita função assíncrona para construção dinâmica |
| `toggleable` | `boolean \| (model) => boolean` | Se suporta comportamento de alternância (único entre irmãos do mesmo pai) |
| `searchable` | `boolean` | Se o submenu habilita pesquisa |

A maioria dos plugins precisa apenas definir `label`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Se precisar controlar a ordem ou ocultação, adicione `sort` e `hide`:

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // 排在后面
  hide: (ctx) => !ctx.someCondition,  // 条件隐藏
});
```

## Escolha de classe base do FlowModel

O NocoBase oferece várias classes base de FlowModel; escolha conforme o tipo que você quer estender:

| Classe base            | Uso                                | Documentação detalhada |
| ---------------------- | ---------------------------------- | ---------------------- |
| `BlockModel`           | Bloco comum                        | [Extensão de blocos](./block) |
| `DataBlockModel`       | Bloco que precisa buscar dados por conta própria | [Extensão de blocos](./block) |
| `CollectionBlockModel` | Vinculado a uma data table, busca dados automaticamente | [Extensão de blocos](./block) |
| `TableBlockModel`      | Bloco de tabela completo, com colunas, barra de ações etc. | [Extensão de blocos](./block) |
| `FieldModel`           | Componente de campo                | [Extensão de campos](./field) |
| `ActionModel`          | Botão de ação                      | [Extensão de ações](./action) |

Em geral, para um bloco de tabela use `TableBlockModel` (o mais comum, pronto para uso); se precisar de renderização totalmente personalizada, use `CollectionBlockModel` ou `BlockModel`; para campos use `FieldModel`; e para botões de ação use `ActionModel`.

## Links relacionados

- [Extensão de blocos](./block) — desenvolver blocos com a família BlockModel
- [Extensão de campos](./field) — desenvolver campos personalizados com FieldModel
- [Extensão de ações](./action) — desenvolver botões de ação com ActionModel
- [Component vs FlowModel](../component-vs-flow-model) — não tem certeza de qual usar?
- [FlowDefinition (definição de fluxo)](../../../flow-engine/definitions/flow-definition.md) — descrição completa dos parâmetros de registerFlow e lista de tipos de eventos
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
- [Início rápido do FlowEngine](../../../flow-engine/quickstart) — construir um botão orquestrável do zero
- [Visão geral do desenvolvimento de plugins](../../index.md) — apresentação geral do desenvolvimento de plugins
- [UI Schema](../../../flow-engine/ui-schema) — referência da sintaxe de uiSchema
