---
title: "Construir um bloco de exibição personalizado"
description: "Hands-on de plugins NocoBase: usar BlockModel + registerFlow + uiSchema para criar um bloco configurável de exibição de HTML."
keywords: "bloco personalizado,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# Construir um bloco de exibição personalizado

No NocoBase, os blocos são as áreas de conteúdo da página. Este exemplo mostra como criar um bloco personalizado bem simples com `BlockModel` — que permite editar conteúdo HTML pela interface, com o usuário modificando o conteúdo exibido pelo painel de configuração.

Este é o primeiro exemplo que envolve FlowEngine; vamos usar `BlockModel`, `renderComponent`, `registerFlow` e `uiSchema`.

:::tip Dica de leitura prévia

É recomendável conhecer os seguintes tópicos antes:

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criação do plugin e estrutura de diretórios
- [Plugin](../plugin) — entrada do plugin e ciclo de vida `load()`
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico de FlowModel, renderComponent, registerFlow
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de `tExpr()` para tradução adiada

:::

## Resultado final

Vamos criar um bloco "Simple block":

- Aparece no menu "Adicionar bloco"
- Renderiza o conteúdo HTML configurado pelo usuário
- Permite que o usuário edite o HTML pelo painel de configuração (registerFlow + uiSchema)

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

O código-fonte completo está em [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block). Se quiser executar localmente para ver o resultado:

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

A seguir, montamos esse plugin do zero, passo a passo.

## Passo 1: criar o esqueleto do plugin

Na raiz do repositório, execute:

```bash
yarn pm create @my-project/plugin-simple-block
```

Isso gera a estrutura de arquivos básica em `packages/plugins/@my-project/plugin-simple-block`. Para mais detalhes, veja [Escreva seu primeiro plugin](../../write-your-first-plugin).

## Passo 2: criar o modelo do bloco

Crie `src/client-v2/models/SimpleBlockModel.tsx`. Este é o núcleo do plugin — define como o bloco é renderizado e como ele é configurado.

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// 设置区块在「添加区块」菜单里的显示名
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// 注册配置面板，让用户可以编辑 HTML 内容
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // 渲染前执行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema 定义配置面板的表单 UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 配置面板的默认值
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // 把配置面板的值写入 model 的 props
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Pontos-chave:

- **`renderComponent()`** — renderiza a UI do bloco, lendo o conteúdo HTML via `this.props.html`
- **`define()`** — define o nome exibido do bloco no menu "Adicionar bloco". `tExpr()` é usado para tradução adiada, porque `define()` é executado no momento de carregamento do módulo, quando o i18n ainda não está inicializado
- **`registerFlow()`** — adiciona o painel de configuração. `uiSchema` define o formulário usando JSON Schema (consulte a sintaxe em [UI Schema](../../../../flow-engine/ui-schema)); o `handler` grava o valor preenchido pelo usuário em `ctx.model.props`, e o `renderComponent()` consegue lê-lo

## Passo 3: adicionar arquivos multilíngues

Edite os arquivos de tradução em `src/locale/` do plugin, adicionando todas as chaves usadas em `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning Atenção

Adicionar um novo arquivo de idioma pela primeira vez requer reiniciar a aplicação para ter efeito.

:::

Para mais informações sobre escrita de arquivos de tradução e uso de `tExpr()`, veja [i18n internacionalização](../component/i18n).

## Passo 4: registrar no plugin

Edite `src/client-v2/plugin.tsx` e use `registerModelLoaders` para carregar o modelo sob demanda:

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // 按需加载，首次用到时才加载模块
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` usa import dinâmico; o código do modelo só é carregado quando realmente for usado pela primeira vez — esta é a forma de registro recomendada.

## Passo 5: ativar o plugin

```bash
yarn pm enable @my-project/plugin-simple-block
```

Após ativar, crie uma nova página e clique em "Adicionar bloco" — você verá "Simple block". Após adicioná-lo, clique no botão de configuração do bloco para editar o conteúdo HTML.

## Código-fonte completo

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — exemplo completo de bloco de exibição personalizado

## Resumo

Capacidades usadas neste exemplo:

| Capacidade | Uso                                  | Documentação                                  |
| ---------- | ------------------------------------ | --------------------------------------------- |
| Renderização de bloco | `BlockModel` + `renderComponent()` | [FlowEngine → Extensão de blocos](../flow-engine/block) |
| Registro no menu | `define({ label })`            | [Visão geral do FlowEngine](../flow-engine/index.md) |
| Painel de configuração | `registerFlow()` + `uiSchema` | [Visão geral do FlowEngine](../flow-engine/index.md) |
| Registro de modelo | `registerModelLoaders` (carregamento sob demanda) | [Plugin](../plugin)              |
| Tradução adiada | `tExpr()`                          | [i18n internacionalização](../component/i18n) |

## Links relacionados

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criar o esqueleto do plugin do zero
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel e registerFlow
- [FlowEngine → Extensão de blocos](../flow-engine/block) — BlockModel, DataBlockModel, CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — referência da sintaxe de uiSchema
- [Component vs FlowModel](../component-vs-flow-model) — quando usar FlowModel
- [Plugin](../plugin) — entrada do plugin e ciclo de vida load()
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de tExpr
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
