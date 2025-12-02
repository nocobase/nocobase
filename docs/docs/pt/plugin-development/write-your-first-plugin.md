:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Escreva Seu Primeiro Plugin

Este guia vai te mostrar como criar um plugin de bloco do zero que pode ser usado em páginas, te ajudando a entender a estrutura básica e o fluxo de trabalho de desenvolvimento de plugins NocoBase.

## Pré-requisitos

Antes de começar, certifique-se de que você já instalou o NocoBase com sucesso. Se ainda não instalou, você pode consultar os seguintes guias de instalação:

- [Instalar usando create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalar a partir do código-fonte Git](/get-started/installation/git)

Após a instalação ser concluída, você pode oficialmente iniciar sua jornada de desenvolvimento de plugins.

## Passo 1: Crie o Esqueleto do Plugin via CLI

Execute o seguinte comando no diretório raiz do repositório para gerar rapidamente um plugin vazio:

```bash
yarn pm create @my-project/plugin-hello
```

Após o comando ser executado com sucesso, ele irá gerar arquivos básicos no diretório `packages/plugins/@my-project/plugin-hello`. A estrutura padrão é a seguinte:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Exporta o plugin de servidor por padrão
     ├─ client                   # Localização do código do lado do cliente
     │  ├─ index.tsx             # Classe do plugin do lado do cliente exportada por padrão
     │  ├─ plugin.tsx            # Entrada do plugin (estende @nocobase/client Plugin)
     │  ├─ models                # Opcional: modelos de frontend (como nós de fluxo)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Localização do código do lado do servidor
     │  ├─ index.ts              # Classe do plugin do lado do servidor exportada por padrão
     │  ├─ plugin.ts             # Entrada do plugin (estende @nocobase/server Plugin)
     │  ├─ collections           # Opcional: coleções do lado do servidor
     │  ├─ migrations            # Opcional: migrações de dados
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Opcional: multi-idioma
        ├─ en-US.json
        └─ zh-CN.json
```

Após a criação, você pode acessar a página do gerenciador de plugins no seu navegador (URL padrão: http://localhost:13000/admin/settings/plugin-manager) para confirmar se o plugin aparece na lista.

## Passo 2: Implemente um Bloco Cliente Simples

Em seguida, vamos adicionar um modelo de bloco personalizado ao plugin para exibir uma mensagem de boas-vindas.

1. **Crie um novo arquivo de modelo de bloco** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Registre o modelo de bloco**. Edite `client/models/index.ts` para exportar o novo modelo para carregamento em tempo de execução no frontend:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Após salvar o código, se você estiver executando um script de desenvolvimento, deverá ver os logs de hot-reload na saída do terminal.

## Passo 3: Ative e Teste o Plugin

Você pode habilitar o plugin via linha de comando ou interface:

- **Linha de Comando**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Interface de Gerenciamento**: Acesse o gerenciador de plugins, encontre `@my-project/plugin-hello` e clique em "Ativar".

Após a ativação, crie uma nova página "Modern page (v2)". Ao adicionar blocos, você verá o "Hello block". Insira-o na página para ver o conteúdo de boas-vindas que você acabou de escrever.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Passo 4: Construa e Empacote

Quando você estiver pronto para distribuir o plugin para outros ambientes, precisará primeiro construí-lo e depois empacotá-lo:

```bash
yarn build @my-project/plugin-hello --tar
# Ou execute em duas etapas
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Dica: Se o plugin for criado no repositório de código-fonte, a primeira construção irá acionar uma verificação de tipo de todo o repositório, o que pode levar algum tempo. Recomenda-se garantir que as dependências estejam instaladas e que o repositório esteja em um estado construível.

Após a construção ser concluída, o arquivo empacotado estará localizado por padrão em `storage/tar/@my-project/plugin-hello.tar.gz`.

## Passo 5: Faça o Upload para Outro Aplicativo NocoBase

Faça o upload e extraia para o diretório `./storage/plugins` do aplicativo de destino. Para mais detalhes, consulte [Instalar e Atualizar Plugins](../get-started/install-upgrade-plugins.mdx).