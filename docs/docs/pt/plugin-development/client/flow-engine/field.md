---
title: "Extensão de campos"
description: "Desenvolvimento de extensões de campo no NocoBase: classes base FieldModel e ClickableFieldModel, renderização de campo, vinculação a interfaces de campo."
keywords: "extensão de campos,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# Extensão de campos

No NocoBase, **componentes de campo (Field)** são usados em tabelas e formulários para exibir e editar dados. Ao herdar das classes base relacionadas a FieldModel, você pode personalizar a forma como um campo é renderizado — por exemplo, exibir certo tipo de dado em um formato especial ou usar um componente personalizado para edição.

## Exemplo: campo de exibição personalizado

O exemplo a seguir cria um campo de exibição simples — adiciona colchetes `[]` em torno do valor do campo:

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record 可以拿到当前行的完整记录
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 绑定到 'input' 类型的字段接口
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Pontos-chave:

- **`renderComponent(value)`** — recebe o valor atual do campo como parâmetro e retorna o JSX renderizado
- **`this.context.record`** — obtém o registro completo da linha atual
- **`this.context.recordIndex`** — obtém o índice da linha atual
- **`ClickableFieldModel`** — herda de `FieldModel`, com capacidade de interação por clique
- **`DisplayItemModel.bindModelToInterface()`** — vincula o modelo de campo a um tipo de interface de campo específico (por exemplo, `input` representa campos de texto). Assim, em campos do tipo correspondente, esse componente de exibição estará disponível para seleção

## Registrando o campo

No `load()` do Plugin, registre com `registerModelLoaders` para carregamento sob demanda:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

Após o registro, em um bloco de tabela, encontre uma coluna de campo do tipo correspondente (por exemplo, o exemplo acima foi vinculado a `input`, equivalente a campo de texto de linha única), clique no botão de configuração da coluna e, no menu suspenso "Componente de campo", troque para esse componente de exibição personalizado. Para um exemplo prático completo, veja [Construir um componente de campo personalizado](../examples/custom-field).

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## Código-fonte completo

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — exemplo de componente de campo personalizado

## Links relacionados

- [Hands-on: criar um componente de campo personalizado](../examples/custom-field) — montar do zero um componente de exibição de campo personalizado
- [Hands-on: plugin de gestão de dados com integração front-back](../examples/fullstack-plugin) — aplicação real de campo personalizado em um plugin completo
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel
- [Extensão de blocos](./block) — blocos personalizados
- [Extensão de ações](./action) — botões de ação personalizados
- [FlowDefinition (definição de fluxo)](../../../flow-engine/definitions/flow-definition.md) — parâmetros completos e tipos de eventos do registerFlow
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa
