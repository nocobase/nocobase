---
title: "Construir um botão de ação personalizado"
description: "Hands-on de plugins NocoBase: usar ActionModel + ActionSceneEnum para criar botões de ação personalizados, com suporte a ações de nível de data table e de registro."
keywords: "ação personalizada,ActionModel,ActionSceneEnum,botão de ação,NocoBase"
---

# Construir um botão de ação personalizado

No NocoBase, ações (Actions) são botões dentro dos blocos usados para disparar lógica de negócio — por exemplo, "Novo", "Editar", "Excluir" etc. Este exemplo mostra como criar botões de ação personalizados com `ActionModel`, controlando os cenários de exibição com `ActionSceneEnum`.

:::tip Dica de leitura prévia

É recomendável conhecer os seguintes tópicos antes; o desenvolvimento ficará mais tranquilo:

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criação do plugin e estrutura de diretórios
- [Plugin](../plugin) — entrada do plugin e ciclo de vida `load()`
- [FlowEngine → Extensão de ações](../flow-engine/action) — introdução básica a ActionModel e ActionSceneEnum
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de `tExpr()` para tradução adiada

:::

## Resultado final

Vamos criar três botões de ação personalizados, correspondentes a três cenários de ação:

- **Ação de nível de data table** (`collection`) — aparece na barra de ações no topo do bloco, ao lado do botão "Novo", por exemplo
- **Ação de nível de registro** (`record`) — aparece na coluna de ações de cada linha da tabela, ao lado de "Editar"/"Excluir", por exemplo
- **Aplicável aos dois cenários** (`both`) — aparece nos dois cenários

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

O código-fonte completo está em [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Se quiser executar localmente para ver o resultado:

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

A seguir, montamos esse plugin do zero, passo a passo.

## Passo 1: criar o esqueleto do plugin

Na raiz do repositório, execute:

```bash
yarn pm create @my-project/plugin-simple-action
```

Para mais detalhes, veja [Escreva seu primeiro plugin](../../write-your-first-plugin).

## Passo 2: criar os modelos de ação

Cada ação precisa declarar o cenário em que aparece, especificado pela propriedade `static scene`:

| Cenário     | Valor                          | Descrição                                |
| ----------- | ------------------------------ | ---------------------------------------- |
| collection  | `ActionSceneEnum.collection`   | Atua sobre a data table, por exemplo o botão "Novo" |
| record      | `ActionSceneEnum.record`       | Atua sobre um único registro, por exemplo botões "Editar"/"Excluir" |
| both        | `ActionSceneEnum.both`         | Pode ser usado nos dois cenários         |

### Ação de nível de data table

Crie `src/client-v2/models/SimpleCollectionActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// 通过 registerFlow 监听点击事件，用 ctx.message 给用户反馈
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Ação de nível de registro

Crie `src/client-v2/models/SimpleRecordActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// 记录级操作可以通过 ctx.model.context 拿到当前行的数据和索引
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Aplicável aos dois cenários

Crie `src/client-v2/models/SimpleBothActionModel.tsx`:

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

A estrutura dos três é idêntica — a diferença está apenas no valor de `static scene` e no texto do botão. Cada botão escuta o evento de clique via `registerFlow({ on: 'click' })` e usa `ctx.message` para mostrar uma notificação, deixando claro para o usuário que o botão funcionou.

## Passo 3: adicionar arquivos multilíngues

Edite os arquivos de tradução em `src/locale/` do plugin:

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Atenção

Adicionar um novo arquivo de idioma pela primeira vez requer reiniciar a aplicação para ter efeito.

:::

Para mais informações sobre escrita de arquivos de tradução e uso de `tExpr()`, veja [i18n internacionalização](../component/i18n).

## Passo 4: registrar no plugin

Edite `src/client-v2/plugin.tsx` e use `registerModelLoaders` para carregamento sob demanda:

```ts
// src/client-v2/plugin.tsx
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

export default PluginSimpleActionClient;
```

## Passo 5: ativar o plugin

```bash
yarn pm enable @my-project/plugin-simple-action
```

Após ativar, em "Configurar ações" do bloco de tabela você poderá adicionar esses botões de ação personalizados.

## Código-fonte completo

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — exemplo completo dos três cenários de ação

## Resumo

Capacidades usadas neste exemplo:

| Capacidade | Uso                                          | Documentação                                   |
| ---------- | -------------------------------------------- | ---------------------------------------------- |
| Botão de ação | `ActionModel` + `static scene`             | [FlowEngine → Extensão de ações](../flow-engine/action) |
| Cenário de ação | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Extensão de ações](../flow-engine/action) |
| Registro no menu | `define({ label })`                      | [Visão geral do FlowEngine](../flow-engine/index.md) |
| Registro de modelo | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin)                          |
| Tradução adiada | `tExpr()`                                 | [i18n internacionalização](../component/i18n) |

## Links relacionados

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criar o esqueleto do plugin do zero
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel
- [FlowEngine → Extensão de ações](../flow-engine/action) — ActionModel, ActionSceneEnum
- [FlowEngine → Extensão de blocos](../flow-engine/block) — blocos personalizados
- [FlowEngine → Extensão de campos](../flow-engine/field) — componentes de campo personalizados
- [Component vs FlowModel](../component-vs-flow-model) — quando usar FlowModel
- [Plugin](../plugin) — entrada do plugin e ciclo de vida load()
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de tExpr
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
