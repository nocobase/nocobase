:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Crie Seu Primeiro Plugin de Bloco

Antes de começar, recomendamos que você leia o artigo '[Crie Seu Primeiro Plugin](../plugin-development/write-your-first-plugin.md)' para aprender a criar rapidamente um plugin básico. Em seguida, vamos estender essa base adicionando uma funcionalidade simples de **bloco**.

## Passo 1: Crie o Arquivo do Modelo de Bloco

Crie um novo arquivo no diretório do plugin: `client/models/SimpleBlockModel.tsx`

## Passo 2: Escreva o Conteúdo do Modelo

Defina e implemente um modelo de bloco básico no arquivo, incluindo sua lógica de renderização:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Olá, NocoBase!</h1>
        <p>Este é um bloco simples renderizado por SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Bloco Olá'),
});
```

## Passo 3: Registre o Modelo de Bloco

Exporte o modelo recém-criado no arquivo `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Passo 4: Ative e Experimente o Bloco

Após ativar o plugin, você verá a nova opção **Bloco Olá** no menu suspenso "Adicionar Bloco".

Demonstração do efeito:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Passo 5: Adicione Capacidade de Configuração ao Bloco

Em seguida, vamos adicionar uma funcionalidade configurável ao bloco através do **Flow**, permitindo que os usuários editem o conteúdo do bloco na interface.

Continue editando o arquivo `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Bloco Simples'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Fluxo de Bloco Simples'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Editar Conteúdo HTML'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('Conteúdo HTML'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>Este é um bloco simples</h3>
<p>Você pode editar o conteúdo HTML.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Demonstração do efeito:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Resumo

Este artigo mostrou como criar um plugin de bloco simples, incluindo:

- Como definir e implementar um modelo de bloco
- Como registrar um modelo de bloco
- Como adicionar funcionalidade configurável a um bloco através do Flow

Referência do código-fonte completo: [Exemplo de Bloco Simples](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)