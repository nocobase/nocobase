---
title: "Extensão de ações"
description: "Desenvolvimento de extensões de ação no NocoBase: classe base ActionModel, ActionSceneEnum (cenários de ação), botões de ação personalizados."
keywords: "extensão de ações,Action,ActionModel,ActionSceneEnum,botão de ação,NocoBase"
---

# Extensão de ações

No NocoBase, **ações (Actions)** são botões dentro dos blocos usados para disparar lógica de negócio — por exemplo, "Novo", "Editar", "Excluir" etc. Ao herdar a classe base `ActionModel`, você pode adicionar botões de ação personalizados.

## Cenários de ação

Cada ação precisa declarar o cenário em que aparece, especificado pela propriedade `static scene`:

| Cenário     | Valor                          | Descrição                                  |
| ----------- | ------------------------------ | ------------------------------------------ |
| collection  | `ActionSceneEnum.collection`   | Atua sobre a data table, por exemplo o botão "Novo" |
| record      | `ActionSceneEnum.record`       | Atua sobre um único registro, por exemplo botões "Editar", "Excluir" |
| both        | `ActionSceneEnum.both`         | Pode ser usado nos dois cenários           |
| all         | `ActionSceneEnum.all`          | Disponível em todos os cenários (incluindo contextos especiais como modais) |

## Exemplos

### Ação de nível de data table

Atua sobre toda a data table, aparecendo na barra de ações no topo do bloco:

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Ação de nível de registro

Atua sobre um único registro, aparecendo na coluna de ações de cada linha da tabela:

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Aplicável aos dois cenários

Se a ação não diferencia cenários, use `ActionSceneEnum.both`:

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

A estrutura dos três é idêntica — a diferença está apenas no valor de `static scene` e no texto do botão em `defaultProps`.

## Registrando a ação

No `load()` do Plugin, registre com `registerModelLoaders` para carregamento sob demanda:

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

Após o registro, em "Configurar ações" do bloco você poderá adicionar seus botões de ação personalizados.

## Código-fonte completo

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — exemplo completo dos três cenários de ação

## Links relacionados

- [Hands-on: criar um botão de ação personalizado](../examples/custom-action) — montar do zero botões de ação para os três cenários
- [Hands-on: plugin de gestão de dados com integração front-back](../examples/fullstack-plugin) — aplicação real de ação personalizada + ctx.viewer.dialog em um plugin completo
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel
- [Extensão de blocos](./block) — blocos personalizados
- [Extensão de campos](./field) — componentes de campo personalizados
- [FlowDefinition (definição de fluxo)](../../../flow-engine/definitions/flow-definition.md) — parâmetros completos e tipos de eventos do registerFlow
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa
