---
title: "Construir um componente de campo personalizado"
description: "Hands-on de plugins NocoBase: usar ClickableFieldModel para criar um componente de exibição de campo personalizado, vinculando-o à interface do campo."
keywords: "campo personalizado,FieldModel,ClickableFieldModel,bindModelToInterface,extensão de campos,NocoBase"
---

# Construir um componente de campo personalizado

No NocoBase, os componentes de campo são usados em tabelas e formulários para exibir e editar dados. Este exemplo mostra como criar um componente de exibição de campo personalizado com `ClickableFieldModel` — que adiciona colchetes `[]` em torno do valor do campo e o vincula à interface de campo do tipo `input`.

:::tip Dica de leitura prévia

É recomendável conhecer os seguintes tópicos antes:

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criação do plugin e estrutura de diretórios
- [Plugin](../plugin) — entrada do plugin e ciclo de vida `load()`
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel
- [FlowEngine → Extensão de campos](../flow-engine/field) — apresentação das classes base FieldModel e ClickableFieldModel
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de `tExpr()` para tradução adiada

:::

## Resultado final

Vamos criar um componente personalizado de exibição de campo:

- Herda `ClickableFieldModel`, com lógica de renderização personalizada
- Mostra o valor do campo entre `[]`
- Vincula-se ao tipo de campo `input` (texto de linha única) com `bindModelToInterface`

Após ativar o plugin, em um bloco de tabela encontre uma coluna do tipo texto de linha única, clique no botão de configuração da coluna e, no menu suspenso "Componente de campo", você verá a opção `DisplaySimpleFieldModel`. Após trocar, o valor da coluna será exibido no formato `[value]`.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

O código-fonte completo está em [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple). Se quiser executar localmente para ver o resultado:

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

A seguir, montamos esse plugin do zero, passo a passo.

## Passo 1: criar o esqueleto do plugin

Na raiz do repositório, execute:

```bash
yarn pm create @my-project/plugin-field-simple
```

Para mais detalhes, veja [Escreva seu primeiro plugin](../../write-your-first-plugin).

## Passo 2: criar o modelo de campo

Crie `src/client-v2/models/DisplaySimpleFieldModel.tsx`. Este é o núcleo do plugin — define como o campo é renderizado e a qual tipo de interface de campo ele se vincula.

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record 可以拿到当前行的完整记录
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 设置在「字段组件」下拉菜单里的显示名
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// 绑定到 'input'（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

Pontos-chave:

- **`renderComponent(value)`** — recebe o valor atual do campo como parâmetro e retorna o JSX renderizado
- **`this.context.record`** — obtém o registro completo da linha atual
- **`this.context.recordIndex`** — obtém o índice da linha atual
- **`ClickableFieldModel`** — herda de `FieldModel`, com capacidade de interação por clique
- **`define({ label })`** — define o nome exibido no menu suspenso "Componente de campo"; sem isso, o nome da classe é exibido diretamente
- **`DisplayItemModel.bindModelToInterface()`** — vincula o modelo de campo a um tipo de interface específico (por exemplo, `input` representa campos de texto de linha única). Assim, em campos do tipo correspondente, esse componente de exibição estará disponível para seleção

## Passo 3: adicionar arquivos multilíngues

Edite os arquivos de tradução em `src/locale/` do plugin, adicionando as chaves usadas em `tExpr()`:

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## Passo 5: ativar o plugin

```bash
yarn pm enable @my-project/plugin-field-simple
```

Após ativar, em um bloco de tabela encontre uma coluna do tipo texto de linha única, clique no botão de configuração da coluna e, no menu suspenso "Componente de campo", troque para esse componente de exibição personalizado.

## Código-fonte completo

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — exemplo completo de componente de campo personalizado

## Resumo

Capacidades usadas neste exemplo:

| Capacidade            | Uso                                              | Documentação                                  |
| --------------------- | ------------------------------------------------ | --------------------------------------------- |
| Renderização de campo | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → Extensão de campos](../flow-engine/field) |
| Vincular interface de campo | `DisplayItemModel.bindModelToInterface()`  | [FlowEngine → Extensão de campos](../flow-engine/field) |
| Registro de modelo    | `this.flowEngine.registerModelLoaders()`         | [Plugin](../plugin)                           |

## Links relacionados

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criar o esqueleto do plugin do zero
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel
- [FlowEngine → Extensão de campos](../flow-engine/field) — FieldModel, ClickableFieldModel, bindModelToInterface
- [FlowEngine → Extensão de blocos](../flow-engine/block) — blocos personalizados
- [Component vs FlowModel](../component-vs-flow-model) — quando usar FlowModel
- [Plugin](../plugin) — entrada do plugin e ciclo de vida load()
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de tExpr
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
